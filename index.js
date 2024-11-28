const express = require("express")
const app = express()
const dotenv = require("dotenv").config()
const connectDb = require("./config/db")
const color = require("colors")
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose');
let cors = require("cors")
const port=3000

app.use(cookieParser())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:false}))

// app.use("/api/hospital",require("./route/hospitalRoute"))

app.listen(port,()=>{
    console.log("I'm back")
})

connectDb()