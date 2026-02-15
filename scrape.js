import logger from "./support/logger.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import "dotenv/config";

import WebHandler from "./support/web.js";
import uploadToGoogleSheet from "./support/upload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logging = logger(__filename);

async function appProcess(platforms) {
  logging.info("Starting the bot...");

  let web;

  try {
    web = new WebHandler();
    await web.init();
  } catch (e) {
    logging.critical(`Web browser load failed: ${e.message}`);
  }

  for (const requestedPlatfrom of platforms) {
    let loginStatus = false;
    let dataExtractionStatus = false;
    let uploadStatus = false;

    try {
      switch (requestedPlatfrom) {
        case "KOKO":
          loginStatus = await web.kokoLogin(
            requestedPlatfrom,
            process.env.KOKO_USERNAME,
            process.env.KOKO_PASSWORD,
          );
          break;
        case "MINT":
          loginStatus = await web.mintPayLogin(
            requestedPlatfrom,
            process.env.MINTPAY_USERNAME,
            process.env.MINTPAY_PASSWORD,
          );
          break;
      }
    } catch (e) {
      logging.critical(`${requestedPlatfrom} Unknown Error: ${e}`);
    }

    if (loginStatus) {
      try {
        switch (requestedPlatfrom) {
          case "KOKO":
            dataExtractionStatus =
              await web.kokoExtractProcess(requestedPlatfrom);
            break;
          case "MINT":
            dataExtractionStatus =
              await web.mintPayExtractProcess(requestedPlatfrom);
            break;
        }
      } catch (e) {
        logging.critical(`${requestedPlatfrom} Unknown Error: ${e}`);
      }
    } else {
      /*  TODO - HANDLE LOGIN FAILED */
    }

    if (dataExtractionStatus) {
      logging.info(
        `${requestedPlatfrom} data succefully extracted & saved in to ${requestedPlatfrom}.json!`,
      );

      if (requestedPlatfrom === "KOKO") {
        uploadStatus = uploadToGoogleSheet(
          requestedPlatfrom,
          `${requestedPlatfrom}.json`,
          process.env.DATA_SUBMIT_ENDPOIT,
        );
      }

      uploadStatus = uploadToGoogleSheet(
        requestedPlatfrom,
        `${requestedPlatfrom}.json`,
        process.env.DATA_SUBMIT_ENDPOIT,
      );

      if (uploadStatus) {
        logging.info(`Bot ran successfully - ${requestedPlatfrom}`);
      }
    } else {
      /*  TODO - HANDLE DATA EXTRACTION FAILED */
    }
  }

  web.destroy();
}

(async () => {
  logging.info("----------| NEW PROCESS START |----------");
  try {
    const pltforms = ["KOKO", "MINT"];
    // const pltforms = ["KOKO"];
    // const pltforms = ["MINT"];
    await appProcess(pltforms);
    logging.info("**********| END |**********");
  } catch (e) {
    logging.critical(`Critical System Error: ${e.message}`);
  }
})();
