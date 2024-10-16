const express = require("express");
const http = require("http"); // Import HTTP module
const app = express();
const server = http.createServer(app); // Create a server from the express app
// const connectDb = require("./config/db");
const dotenv = require("dotenv").config();
const colors = require("colors");
let cors = require("cors");
let cookieParser = require("cookie-parser");

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`.yellow);
    console.log(new Date());
    // sendMedicationReminder(userPhoneNumber, userName, medicationName, dosage, dosageForm);
  });