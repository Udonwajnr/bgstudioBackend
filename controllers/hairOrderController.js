const HairOrder = require('../models/HairOrder');
const HairProduct = require('../models/HairProduct');
const axios = require('axios');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');  // Importing crypto to generate a random string

// Create a New Order
const createHairOrder = asyncHandler(async (req, res) => {
  const { customer, email, phone, items, shippingPrice } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Order must contain at least one item." });
  }

  let total = 0;
  let updatedProducts = [];

  for (const item of items) {
    const product = await HairProduct.findById(item._id);

    if (!product) {
      return res.status(404).json({ message: `Product with ID ${item._id} not found.` });
    }

    if (product.stock < item.quantity) {
      return res.status(400).json({
        message: `Insufficient stock for ${product.productName}. Available: ${product.stock}`,
      });
    }

    total += product.price * item.quantity;
    console.log(total)
    updatedProducts.push({ product, quantity: item.quantity });

    product.stock -= item.quantity;
    product.sales += item.quantity;
    await product.save();
  }

  if (shippingPrice) total += shippingPrice; // Add shipping cost

  try {
    // Generate a unique transaction reference
    const tx_ref = `HAIR-ORD-${crypto.randomUUID()}`;

    const paymentData = {
      tx_ref,
      amount: total,
      currency: "NGN",
      redirect_url: `${process.env.FRONTEND_URL}/payment-success`,
      customer: { email, phone_number: phone, name: customer },
      customizations: {
        title: "Hair Order Payment",
        description: "Payment for your hair order",
      },
    };

    const response = await axios.post("https://api.flutterwave.com/v3/payments", paymentData, {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data.status === "success") {
      const order = new HairOrder({
        customer,
        email,
        phone,
        items: items.map((item) => ({
          productId: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total,
        paymentStatus: "Pending",
        flutterwaveTransactionId: response.data.data.id,
        transactionReference: tx_ref,
      });

      const createdOrder = await order.save();
      return res.status(201).json({ order: createdOrder, paymentLink: response.data.data.link });
    } else {
      throw new Error("Flutterwave payment initialization failed.");
    }
  } catch (error) {
    console.error("Payment Initialization Error:", error.response ? error.response.data : error.message);

    // Rollback stock updates on failure
    for (const { product, quantity } of updatedProducts) {
      product.stock += quantity;
      product.sales -= quantity;
      await product.save();
    }

    return res.status(400).json({ message: "Payment initialization failed", error: error.message });
  }
});
// Verify payment
const verifyPayment = asyncHandler(async (req, res) => {
  const { tx_ref } = req.query; // Extract tx_ref from query parameters

  if (!tx_ref) {
    return res.status(400).json({ message: "Transaction reference is required" });
  }

  try {
    // Verify the payment using Flutterwave's "verify_by_reference"
    const response = await axios.get(
      `${process.env.FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${tx_ref}`,
      {
        headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
      }
    );

    if (
      response.data.status === "success" &&
      response.data.data.status === "successful"
    ) {
      // Update order in database
      const order = await HairOrder.findOneAndUpdate(
        { transactionReference: tx_ref },
        { paymentStatus: "Paid" },
        { new: true }
      ).populate("customer","fullName email phoneNumber");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.status(200).json({ message: "Payment verified and order updated", order });
    } else {
      return res.status(400).json({
        message: "Payment verification failed",
        details: response.data,
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error.response?.data || error.message);
    return res.status(500).json({ message: "Error verifying payment", error: error.message });
  }
});

// Get All Orders
const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await HairOrder.find().populate('items.productId', 'productName price');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Order by ID
const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await HairOrder.findById(orderId).populate('items.productId', 'productName price stock');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json(order);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

// Update Order Status
const updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    const order = await HairOrder.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete an Order
const deleteOrder = asyncHandler(async (req, res) => {
  try {
    const order = await HairOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { createHairOrder, verifyPayment, getAllOrders, getOrderById, updateOrderStatus, deleteOrder };
