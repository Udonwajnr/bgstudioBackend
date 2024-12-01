const express = require("express")
const app = express()
const dotenv = require("dotenv").config()
const connectDb = require("./config/db")
const color = require("colors")
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose');
const apiKeyMiddleware = require("./authMiddleware");
const fs = require('fs');
const path = require('path');

let cors = require("cors")
const port=3000

app.use(cookieParser())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:false}))

// console.log(process.env.API_KEY)
// app.use(apiKeyMiddleware);

// Read and convert the image to Base64

const sendResponse = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        success: statusCode >= 200 && statusCode < 300, // success is true for 2xx status codes
        message,
        data
    });
};

//     const htmlContent = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>HTML Endpoint</title>
//       </head>
//       <body>
//           <h1>Welcome to the HTML Endpoint!</h1>
//           <p>This is a simple HTML response served by Express.</p>
//           <img src="data:image/png;base64,${imageBase64}"alt="BG Unisex Salon" width="150" style="display: block;border-radius: 100%;">
//           </body>
//       </html>
//     `;
//     res.send(htmlContent);
//   });

app.get('/', (req, res) => {
    sendResponse(res, 200, 'Hello World! This is a success message');
});
// auth 
app.use("/api/auth",require("./route/userRoute"))
app.use("/api/salon",require("./route/bookingRoute"))

app.listen(port,()=>{
    console.log(`This is running with port ${port}`)
})

connectDb()