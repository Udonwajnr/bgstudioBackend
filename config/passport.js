// config/passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const Customer = require("../models/Customer");

require("dotenv").config();
// Serialize and deserialize user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => Customer.findById(id).then(user => done(null, user)));

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try{
        
          const { name, email } = profile._json;
        let user = await Customer.findOne({ email });
        if (!user) {
          user = await Customer.create({
            fullName: name,
            email,
            provider: "google",
          });
        }
        return done(null, user);
      }catch (err) {
        console.error("Google OAuth Error:", err); // Log any errors
        return done(err, null);
      }
      }
  )
);

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: "FACEBOOK_APP_ID",
      clientSecret: "FACEBOOK_APP_SECRET",
      callbackURL: "/auth/facebook/callback",
      profileFields: ["id", "displayName", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      const { email, name } = profile._json;
      let user = await Customer.findOne({ email });
      if (!user) {
        user = await Customer.create({
          fullName: name,
          email,
          provider: "facebook",
        });
      }
      return done(null, user);
    }
  )
);

module.exports = passport;
