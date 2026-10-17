const model = require('./deliveries.model');

async function assignDelivery(req, res) {
  try {
    const { orderId, riderId, region, deliveryFee } = req.body;
    if (!orderId || !riderId || !region) {
      return res.status(400).json({ error: 'orderId, riderId and region are required.' });
    }
    const delivery = await model.createDelivery(orderId, riderId, region, deliveryFee || 0);
    res.status(201).json(delivery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function myDeliveries(req, res) {
  try {
    res.json(await model.getDeliveriesForRider(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function changeStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ['assigned', 'picked_up', 'en_route', 'delivered'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const delivery = await model.updateDeliveryStatus(req.params.id, status, req.user.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found or not yours.' });
    res.json(delivery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function listRiders(req, res) {
  try {
    res.json(await model.getAllRiders());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { assignDelivery, myDeliveries, changeStatus, listRiders };