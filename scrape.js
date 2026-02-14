import logger from "./support/logger.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import "dotenv/config";

import WebHandler from "./support/web.js";
import uploadToGoogleSheet from "./support/upload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logging = logger(__filename);

async function appProcess() {
  logging.info("Starting the bot...");

  let web;
  let extractionStatus = false;

  try {
    web = new WebHandler();
    await web.init();

    try {
      // Attempt Login
      const loginSuccess = await web.kokoLogin(
        process.env.KOKO_USERNAME,
        process.env.KOKO_PASSWORD
      );

      logging.info(`Login Result ${loginSuccess}`);

      if (loginSuccess) {
        logging.info("LOGIN SUCCESS");
        try {
          // Attempt Extraction
          const dataExtractionStatus = await web.kokoExtractProcess();

          if (dataExtractionStatus) {
            logging.info("Data Extraction Complete");
            web.destroy();
            extractionStatus = true;
          }
        } catch (e) {
          logging.critical(`KOKO extraction error: ${e.message}`);
        }
      }
    } catch (e) {
      logging.critical(`KOKO Unknown Error during flow: ${e.message}`);
    }
  } catch (e) {
    logging.critical(`Web browser load failed: ${e.message}`);
  }

  if (extractionStatus) {
    // console.log("DONE DONE DONE");
    if (uploadToGoogleSheet("koko.json", process.env.DATA_SUBMIT_ENDPOIT))
      logging.info("-----| DONE |--------");
  }
}

(async () => {
  logging.info("----------| NEW PROCESS START |----------");
  try {
    await appProcess();
  } catch (e) {
    logging.critical(`Critical System Error: ${e.message}`);
  }

  logging.info("**********| END |**********");
})();
