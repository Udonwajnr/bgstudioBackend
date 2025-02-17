const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const Customer = require("../models/Customer");

require("dotenv").config();

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  console.log("Serializing user:", user); // Log the user
  done(null, user);
});

passport.deserializeUser(async (id, done) => {
  console.log("Deserializing user with id:", id); // Log user ID
  try {
    const user = await Customer.findById(id); // Fetch user from DB
    done(null, user); // Attach user object to `req.user`
  } catch (err) {
    done(err, null);
  }
});



// Helper function to handle email with a password
async function handleEmailConflict(email, provider, done) {
  const existingUser = await Customer.findOne({ email });

  if (existingUser) {
    // Check if the user has a password (indicating manual signup)
    if (existingUser.password) {
      return done(
        new Error(`The email ${email} is already registered with a password. Please log in using your email and password.`),
        null
      );
    }

    // Otherwise, return the existing user
    return existingUser;
  }

  return null;
}


// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `http://localhost:8000/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { email, name } = profile._json;

        if (!email) {
          return done(new Error("Email is required but not provided by Google"), null);
        }

        // Check for email conflict or create a new user
        let user = await handleEmailConflict(email, "google", done);

        if (!user) {
          user = await Customer.create({
            fullName: name,
            email,
            provider: "google",
            isVerified:true
          });
        }
        return done(null, user);
      } catch (err) {
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
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/auth/facebook/callback",
      profileFields: ["id", "displayName", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { email, name } = profile._json;

        if (!email) {
          return done(new Error("Email is required but not provided by Facebook"), null);
        }

        // Check for email conflict or create a new user
        let user = await handleEmailConflict(email, "facebook", done);

        if (!user) {
          user = await Customer.create({
            fullName: name,
            email,
            provider: "facebook",
          });
        }

        return done(null, user);
      } catch (err) {
        console.error("Facebook OAuth Error:", err); // Log any errors
        return done(err, null);
      }
    }
  )
);

module.exports = passport;