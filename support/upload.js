import logger from "./logger.js";
import { fileURLToPath } from "url";
import fs from "fs";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);

const logging = logger(__filename);

const uploadToGoogleSheet = async (file_name, requestEndPoint) => {
  try {
    logging.info(`Read ${file_name}`);
    const rawData = fs.readFileSync(file_name, "utf8");

    // 2. Parse the string into a JavaScript object
    logging.info(`Parse ${file_name} file data into json`);
    const jsonData = JSON.parse(rawData);

    // 3. Send the POST request
    logging.info(`Request to google script endpoint`);
    const response = await axios.post(requestEndPoint, jsonData, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.data.status === "SUCCESS") {
      logging.info("Data write to Google sheet successfully");
      return true;
    } else logging.info("Failed: Data write Failed");
  } catch (error) {
    console.error("Error:", error.message);
  }
};

export default uploadToGoogleSheet;
