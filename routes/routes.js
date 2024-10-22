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
  const user_id = req.userId

  if (!product || !successUrl || !cancelUrl) {
    throw new BadRequestError("Product, successUrl, and cancelUrl are required");
  }

  const data = await service.createCheckoutSession(product, successUrl, cancelUrl);

  const session_id=data.id;

  const response =await service.addSessionInfo(session_id,user_id);
  
  return res.status(201).json({ id: session_id});
});










const bodyParser = require('body-parser');

router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async(req, res) => {

  const sig = req.headers['stripe-signature'];
  const info= req.body;
 

  const data= await service.webhookservice(sig,info);
  
  // Respond to acknowledge receipt of the event
  res.json({ received: data });
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
  return res.status(200).json(data);
});

router.get("/getinterview", authMiddleware, async (req, res) => {
  const user_id = req.userId

  if (!user_id) {
    throw new BadRequestError("User ID is required");
  }

  const data = await service.getInterview(user_id);
  return res.status(200).json(data);
});



module.exports = router;
