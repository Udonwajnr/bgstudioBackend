const express = require('express');
const {
  createPoultryPaymentIntent,
  handlePoultryWebhook,
} = require('../controllers/poultryPayment');

const router = express.Router();

// Create PaymentIntent for PoultryOrder
router.post('/create-payment-intent', createPoultryPaymentIntent);

// Webhook Endpoint for Poultry Payments
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // Middleware for raw body parsing
  handlePoultryWebhook
);

module.exports = router;
