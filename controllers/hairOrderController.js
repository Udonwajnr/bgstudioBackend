const HairOrder = require('../models/HairOrder');
const HairProduct = require('../models/HairProduct');

const axios = require('axios');
const asyncHandler = require('express-async-handler');

const FLUTTERWAVE_SECRET_KEY = 'FLWSECK_TEST-77e9a58563a4d1eca68329a087c988fa-X';
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';
// Create a New Order
const createHairOrder = asyncHandler(async (req, res) => {
  const { customer, email, phone, items } = req.body;

  // Validate that the order contains at least one item
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item.' });
  }

  let total = 0;

  // Validate items and calculate total
  for (const item of items) {
    const product = await HairProduct.findById(item.productId);

    if (!product) {
      return res.status(404).json({ message: `Product with ID ${item.productId} not found.` });
    }

    if (product.stock < item.quantity) {
      return res.status(400).json({
        message: `Insufficient stock for product ${product.productName}. Available: ${product.stock}.`,
      });
    }
  
    // add shipping price too
    // total += product.price * item.quantity +(shippingPrice); 
    // shipping price wiull come from request.body
    total += product.price * item.quantity; 

    // Deduct stock temporarily (rollback if payment fails)
    product.stock -= item.quantity;
    product.sales += item.quantity;
    await product.save();
  }

  try {
    // Create a payment request with Flutterwave
    const paymentData = {
      tx_ref: `HAIR-ORD-${Date.now()}`, // Unique transaction reference
      amount: total,
      currency: 'USD', // Adjust currency as needed
      redirect_url: `${process.env.FRONTEND_URL}/payment-success`,
      customer: {
        email,
        phone_number: phone,
        name: customer,
      },
      customizations: {
        title: 'Hair Order Payment',
        description: 'Payment for your hair order',
      },
    };

    const response = await axios.post(`${FLUTTERWAVE_BASE_URL}/payments`, paymentData, {
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      },
    });

    if (response.data.status === 'success') {
      // Save the order with a "Pending" payment status
      const order = new HairOrder({
        customer,
        email,
        phone,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total,
        paymentStatus: 'Pending',
        flutterwaveTransactionId: response.data.data.id, // Transaction ID from Flutterwave
      });

      const createdOrder = await order.save();
      res.status(201).json({
        order: createdOrder,
        paymentLink: response.data.data.link, // Payment link to redirect the customer
      });
    } else {
      throw new Error('Failed to create payment request');
    }
  } catch (error) {
    // Rollback stock if payment fails
    for (const item of items) {
      const product = await HairProduct.findById(item.productId);
      product.stock += item.quantity;
      product.sales -= item.quantity;
      await product.save();
    }

    return res.status(400).json({ message: 'Payment initialization failed', error: error.message });
  }
});

// Verify payment
const verifyPayment = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;

  try {
    const response = await axios.get(`${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`, {
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      },
    });

    if (response.data.status === 'success' && response.data.data.status === 'successful') {
      const order = await HairOrder.findOneAndUpdate(
        { flutterwaveTransactionId: transactionId },
        { paymentStatus: 'Paid' },
        { new: true }
      );

      if (order) {
        res.status(200).json({ message: 'Payment verified and order updated', order });
      } else {
        res.status(404).json({ message: 'Order not found' });
      }
    } else {
      res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
});

// Get All Orders
async function getAllOrders(req, res) {
  try {
    const orders = await HairOrder.find().populate('items.productId', 'name price');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get Order by ID
const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await HairOrder.findById(orderId).populate('items.productId', 'productName price stock');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

// Update Order Status
async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const order = await HairOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// Delete an Order
async function deleteOrder(req, res) {
  try {
    const order = await HairOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createHairOrder,
  verifyPayment,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,

};
