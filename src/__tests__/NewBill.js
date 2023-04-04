/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

// mockStore will replace Store when the code tries to import it.
jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // Executes the code one time before running the test suite.
    beforeAll(() => {
      // Assigns the mocked localStorage to the localStorage property on the window object.
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      // Creates or assings the user property of localStorage with an object representing an employee.
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
    });
    beforeEach(() => {
      // Executes the code before running every test in the test suite.
      // Assings html with the value returned by NewBillUI (the bill submisson form).
      const html = NewBillUI();
      // Then appends it to the DOM.
      document.body.innerHTML = html;
    });
    // Executes the code after running every test in the test suite.
    afterEach(() => {
      // Empties the DOM.
      document.body.innerHTML = "";
    });

    test("Then mail icon in vertical layout should be highlighted", async () => {
      /*
        DOM is wiped before stating any other instruction because we need the vertical Layout to be appened,
        which is managed by the router function.
      */
      document.body.innerHTML = "";
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      // Appends the new bill page.
      window.onNavigate(ROUTES_PATH.NewBill);
      // Waits for an targeted element to be present into the DOM.
      await waitFor(() => screen.getAllByTestId("icon-mail"));
      const mailIcon = screen.getAllByTestId("icon-mail")[0];
      // Expects the mail icon to got the active-icon class.
      expect(mailIcon.classList.contains("active-icon")).toBeTruthy();
    });

    test("Then I should see the title and the form", async () => {
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
      expect(document.getElementById("btn-send-bill")).toBeTruthy();
    });

    describe("When I want to upload a file", () => {
      test("Then I should be able to upload a file with an extension of .jpeg or .png", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        // Instanciates the NewBill class.
        const NewBillInit = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
        // Assigns the "Justificatif" input to a constant.
        const file = screen.getByTestId("file");
        // Mocks the handleChangeFile method.
        const handleChangeFile = jest.fn((e) => NewBillInit.handleChangeFile(e));
        // Creates a new File object.
        const pj = new File(["justif"], "justif.png", {
          type: "image/png",
        });
        // Simulates an upload of that file from an user.
        userEvent.upload(file, pj);
        // Creates a new "change" Event.
        const changeEvent = new Event("change");
        // Ties a listener on the "Justificatif" input.
        file.addEventListener("change", handleChangeFile);
        // Fires the event
        fireEvent(file, changeEvent);

        const invalidMessage = document.querySelector(".invalid-message");
        expect(handleChangeFile).toHaveBeenCalled();
        // The file's format is right, so the "invalid" message is expected not to be displayed.
        expect(invalidMessage.classList.contains("display")).toBeFalsy();
      });

      test("Then I shouldn't be able to upload a file with an extension other than .jpeg or .png", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const NewBillInit = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const file = screen.getByTestId("file");
        const handleChangeFile = jest.fn((e) => NewBillInit.handleChangeFile(e));
        const pj = new File(["justif"], "justif.tiff", {
          type: "image/tif",
        });
        userEvent.upload(file, pj);
        const changeEvent = new Event("change");
        file.addEventListener("change", handleChangeFile);
        fireEvent(file, changeEvent);
        const invalidMessage = document.querySelector(".invalid-message");

        expect(handleChangeFile).toHaveBeenCalled();
        // The file's format isn't right, so the "invalid" message is expected to be displayed.
        expect(invalidMessage.classList.contains("display")).toBeTruthy();
      });
    });

    describe("When I submit a valid bill", () => {
      test("Then I should navigate to the bills page", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const NewBillInit = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        await waitFor(() => screen.getByTestId("file"));
        // Emulates an option selection by an user.
        userEvent.selectOptions(screen.getByTestId("expense-type"), "Transports");
        // Emulates an keyboard interaction by an user.
        userEvent.type(screen.getByTestId("expense-name"), "Train Toulouse - Lavilledieu");
        userEvent.type(screen.getByTestId("datepicker"), "2023-03-23");
        userEvent.type(screen.getByTestId("amount"), "12");
        userEvent.type(screen.getByTestId("vat"), "2");
        userEvent.type(screen.getByTestId("pct"), "20");
        userEvent.type(screen.getByTestId("commentary"), "R.A.S.");
        const file = screen.getByTestId("file");
        const handleChangeFile = jest.fn((e) => NewBillInit.handleChangeFile(e));
        const pj = new File(["justif"], "justif.png", {
          type: "image/png",
        });
        // Emulates an upload by an user.
        userEvent.upload(file, pj);

        const changeEvent = new Event("change");
        file.addEventListener("change", handleChangeFile);
        fireEvent(file, changeEvent);

        const handleSubmit = jest.fn((e) => NewBillInit.handleSubmit(e));
        const formNewBill = document.querySelector(`form[data-testid="form-new-bill"]`);
        formNewBill.addEventListener("submit", handleSubmit);
        const submitEvent = new Event("submit");
        fireEvent(formNewBill, submitEvent);

        expect(handleSubmit).toHaveBeenCalled();
        /*
          if the submission is successful, we should be back to the bill page,
          and so the right title should e displayed.
        */
        expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
      });
    });
  });
});

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  // mockStore will replace Store when the code tries to import it.
  jest.mock("../app/Store", () => mockStore);

  describe("When I am on NewBill Page", () => {
    test("Then a bill is added to mock API POST", async () => {
      // Mocks the bills method of the mockStore object, to be able to track it down.
      jest.spyOn(mockStore, "bills");
      // Mocks the error method of the console object, then replaces his content with the mockImplementation method.
      jest.spyOn(console, "error").mockImplementation(() => {});
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // States that create method of the mockStore.bills property will return a rejected promise with a value of false once.
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: jest.fn().mockRejectedValueOnce(false),
        };
      });
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      const fileInput = screen.queryAllByTestId("file")[0];
      const fakeFile = new File(["fake"], "fake.png", { type: "image/png" });
      userEvent.upload(fileInput, fakeFile);

      const fnhandleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);

      try {
        fireEvent.click(fileInput, fnhandleChangeFile);
      } catch (err) {
        // Expects an error to be caught with a description matching "error" given the create method will throw when called.
        expect(err).toMatch("error");
      }
    });
  });
});
