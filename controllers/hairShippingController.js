const HairShipping = require('../models/HairShipping');

// Create a New Shipping Entry
async function createShipping(req, res) {
  try {
    const { orderId, customerName, address, phone, email, deliveryDate } = req.body;

    const newShipping = new HairShipping({
      orderId,
      customerName,
      address,
      phone,
      email,
      deliveryDate,
    });

    const savedShipping = await newShipping.save();
    res.status(201).json(savedShipping);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// Get All Shipping Entries
async function getAllShipping(req, res) {
  try {
    const shippings = await HairShipping.find().populate('orderId', 'orderId total status');
    res.status(200).json(shippings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get Shipping by ID
async function getShippingById(req, res) {
  try {
    const shipping = await HairShipping.findById(req.params.id).populate('orderId', 'orderId total status');
    if (!shipping) return res.status(404).json({ message: 'Shipping entry not found' });
    res.status(200).json(shipping);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update Shipping Status
async function updateShippingStatus(req, res) {
  try {
    const { status } = req.body;
    const shipping = await HairShipping.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!shipping) return res.status(404).json({ message: 'Shipping entry not found' });
    res.status(200).json(shipping);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// Delete Shipping Entry
async function deleteShipping(req, res) {
  try {
    const shipping = await HairShipping.findByIdAndDelete(req.params.id);
    if (!shipping) return res.status(404).json({ message: 'Shipping entry not found' });
    res.status(200).json({ message: 'Shipping entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createShipping,
  getAllShipping,
  getShippingById,
  updateShippingStatus,
  deleteShipping,
};
