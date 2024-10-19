const express = require("express");
const { Service } = require("../services");
const { BadRequestError } = require("../utils/errors");
const authMiddleware = require('../middlewares/auth');
const router = express.Router();
const service = new Service();

router.get("/", (req, res) => {
  res.json({ message: "Welcome to the users API" });
});

router.get("/success", (req, res) => {
  res.json({ message: "success page" });
});

router.get("/failure", (req, res) => {
  res.json({ message: "failure page" });
});

router.post("/createcheckoutsession", authMiddleware, async (req, res) => {
  const { product, successUrl, cancelUrl } = req.body;

  if (!product || !successUrl || !cancelUrl) {
    throw new BadRequestError("Product, successUrl, and cancelUrl are required");
  }

  const data = await service.createCheckoutSession(product, successUrl, cancelUrl);
  
  return res.json({ id: data.id });
});





// routes/interviewAvailability.js




router.post("/addinterview", authMiddleware, async (req, res) => {
  // const { user_id } = req.body;

  const user_id = req.userId

  const data = await service.addInterview(user_id);
  return res.status(201).json(data);
});

router.post("/reduceinterview", authMiddleware, async (req, res) => {

  const user_id = req.userId
 

  const data = await service.reduceInterview(user_id);
  return res.json(data);
});

router.get("/getinterview", authMiddleware, async (req, res) => {
  const user_id = req.userId

  if (!user_id) {
    throw new BadRequestError("User ID is required");
  }

  const data = await service.getInterview(user_id);
  return res.json(data);
});



module.exports = router;
