const asyncHandler = require('express-async-handler');
const PoultryProduct = require('../models/Poultry');
const PoultryOrder = require('../models/PoultryOrder');
const axios = require('axios');

const FLUTTERWAVE_SECRET_KEY = 'FLWSECK_TEST-77e9a58563a4d1eca68329a087c988fa-X';
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

const createOrder = asyncHandler(async (req, res) => {
  const { customer, email, phone, items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item.' });
  }

  let total = 0;

  // Validate items and calculate total
  for (const item of items) {
    const product = await PoultryProduct.findById(item.productId);

    if (!product) {
      return res.status(404).json({ message: `Product with ID ${item.productId} not found.` });
    }

    if (product.stock < item.quantity) {
      return res.status(400).json({
        message: `Insufficient stock for product ${product.productName}. Available: ${product.stock}.`,
      });
    }

    total += product.price * item.quantity;

    // Deduct stock temporarily (rollback if payment fails)
    product.stock -= item.quantity;
    product.sales += item.quantity;
    await product.save();
  }

  try {
    // Create a payment request with Flutterwave
    const paymentData = {
      tx_ref: `ORD-${Date.now()}`, // Unique transaction reference
      amount: total,
      currency: 'NGN', // Adjust currency as needed
      redirect_url: 'https://your-redirect-url.com',
      customer: {
        email,
        phone_number: phone,
        name: customer,
      },
    };

    const response = await axios.post(`${FLUTTERWAVE_BASE_URL}/payments`, paymentData, {
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      },
    });

    if (response.data.status === 'success') {
      // Save the order with a "Pending" payment status
      const order = new PoultryOrder({
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
      const product = await PoultryProduct.findById(item.productId);
      product.stock += item.quantity;
      product.sales -= item.quantity;
      await product.save();
    }

    return res.status(400).json({ message: 'Payment initialization failed', error: error.message });
  }
});

// Get order by ID
const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params; // Extract orderId from request parameters

  try {
    // Fetch the order by ID
    const order = await PoultryOrder.findById(orderId).populate('items.productId', 'productName stock price');

    if (!order) {
      // If the order doesn't exist, return a 404 error
      return res.status(404).json({ message: 'Order not found' });
    }

    // If the order exists, return it in the response
    res.status(200).json(order);
  } catch (error) {
    // Handle invalid ID format or other errors
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }
    res.status(500).json({ message: 'Error fetching the order', error: error.message });
  }
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;

  try {
    const response = await axios.get(
      `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status === 'success' && response.data.data.status === 'successful') {
      // Update order status to Paid
      const order = await PoultryOrder.findOneAndUpdate(
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

const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await PoultryOrder.find().populate('items.productId', 'productName category');
    res.status(200).json(orders);
  });

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await PoultryOrder.findById(id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (!['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  order.status = status;
  const updatedOrder = await order.save();

  res.status(200).json(updatedOrder);
});

const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await PoultryOrder.findById(id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  await order.deleteOne();
  res.status(200).json({ message: 'Order deleted successfully' });
});

module.exports={createOrder,getAllOrders,getOrderById,updateOrderStatus,deleteOrder,verifyPayment}