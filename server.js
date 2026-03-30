require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["POST", "GET"],
}));
app.use(express.json());

const CF_HEADERS = {
  "x-api-version": "2023-08-01",
  "x-client-id": process.env.CASHFREE_APP_ID,
  "x-client-secret": process.env.CASHFREE_SECRET_KEY,
  "Content-Type": "application/json",
};

app.get("/", (req, res) => {
  res.json({ status: "MBA Convert API running" });
});

app.post("/create-order", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const orderId = `mba_${Date.now()}`;

    const response = await axios.post("https://api.cashfree.com/pg/orders", {
      order_id: orderId,
      order_amount: 199,
      order_currency: "INR",
      customer_details: {
        customer_id: `cust_${Date.now()}`,
        customer_name: name || "Student",
        customer_email: email,
        customer_phone: phone,
      },
    }, { headers: CF_HEADERS });

    res.json({
      success: true,
      payment_session_id: response.data.payment_session_id,
      order_id: orderId,
    });
  } catch (error) {
    console.error("Order creation failed:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Order creation failed" });
  }
});

app.post("/verify-payment", async (req, res) => {
  try {
    const { order_id } = req.body;
    const response = await axios.get(`https://api.cashfree.com/pg/orders/${order_id}`, { headers: CF_HEADERS });

    if (response.data.order_status === "PAID") {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: `Payment status: ${response.data.order_status}` });
    }
  } catch (error) {
    console.error("Verification error:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MBA Convert backend running on port ${PORT}`);
});
