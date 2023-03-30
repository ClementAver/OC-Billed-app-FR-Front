/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Logout from "../containers/Logout.js";
//import store from "../app/Store.js";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";

// mockStore will replace Store when the code tries to import it.
jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeAll(() => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
    });

    beforeEach(() => {
      const html = NewBillUI();
      document.body.innerHTML = html;
    });

    afterEach(() => {
      document.body.innerHTML = "";
    });

    test("Then mail icon in vertical layout should be highlighted", async () => {
      document.body.innerHTML = "";
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getAllByTestId("icon-mail"));
      const mailIcon = screen.getAllByTestId("icon-mail")[0];
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
        const NewBillInit = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
        const file = screen.getByTestId("file");
        const handleChangeFile = jest.fn((e) => NewBillInit.handleChangeFile(e));
        const pj = new File(["justif"], "justif.png", {
          type: "image/png",
        });
        userEvent.upload(file, pj);
        const changeEvent = new Event("change");
        file.addEventListener("change", handleChangeFile);
        fireEvent(file, changeEvent);
        const invalidMessage = document.querySelector(".invalid-message");

        expect(handleChangeFile).toHaveBeenCalled();
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
        userEvent.selectOptions(screen.getByTestId("expense-type"), "Transports");
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
        expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
      });
    });
  });
});

/*
// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  // mockStore will replace Store when the code tries to import it.
  jest.mock("../app/Store", () => mockStore);
  describe("When I am on NewBill Page", () => {
    test("Then a bill is added to mock API POST", async () => {
      jest.spyOn(mockStore, "bills");
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
      //
      const bill = {
        email: "a@a",
        type: "Transports",
        name: "Train Toulouse - Lavilledieu",
        amount: 12,
        date: "2023-03-23",
        vat: "2",
        pct: 20,
        commentary: "R.A.S.",
        fileUrl: "https://www.perdu.com/justif.png",
        fileName: "justif.png",
        status: "pending",
      };
    });
  });
});
*/
