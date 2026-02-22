import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

import logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logging = logger(__filename);

puppeteer.use(StealthPlugin());

class WebHandler {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      // headless: false,
      args: [
        "--disable-blink-features=AutomationControlled", // Hide automation
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Set a human User-Agent
    await this.page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  }

  // Helper - Human like delay function (randomizing delays)
  async humanDelay(min = 1500, max = 3500) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Close web browser in the end
  destroy() {
    logging.info(`Web browser closed`);
    this.browser.close();
  }

  // Login to koko platfrom
  async kokoLogin(requestedPlatfrom, user, password) {
    try {
      logging.info(`1. Go to main login page - ${requestedPlatfrom}`);
      const url = "https://merchant-v2.paykoko.com/login";
      await this.page.goto(url, { waitUntil: "networkidle2" });

      await this.humanDelay(2000, 3500);

      logging.info(`2. Enter User Name - ${requestedPlatfrom}`);
      await this.page.waitForSelector("#input-1");
      await this.humanDelay(500, 1000);
      await this.page.type("#input-1", user, { delay: 150 }); // Types with delay per character

      logging.info(`3. Enter Password - ${requestedPlatfrom}`);
      await this.page.waitForSelector("#input-2");
      await this.humanDelay(1000, 2000);
      await this.page.type("#input-2", password, { delay: 200 });

      logging.info(`Waiting untail login button avilable to click - ${requestedPlatfrom}`);

      await this.page.waitForFunction(() => {
        const btn = document.querySelector("button.btn.btn-dark");
        return btn && !btn.disabled;
      });

      await this.humanDelay(1200, 2000);

      logging.info(`4. Click Login Button - ${requestedPlatfrom}`);

      await this.page.evaluate(() => {
        const btn = document.querySelector("button.btn.btn-dark");
        btn.click();
      });

      await this.page.waitForNavigation({ waitUntil: "networkidle0" });
      logging.info(`Login Complete - ${requestedPlatfrom}`);
      return true;
    } catch (error) {
      logging.error(`Login failed - ${requestedPlatfrom}: ${error.message}`);
      return false;
    }
  }

  async mintPayLogin(requestedPlatfrom, user, password) {
    try {
      logging.info(`1. Go to main login page - ${requestedPlatfrom}`);
      const url = "https://merchant.mintpay.lk/auth/signin";
      await this.page.goto(url, { waitUntil: "networkidle2" });

      await this.humanDelay(2000, 3000);

      logging.info(`2. Enter User Name - ${requestedPlatfrom}`);
      await this.page.waitForSelector("#email-or-phone-input");
      await this.humanDelay(1000, 2000);
      await this.page.type("#email-or-phone-input", user, { delay: 150 }); // Types with delay per character

      logging.info(`3. Enter Password - ${requestedPlatfrom}`);
      await this.page.waitForSelector("#password-input");
      await this.humanDelay(1000, 2000);
      await this.page.type("#password-input", password, { delay: 200 });

      logging.info(
        `Waiting untail login button avilable to click - ${requestedPlatfrom}`,
      );

      await this.page.waitForSelector('[data-testid="login-button"]');

      await this.humanDelay(1000, 1500);

      logging.info(`4. Click Login Button - ${requestedPlatfrom}`);
      await this.page.click('[data-testid="login-button"]');

      await this.page.waitForNavigation({ waitUntil: "networkidle0" });
      logging.info(`Login Complete - ${requestedPlatfrom}`);

      return true;
    } catch (error) {
      logging.error(`Login failed - ${requestedPlatfrom}: ${error.message}`);
      return false;
    }
  }

  async directPayLogin(requestedPlatfrom, user, password) {
    try {
      logging.info(`1. Go to main login page - ${requestedPlatfrom}`);
      const url = "https://dashboard.directpay.lk/login";
      await this.page.goto(url, { waitUntil: "networkidle2" });

      await this.humanDelay(2000, 3000);

      logging.info(`2. Enter User Name - ${requestedPlatfrom}`);
      await this.page.waitForSelector("#email");
      await this.humanDelay(1000, 2000);
      await this.page.type("#email", user, { delay: 150 }); // Types with delay per character

      logging.info(`3. Enter Password - ${requestedPlatfrom}`);
      await this.page.waitForSelector("#password");
      await this.humanDelay(1000, 2000);
      await this.page.type("#password", password, { delay: 200 });

      logging.info(
        `Waiting untail login button avilable to click - ${requestedPlatfrom}`,
      );

      await this.page.waitForSelector("#login");

      await this.humanDelay(1000, 1500);

      logging.info(`4. Click Login Button - ${requestedPlatfrom}`);
      await this.page.click("#login");

      await this.page.waitForNavigation({ waitUntil: "networkidle0" });
      logging.info(`Login Complete - ${requestedPlatfrom}`);

      return true;
    } catch (error) {
      logging.error(`Login failed - ${requestedPlatfrom}: ${error.message}`);
      return false;
    }
  }

  // KOKO pay data extraction
  async kokoExtractProcess(requestedPlatfrom) {
    try {
      const url = "https://merchant-v2.paykoko.com/dashboard/orders/list";

      await this.humanDelay(3000, 4000);
      logging.info(`5. Goto Order History - ${requestedPlatfrom}`);
      await this.page.goto(url, { waitUntil: "networkidle2" });

      logging.info(`Waiting for data rows to populate - ${requestedPlatfrom}`);
      await this.page.waitForSelector("button.btn-warning.btn-sm", {
        visible: true,
      });

      await this.humanDelay(2000, 3000);

      logging.info(`6. Extract table data - ${requestedPlatfrom}`);

      const data = await this.page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll("table.table tbody tr"),
        );

        return rows.map((row) => {
          const cells = Array.from(row.querySelectorAll("td, th"));
          const values = cells.map((cell) => cell.innerText);

          const dateObj = new Date(values[0]);
          const year = dateObj.getFullYear();
          let month = dateObj.getMonth() + 1;
          let day = dateObj.getDate();

          if (month < 10) month = `0${month}`;
          if (day < 10) day = `0${month}`;

          const formatedDate = `${year}/${month}/${day}`;

          return {
            date: formatedDate,
            id: `#${values[1]}`,
            amount: values[2],
            afterDiscountAmount: values[3],
            customerName: values[4],
            customerPhone: `#${values[5]}`,
            orderId: `#${values[7]}`,
            user: values[9],
            day: "",
          };
        });
      });

      logging.info(`7. Reverse the array - ${requestedPlatfrom}`);
      const output = data.slice(0, 10).reverse();

      logging.info(
        `8. Write data into ${requestedPlatfrom}.json file - ${requestedPlatfrom}`,
      );
      fs.writeFileSync(
        `${requestedPlatfrom}.json`,
        JSON.stringify(output, null, 2),
      );

      logging.info(
        `Records saved to ${requestedPlatfrom}.json file - ${requestedPlatfrom}`,
      );

      await this.humanDelay(2500, 3000);
      logging.info(
        `9. Click the menu button to get logout button - ${requestedPlatfrom}`,
      );

      await this.page.evaluate(() => {
        const btn = document.querySelector(
          "button.btn.btn-black.dropdown-toggle.header-item",
        );

        btn.click();
      });

      await this.humanDelay(1000, 2000);

      logging.info(`10. Click the logout button - ${requestedPlatfrom}`);
      await this.page.evaluate(() => {
        const btn = document.querySelector("div.dropdown-item.text-danger");
        btn.click();
      });

      await this.page.waitForNavigation({ waitUntil: "networkidle0" });
      logging.info(`Logout scussfully - ${requestedPlatfrom}`);

      await this.humanDelay(1000, 2000);

      return true;
    } catch (error) {
      console.error(
        `Extraction failed - ${requestedPlatfrom}: ${error.message}`,
      );
      return false;
    }
  }

  async mintPayExtractProcess(requestedPlatfrom) {
    try {
      const url = "https://merchant.mintpay.lk/order-history";

      await this.humanDelay(2500, 3000);

      logging.info(`5. Goto Order History - ${requestedPlatfrom}`);
      await this.page.goto(url, { waitUntil: "networkidle2" });

      logging.info(`Waiting for data rows to populate - ${requestedPlatfrom}`);

      await this.page.waitForFunction(
        () => {
          const divs = Array.from(document.querySelectorAll("div"));
          return divs.some((div) => div.textContent.trim() === "Received");
        },
        { timeout: 15000 },
      );

      await this.humanDelay(2000, 3000);

      logging.info(`6. Extract table data - ${requestedPlatfrom}`);

      const data = await this.page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll("table tbody tr"));

        return rows.map((row) => {
          const cells = Array.from(row.querySelectorAll("td"));
          const values = cells.map(
            (cell) => cell.querySelector("div").innerText,
          );

          const dateObj = new Date(values[3]);
          const year = dateObj.getFullYear();
          let month = dateObj.getMonth() + 1;
          let day = dateObj.getDate();

          if (month < 10) month = `0${month}`;
          if (day < 10) day = `0${month}`;

          const formatedDate = `${year}/${month}/${day}`;

          const shortDayName = dateObj.toLocaleDateString(undefined, {
            weekday: "short",
          });

          const amount = values[4].slice(4);
          const amountWithoutCommas = amount.replace(/,/g, "");

          return {
            id: `#${values[0]}`,
            orderId: `#${values[1]}`,
            date: formatedDate,
            amount: parseFloat(amountWithoutCommas).toFixed(2),
            afterDiscountAmount: "",
            customerName: "",
            customerPhone: "",
            user: values[6],
            day: shortDayName,
          };
        });
      });

      logging.info(`7. Reverse the array - ${requestedPlatfrom}`);
      const output = data.reverse();

      logging.info(
        `8. Write data into ${requestedPlatfrom}.json file - ${requestedPlatfrom}`,
      );
      fs.writeFileSync(
        `${requestedPlatfrom}.json`,
        JSON.stringify(output, null, 2),
      );

      logging.info(
        `Records saved to ${requestedPlatfrom}.json file - ${requestedPlatfrom}`,
      );

      await this.humanDelay(2000, 3500);

      return true;
    } catch (error) {
      console.error(
        `Extraction failed - ${requestedPlatfrom}: ${error.message}`,
      );
      return false;
    }
  }

  async directPayExtractProcess(requestedPlatfrom) {
    try {
      const url =
        "https://dashboard.directpay.lk/merchant/transactions?status=approve";

      await this.humanDelay(2500, 3000);

      logging.info(`5. Goto All Transactions - ${requestedPlatfrom}`);
      await this.page.goto(url, { waitUntil: "networkidle2" });

      logging.info(`Waiting for data rows to populate - ${requestedPlatfrom}`);

      await this.page.waitForFunction(
        () => {
          const table = document.querySelector("#transactionTable");
          // This returns true only if the table exists AND has at least one row in the body
          return table && table.querySelectorAll("tbody tr").length >= 10;
        },
        { timeout: 15000 },
      );

      await this.humanDelay(2000, 3000);

      logging.info(`6. Extract table data - ${requestedPlatfrom}`);

      const data = await this.page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll("#transactionTable tbody tr"),
        );

        return rows.map((row) => {
          const cells = Array.from(row.querySelectorAll("td"));
          const values = cells.map((cell) => cell.innerText);

          let formatedDate = values[1].slice(0, 11).split("-");

          const dateObj = new Date(
            `${formatedDate[1]} ${formatedDate[0]} ${formatedDate[2]}`,
          );

          const year = dateObj.getFullYear();
          let month = dateObj.getMonth() + 1;
          let day = dateObj.getDate();

          if (month < 10) month = `0${month}`;
          if (day < 10) day = `0${month}`;

          formatedDate = `${year}/${month}/${day}`;

          const shortDayName = dateObj.toLocaleDateString(undefined, {
            weekday: "short",
          });

          const amount = values[5];
          const amountWithoutCommas = amount.replace(/,/g, "");
          // PAYMENT_LINK

          return {
            id: `#${values[0]}`,
            orderId: ``,
            date: formatedDate,
            amount: parseFloat(amountWithoutCommas).toFixed(2),
            afterDiscountAmount: "",
            customerName: values[2],
            customerPhone: values[3],
            user: values[4],
            day: shortDayName,
          };
        });
      });

      logging.info(`7. Reverse the array - ${requestedPlatfrom}`);
      const output = data.reverse();

      logging.info(
        `8. Write data into ${requestedPlatfrom}.json file - ${requestedPlatfrom}`,
      );
      fs.writeFileSync(
        `${requestedPlatfrom}.json`,
        JSON.stringify(output, null, 2),
      );

      logging.info(
        `Records saved to ${requestedPlatfrom}.json file - ${requestedPlatfrom}`,
      );

      await this.humanDelay(2500, 3000);
      logging.info(
        `9. Click the menu button to get logout button - ${requestedPlatfrom}`,
      );

      await this.page.evaluate(() => {
        const btn = document.querySelector("#UserDropdown");
        btn.click();
      });

      await this.humanDelay(2000, 2800);

      logging.info(`10. Click the logout button - ${requestedPlatfrom}`);
      await this.page.waitForSelector('a[href="/logout"]');
      const logoutButton = await this.page.$('a[href="/logout"]');
      logoutButton.click();

      await this.page.waitForNavigation({ waitUntil: "networkidle0" });
      logging.info(`Logout scussfully - ${requestedPlatfrom}`);

      await this.humanDelay(1000, 2000);

      return true;
    } catch (error) {
      console.error(
        `Extraction failed - ${requestedPlatfrom}: ${error.message}`,
      );
      return false;
    }
  }
}

export default WebHandler;
