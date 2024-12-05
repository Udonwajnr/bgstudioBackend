const stripe = require('../config/stripe');
const HairOrder = require('../models/HairOrder'); // Replace with PoultryOrder for poultry payments

// Create a PaymentIntent
async function createPaymentIntent(req, res) {
  try {
    const { orderId } = req.body;

    // Fetch the order details
    const order = await HairOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert amount to smallest currency unit
      currency: 'usd',
      metadata: { orderId: order._id.toString() },
    });

    // Return the client secret for the front-end
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Webhook to Handle Payment Status Updates
async function handleWebhook(req, res) {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = 'your_webhook_secret_key'; // Set this in your Stripe dashboard
    let event;

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed.', err.message);
      return res.status(400).send('Webhook Error');
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      // Update order payment status
      await HairOrder.findOneAndUpdate(
        { _id: paymentIntent.metadata.orderId },
        { paymentStatus: 'Paid', stripePaymentId: paymentIntent.id }
      );

      console.log('Payment succeeded:', paymentIntent.id);
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;

      // Update order payment status
      await HairOrder.findOneAndUpdate(
        { _id: paymentIntent.metadata.orderId },
        { paymentStatus: 'Failed' }
      );

      console.error('Payment failed:', paymentIntent.id);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

module.exports = {
  createPaymentIntent,
  handleWebhook,
};
