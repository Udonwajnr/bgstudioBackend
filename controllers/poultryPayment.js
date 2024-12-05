const stripe = require('../config/stripe');
const PoultryOrder = require('../models/PoultryOrder');

// Create a PaymentIntent for PoultryOrder
async function createPoultryPaymentIntent(req, res) {
  try {
    const { orderId } = req.body;

    // Fetch the PoultryOrder details
    const order = await PoultryOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to the smallest currency unit
      currency: 'usd',
      metadata: { orderId: order._id.toString() },
    });

    // Return the client secret for the front-end
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Handle Webhook for PoultryOrder Payments
async function handlePoultryWebhook(req, res) {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = 'your_webhook_secret_key'; // Use your actual Stripe webhook secret
    let event;

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed.', err.message);
      return res.status(400).send('Webhook Error');
    }

    // Handle specific events
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      // Update PoultryOrder payment status
      await PoultryOrder.findOneAndUpdate(
        { _id: paymentIntent.metadata.orderId },
        { paymentStatus: 'Paid', stripePaymentId: paymentIntent.id }
      );

      console.log('Payment succeeded for PoultryOrder:', paymentIntent.id);
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;

      // Update PoultryOrder payment status
      await PoultryOrder.findOneAndUpdate(
        { _id: paymentIntent.metadata.orderId },
        { paymentStatus: 'Failed' }
      );

      console.error('Payment failed for PoultryOrder:', paymentIntent.id);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

module.exports = {
  createPoultryPaymentIntent,
  handlePoultryWebhook,
};
