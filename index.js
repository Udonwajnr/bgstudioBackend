const express = require("express")
const app = express()
const dotenv = require("dotenv").config()
const connectDb = require("./config/db")
const color = require("colors")
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose');
const apiKeyMiddleware = require("./authMiddleware");


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

app.get('/', (req, res) => {
    sendResponse(res, 200, 'Hello World! This is a success message');
});

// auth 
app.use("/api/auth",require("./route/userRoute"))
app.use("/api/salon",require("./route/bookingRoute"))
app.use("/api/poultry",require("./route/poultryRoute"))
app.use("/api/hair",require("./route/hairProductRoute"))
app.use("/api/poultry-order",require("./route/poultryOrderRoute"))

app.listen(port,()=>{
    console.log(`This is running with port ${port}`)
})

connectDb()