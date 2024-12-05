const asyncHandler = require('express-async-handler');
const Order = require('../models/PoultryOrder');
const PoultryProduct = require('../models/Poultry');
const stripe = require('../config/stripe');

// Create a new order with payment
// don"t forget to add email once payment is complete
const createOrder = asyncHandler(async (req, res) => {
  const { customer, email, phone, items, paymentMethodId } = req.body;

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

  // Create payment intent with Stripe
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Amount in cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true, // Immediately confirm payment
    });

    // Create the order
    const order = new Order({
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
      paymentStatus: 'Paid',
      stripePaymentId: paymentIntent.id,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    // Roll back stock if payment fails
    for (const item of items) {
      const product = await PoultryProduct.findById(item.productId);
      product.stock += item.quantity;
      product.sales -= item.quantity;
      await product.save();
    }

    return res.status(400).json({ message: 'Payment failed', error: error.message });
  }
});

const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find().populate('items.productId', 'productName category');
    res.status(200).json(orders);
  });

const getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    const order = await Order.findById(id).populate('items.productId', 'productName category');
  
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
  
    res.status(200).json(order);
  });
  
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await Order.findById(id);

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

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  await order.deleteOne();
  res.status(200).json({ message: 'Order deleted successfully' });
});
  
module.exports={createOrder,getAllOrders,getOrderById,updateOrderStatus,deleteOrder}