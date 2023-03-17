/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
// import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
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
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
    });

    test("Then bills should be ordered from earliest to latest", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      let bills = new Bills({ document, onNavigate, store: mockStore, localStorage: null });
      let sortedBills = await bills.getBills();
      const dates = sortedBills.map((bill) => bill.date);
      const antiChrono = (a, b) => (a.date < b.date ? 1 : -1);
      const datesSorted = dates.sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
});
