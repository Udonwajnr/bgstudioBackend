const express = require('express');
const { createPaymentIntent, handleWebhook } = require('../controllers/hairPaymentController');

const router = express.Router();

// Create PaymentIntent
router.post('/create-payment-intent', createPaymentIntent);

// Webhook Endpoint
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // Middleware to parse raw body for Stripe
  handleWebhook
);

module.exports = router;
