const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/users"); // Adjust the path based on your project structure