const express = require("express")
const app = express()
const dotenv = require("dotenv").config()
const connectDb = require("./config/db")
const color = require("colors")
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose');
const apiKeyMiddleware = require("./authMiddleware");

const corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        // 'https://medical-inventory-beta.vercel.app',
        // "https://rosek-beta.vercel.app"
      ];
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  };
  

let cors = require("cors")
const port=3000

app.use(cookieParser())
app.use(cors(corsOptions))
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

app.get('/', (req, res) => {
    sendResponse(res, 200, 'Hello World! This is a success message');
});

// auth 
app.use("/api/auth",require("./route/userRoute"))
app.use("/api/salon",require("./route/bookingRoute"))
app.use("/api/poultry",require("./route/poultryRoute"))
app.use("/api/hair",require("./route/hairProductRoute"))

// starting
app.use("/api/poultry-order",require("./route/poultryOrderRoute"))
app.use('/api/hair-order', require("./route/hairOrderRoute"));
app.use('/api/poultry-shipping',require("./route/poultryShippingRoutes") );
app.use('/api/hair-shipping', require("./route/hairShippingRoutes"));

// not needed yet
// app.use('/api/hair-payments', require("./route/hairPaymentRoutes"));
// app.use('/api/poultry-payments', require("./route/poultryPaymentRoutes"));

app.listen(port,()=>{
    console.log(`This is running with port ${port}`)
})

connectDb()