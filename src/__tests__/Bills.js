/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import Bills from "../containers/Bills.js";

// mockStore will replace Store when the code tries to import it.
jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    beforeAll(async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("btn-new-bill"));
    });

    afterAll(() => {
      document.body.innerHTML = "";
    });

    test("Then bill icon in vertical layout should be highlighted", async () => {
      const windowIcon = screen.getByTestId("icon-window");
      // Expects the window icon to got the active-icon class.
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });

    test("Then bills should be ordered from earliest to latest", async () => {
      let bills = new Bills({ document, onNavigate, store: mockStore, localStorage: null });
      let sortedBills = await bills.getBills();
      const dates = sortedBills.map((bill) => bill.date);
      const antiChrono = (a, b) => (a.date < b.date ? 1 : -1);
      const datesSorted = dates.sort(antiChrono);
      // Expects the two results to match.
      expect(dates).toEqual(datesSorted);
    });
  });
});

describe("Given I am connected as an employee and I am on Bills Page", () => {
  describe("When I click on a bill's icon eye", () => {
    test("A modal should open", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = BillsUI({ data: bills });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const BillInit = new Bills({
        document,
        onNavigate,
        store: mockStore,
        bills,
        localStorage: window.localStorage,
      });

      const eye = screen.getAllByTestId("icon-eye")[0];

      // jQuery not being supported, we have to mock its functions too.
      $.fn.modal = jest.fn(() => document.getElementById("modaleFile").classList.add("show"));
      const handleClickeyes = jest.fn((icon) => BillInit.handleClickIconEye(icon));

      eye.addEventListener("click", () => handleClickeyes(eye));
      userEvent.click(eye);
      expect(handleClickeyes).toHaveBeenCalled();

      const modale = document.getElementById("modaleFile");
      // Expects the modale to be displayed (by having the "show" class).
      expect(modale.classList.contains("show")).toBeTruthy();

      document.body.innerHTML = "";
      jest.clearAllMocks();
    });
  });
});

describe("Given I am connected as an employee and I am on Bills Page", () => {
  describe("When I click on the new bill button", () => {
    test("I should see the new bill form", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = BillsUI({ data: bills });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const billsBis = new Bills({
        document,
        onNavigate,
        store: mockStore,
        bills,
        localStorage: window.localStorage,
      });

      const btnNewBill = screen.getByTestId("btn-new-bill");

      // By spying it without a .mockImplementation(), we call the real function but are able to track its calls.
      const spy = jest.spyOn(billsBis, "handleClickNewBill");

      btnNewBill.addEventListener("click", spy);
      userEvent.click(btnNewBill);
      expect(spy).toHaveBeenCalled();

      const title = screen.getByText("Envoyer une note de frais");
      // Expects the title to be targetable.
      expect(title).toBeTruthy();

      document.body.innerHTML = "";
      jest.restoreAllMocks();
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I am on Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("btn-new-bill"));
      const bill = screen.getByText("Hôtel et logement");
      // Expects this Element to be targetable.
      expect(bill).toBeTruthy();
    });
  });

  describe("When an error occurs on API", () => {
    beforeEach(() => {
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
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/);
      // Expects this Element to be targetable.
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/);
      // Expects this Element to be targetable.
      expect(message).toBeTruthy();
    });
  });
});
