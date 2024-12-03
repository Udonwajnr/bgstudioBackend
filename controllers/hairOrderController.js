const HairOrder = require('../models/HairOrder');

// Create a New Order
async function createOrder(req, res) {
  try {
    const { customer, email, phone, address, items } = req.body;

    // Calculate total price
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const newOrder = new HairOrder({
      customer,
      email,
      phone,
      address,
      items,
      total,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

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
async function getOrderById(req, res) {
  try {
    const order = await HairOrder.findById(req.params.id).populate('items.productId', 'name price description');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

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
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
