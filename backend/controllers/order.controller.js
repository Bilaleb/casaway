const mongoose = require("mongoose");
const Stripe = require("stripe");
const Order = require("../models/order.model");
const OrderItem = require("../models/order-item.model");
const Product = require("../models/product.model");

function stripeClient() {
  return process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
}

async function validateOrder(body) {
  const { customer_name, phone_number, delivery_address, city, items } = body;
  if (!customer_name || !phone_number || !delivery_address || !city || !Array.isArray(items) || !items.length) {
    const error = new Error("Customer details and at least one item are required");
    error.status = 400;
    throw error;
  }

  const verifiedItems = [];
  for (const item of items) {
    if (!mongoose.isValidObjectId(item.product_id)) {
      const error = new Error("One of the selected products is no longer available");
      error.status = 400;
      throw error;
    }
    const product = await Product.findById(item.product_id);
    if (!product) {
      const error = new Error("One of the selected products is no longer available");
      error.status = 400;
      throw error;
    }
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || !product.sizes.includes(String(item.size))) {
      const error = new Error(`Please check the size and quantity for ${product.name}`);
      error.status = 400;
      throw error;
    }
    verifiedItems.push({
      product_id: product._id.toString(),
      product_name: product.name,
      size: String(item.size),
      color: product.color,
      price_mad: product.price_mad,
      quantity,
    });
  }

  return {
    customer_name,
    phone_number,
    delivery_address,
    city,
    items: verifiedItems,
    total: verifiedItems.reduce((sum, item) => sum + item.price_mad * item.quantity, 0),
  };
}

async function saveOrder(details, paymentMethod) {
  const order = await Order.create({
    customer_name: details.customer_name,
    phone_number: details.phone_number,
    delivery_address: details.delivery_address,
    city: details.city,
    total_amount_mad: details.total,
    payment_method: paymentMethod,
  });
  try {
    await OrderItem.insertMany(details.items.map((item) => ({ ...item, order_id: order._id })));
    return order;
  } catch (error) {
    await Order.findByIdAndDelete(order._id).catch(() => {});
    throw error;
  }
}

exports.createOrder = async (req, res) => {
  try {
    const details = await validateOrder(req.body);
    const order = await saveOrder(details, "Cash on Delivery");
    res.status(201).json(order);
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message });
  }
};

exports.createStripeCheckout = async (req, res) => {
  const stripe = stripeClient();
  if (!stripe) return res.status(503).json({ message: "Stripe is not configured on this store" });

  let order;
  try {
    const details = await validateOrder(req.body);
    order = await saveOrder(details, "Stripe");
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: details.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "mad",
          unit_amount: item.price_mad * 100,
          product_data: { name: `${item.product_name} · ${item.color} · ${item.size}` },
        },
      })),
      success_url: `${clientUrl}/checkout/stripe-return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/?checkout=cancelled`,
      metadata: { order_id: order._id.toString() },
    });
    order.stripe_session_id = checkout.id;
    await order.save();
    res.status(201).json({ checkout_url: checkout.url });
  } catch (error) {
    if (order) {
      await OrderItem.deleteMany({ order_id: order._id }).catch(() => {});
      await Order.findByIdAndDelete(order._id).catch(() => {});
    }
    res.status(error.status || 502).json({ message: error.message });
  }
};

exports.confirmStripeCheckout = async (req, res) => {
  const stripe = stripeClient();
  if (!stripe) return res.status(503).json({ message: "Stripe is not configured on this store" });

  try {
    const checkout = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    const order = await Order.findById(checkout.metadata?.order_id);
    if (!order || order.stripe_session_id !== checkout.id) return res.status(404).json({ message: "Order not found" });
    if (checkout.payment_status === "paid" && order.payment_status !== "Paid") {
      order.payment_status = "Paid";
      await order.save();
    }
    res.json({ order_id: order._id, payment_status: order.payment_status, total_amount_mad: order.total_amount_mad });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.handleStripeWebhook = async (req, res) => {
  const stripe = stripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) return res.status(503).json({ message: "Stripe webhooks are not configured on this store" });

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], webhookSecret);
  } catch (error) {
    return res.status(400).json({ message: `Invalid Stripe signature: ${error.message}` });
  }

  const checkout = event.data.object;
  if (["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed"].includes(event.type)) {
    const order = await Order.findOne({ _id: checkout.metadata?.order_id, stripe_session_id: checkout.id });
    if (order) {
      if (checkout.payment_status === "paid" || event.type === "checkout.session.async_payment_succeeded") order.payment_status = "Paid";
      if (event.type === "checkout.session.async_payment_failed") order.payment_status = "Failed";
      await order.save();
    }
  }

  res.json({ received: true });
};

exports.getOrders = async (_req, res) => {
  try {
    const orders = await Order.find().sort({ created_at: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};