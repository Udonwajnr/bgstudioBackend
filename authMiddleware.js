const dotenv = require('dotenv');
dotenv.config();

const authenticateApiKey = (req, res, next) => {
  // Get the API key from the request headers
  const apiKey = req.headers['api-key'];

  // Check if the API key matches the one stored in the environment variable
  if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(403).json({ msg: 'Forbidden: Invalid API Key' });
  }

  // If API key is valid, proceed to the next middleware or route handler
  next();
};

module.exports = authenticateApiKey;