const express = require("express")
const { Service } = require("../services")
const { BadRequestError } = require("../utils/errors")
const authMiddleware = require("../middlewares/auth")
const router = express.Router()
const service = new Service()

router.get("/", (req, res) => {
  res.json({ message: "Welcome to the Payment Service" })
})

router.get("/success", (req, res) => {
  res.json({ message: "success page" })
})

router.get("/failure", (req, res) => {
  res.json({ message: "failure page" })
})

router.post("/createcheckoutsession", authMiddleware, async (req, res) => {
  const { product, successUrl, cancelUrl, number_of_interviews, promocode } =
    req.body
  const user_id = req?.userId
  const role = req?.role

  if (!product || !successUrl || !cancelUrl || !number_of_interviews) {
    throw new BadRequestError(
      "Product, successUrl, cancelUrl and number of interviews are required"
    )
  }

  if (
    !product.price ||
    !product.currency ||
    !product.package_type ||
    !product.name ||
    !product.id
  ) {
    throw new BadRequestError("Invalid product structure")
  }

  const data = await service.createCheckoutSession(
    product,
    successUrl,
    cancelUrl,
    number_of_interviews,
    user_id,
    promocode,
    role
  )

  const session_id = data.id

  const response = await service.addSessionInfo(session_id, user_id)
  console.log("first", response)

  return res.status(201).json({ id: session_id })
})

router.post("/cancel-subscription", authMiddleware, async (req, res) => {
  const { stripe_subscription_id } = req.body

  if (!stripe_subscription_id) {
    throw new BadRequestError("Stripe subscription id is required")
  }

  await service.cancelSubscription(stripe_subscription_id)
  return res
    .status(201)
    .json({ message: "Subscription cancelled successfully" })
})

router.post("/billings", authMiddleware, async (req, res) => {
  const billingData = {
    user_id: req.userId,
    ...req.body,
  }

  const billing = await service.saveBillingInfo(billingData)
  res.status(201).json({ message: "Billing saved successfully", data: billing })
})

const bodyParser = require("body-parser")

router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"]
    const info = req.body
    console.log("Body", info)

    const data = await service.webhookservice(sig, info)

    // Respond to acknowledge receipt of the event
    res.json({ received: data })
  }
)

// routes/interviewAvailability.js

router.post("/addinterview", authMiddleware, async (req, res) => {
  // const { user_id } = req.body;

  const user_id = req.userId

  const data = await service.addInterview(user_id)
  return res.status(201).json(data)
})

router.post("/reduceinterview", authMiddleware, async (req, res) => {
  const user_id = req.userId

  const data = await service.reduceInterview(user_id)
  return res.status(200).json(data)
})

router.get("/getinterview", authMiddleware, async (req, res) => {
  const user_id = req.userId

  if (!user_id) {
    throw new BadRequestError("User ID is required")
  }

  const data = await service.getInterview(user_id)
  return res.status(200).json(data)
})

router.get("/packages", authMiddleware, async (req, res) => {
  const { country_name } = req.query

  const EUR_COUNTRY = [
    "ITA",
    "FRA",
    "ESP",
    "PRT",
    "IRL",
    "NLD",
    "GRC",
    "AUT",
    "FIN",
    "BEL",
    "SVK",
    "LTU",
    "SVN",
    "EST",
    "MCO",
    "MLT",
    "MNE",
    "LUX",
    "CYP",
    "KOS",
    "VAT",
    "MYT",
    "LVA",
    "AND",
    "SMR",
    "MTQ",
    "REU",
    "BL",
    "NLD",
    "BES",
    "MAF",
  ]

  let country = country_name || "US"
  const user_type = req?.role

  if (EUR_COUNTRY.includes(country)) {
    country = "DEU"
  }

  const data = await service.getPackages(user_type, country)
  return res.status(200).json(data)
})

router.get("/packages/:id", authMiddleware, async (req, res) => {
  const id = req.params.id
  const data = await service.getPackagesById(id)
  return res.status(200).json(data)
})

router.post("/apply-promocode", authMiddleware, async (req, res) => {
  const user_id = req?.userId
  const role = req?.role
  const { promocode } = req.body

  const data = await service.applyPromocode(promocode, user_id, role)
  return res
    .status(200)
    .json({ message: "Promocode applied successfully", data })
})

router.get("/get-referral", authMiddleware, async (req, res) => {
  const user_id = req.userId

  const data = await service.getReferral(user_id)
  return res
    .status(200)
    .json({ message: "Referral code fetched successfully", ...data })
})

router.get("/health", (req, res) => {
  res.json({ status: "UP" })
})

module.exports = router
