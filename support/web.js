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
      args: [
        "--disable-blink-features=AutomationControlled", // Hide automation
      ],
    });

    this.page = await this.browser.newPage();
    // await this.page.setViewport({ width: 1920, height: 1080 });

    // Set a human User-Agent
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
  }

  // Helper - Human like delay function (randomizing delays)
  async humanDelay(min = 1500, max = 3500) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  destroy() {
    this.browser.close();
  }

  async kokoLogin(user, password) {
    try {
      const url = "https://merchant-v2.paykoko.com/login";
      await this.page.goto(url, { waitUntil: "networkidle2" });

      logging.info("1. Enter User Name");
      await this.page.waitForSelector("#input-1");
      await this.humanDelay(1000, 2000);
      await this.page.type("#input-1", user, { delay: 150 }); // Types with delay per character

      logging.info("2. Enter Password");
      await this.page.waitForSelector("#input-2");
      await this.humanDelay(1000, 2000);
      await this.page.type("#input-2", password, { delay: 200 });

      logging.info("Waiting untail login button avilable to click");
      // Wait for button to be enabled (Koko validation logic)
      await this.page.waitForFunction(() => {
        const btn = document.querySelector("button.btn.btn-dark");
        return btn && !btn.disabled;
      });

      await this.humanDelay(1000, 1500);

      // JavaScript Click (bypassing interceptions)
      logging.info("3. Click Login Button");
      await this.page.evaluate(() => {
        const btn = document.querySelector("button.btn.btn-dark");
        btn.click();
      });

      await this.page.waitForNavigation({ waitUntil: "networkidle0" });
      logging.info("Koko Login Done");
      return true;
    } catch (error) {
      logging.error(`Login failed: ${error.message}`);
      return false;
    }
  }

  async kokoExtractProcess() {
    try {
      const url = "https://merchant-v2.paykoko.com/dashboard/orders/list";

      await this.humanDelay(2500, 3000);
      logging.info("4. Goto Orders");
      await this.page.goto(url, { waitUntil: "networkidle2" });

      // Wait for Refund button (same "ready" signal as Python)
      logging.info("Waiting for data rows to populate...");
      await this.page.waitForSelector("button.btn-warning.btn-sm", {
        visible: true,
      });

      // Extract Table Data
      const data = await this.page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll("table.table tbody tr")
        );

        return rows.map((row) => {
          const cells = Array.from(row.querySelectorAll("td, th"));

          return cells.map((singleRow) => singleRow.innerText);
        });
      });

      const output = data.slice(0, 10).reverse();
      fs.writeFileSync("koko.json", JSON.stringify(output, null, 2));
      logging.info("Records saved to koko.json file");

      logging.info("Click Logout Menu Button");
      await this.humanDelay(2500, 3000);

      await this.page.evaluate(() => {
        const btn = document.querySelector(
          "button.btn.btn-black.dropdown-toggle.header-item"
        );
        btn.click();
      });

      await this.humanDelay(1000, 2000);

      logging.info("Click Logout Button");
      await this.page.evaluate(() => {
        const btn = document.querySelector("div.dropdown-item.text-danger");
        btn.click();
      });

      await this.page.waitForNavigation({ waitUntil: "networkidle0" });
      logging.info("Koko Logout scussfully");

      await this.humanDelay(1000, 2000);

      return true;
    } catch (error) {
      console.error(`Extraction failed: ${error.message}`);
      return false;
    }
  }
}

export default WebHandler;
