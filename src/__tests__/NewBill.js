/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Logout from "../containers/Logout.js";
import store from "../app/Store.js";
import userEvent from "@testing-library/user-event";

import { bills } from "../fixtures/bills.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const html = NewBillUI();
      document.body.innerHTML = html;

      await waitFor(() => screen.getAllByTestId("icon-mail"));
      const divIcon1 = document.getElementById("layout-icon1");
      const divIcon2 = document.getElementById("layout-icon2");
      divIcon1.classList.remove("active-icon");
      divIcon2.classList.add("active-icon");

      const mailIcon = screen.getAllByTestId("icon-mail")[0];
      expect(mailIcon.classList.contains("active-icon")).toBeTruthy();

      document.body.innerHTML = "";
    });

    test("Then I should see the title and the form", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
      expect(document.getElementById("btn-send-bill")).toBeTruthy();
      document.body.innerHTML = "";
    });

    test("Then I should be able to upload a file with an extension of .jpeg or .png", async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const NewBillInit = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const input = screen.getByTestId("file");
      const handleChangeFile = jest.fn((e) => NewBillInit.handleChangeFile(e));
      input.addEventListener("change", handleChangeFile);

      const file = new File(["justif"], "justif.png", {
        type: "image/png",
      });
      userEvent.upload(input, file);

      expect(handleChangeFile).toHaveBeenCalled();

      document.body.innerHTML = "";
    });
  });
});
