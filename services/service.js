const { Repository, DB } = require("../database")
const {
  NotFoundError,
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} = require("../utils/errors")

const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = require("../config")
const stripe = require("stripe")(STRIPE_SECRET_KEY)

// Service will contain all the business logic
class Service {
  constructor() {
    this.repository = new Repository()
  }

  async createCheckoutSession(
    product,
    successUrl,
    cancelUrl,
    number_of_interviews,
    user_id,
    promocode
  ) {
    let finalPrice = product.price
    let promocode_id = null

    if (promocode) {
      const discount = await this.applyPromocode(promocode, user_id)

      promocode_id = discount.id

      finalPrice = discount
        ? product.price - (product.price * discount.discount_percent) / 100
        : product.price

      if (isNaN(finalPrice) || finalPrice <= 0) {
        throw new BadRequestError("Something went wrong")
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: product.quantity,
        },
      ],
      metadata: {
        promocode_id,
        number_of_interviews,
      },
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    })

    return { id: session.id }
  }

  async addSessionInfo(session_id, user_id) {
    const result = await this.repository.addSession(session_id, user_id)
    return { message: "Session Added successfully", session: result }
  }

  async webhookservice(sig, info) {
    let event

    // try {
    //   event = stripe.webhooks.constructEvent(info, sig, STRIPE_WEBHOOK_SECRET);

    // } catch (err) {
    //   console.error('Webhook signature verification failed.', err);
    //   return res.status(400).send(`Webhook Error: ${err.message}`);
    // }

    // event = await stripe.webhooks.constructEvent(info, sig, STRIPE_WEBHOOK_SECRET);

    try {
      event = await stripe.webhooks.constructEvent(
        info,
        sig,
        STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error("Webhook signature verification failed.", err)
      throw new BadRequestError(`Webhook Error: ${err.message}`)
    }

    if (!event) {
      throw new BadRequestError("Invalid Event")
    }

    // Handle the event types you care about
    if (event.type === "checkout.session.completed") {
      const session = event.data.object
      console.log("session", session)
      // Extract important payment details from the session object
      // const paymentintent_id = session.payment_intent
      const paymentintent_id =
        session.payment_intent || Math.ceil(Math.random() * 1e5)
      const amount_total = session.amount_total
      const currency = session.currency
      const payment_method_types = session.payment_method_types
      const customer_email = session.customer_details.email
      // const timestamp = session.created;

      const timestamp = new Date(session.created * 1000) // Convert seconds to milliseconds

      const session_id = session.id

      const user_id = await this.repository.getUserBySessionId(session_id)
      console.log(user_id)

      if (!user_id) {
        throw new NotFoundError("User not found")
      }

      const response1 = await this.repository.updateSession(session_id)

      // Save the transaction details in your database
      const result = await this.repository.addPayment(
        user_id,
        session_id,
        paymentintent_id,
        amount_total,
        currency,
        payment_method_types,
        customer_email,
        timestamp
      )
      console.log("testing 123")

      const promocode_id = session.metadata.promocode_id

      if (promocode_id) {
        await this.promoCodeUsed(promocode_id, user_id)
      }

      const existing = await this.repository.getInterviewByUserId(user_id)
      const interview_availability = session.metadata.number_of_interviews
      if (existing.length === 0) {
        // No record, create one
        const response2 = await this.repository.createInterviewAvailability(
          user_id,
          interview_availability
        )
        console.log("response2", response2)
      } else {
        // Increment interviews_available
        const response3 = await this.repository.incrementInterviewAvailability(
          user_id,
          interview_availability
        )
        console.log("response3", response3)
      }

      return true
    }
  }

  // services/interviewService.js

  async addInterview(user_id) {
    const existing = await this.repository.getInterviewByUserId(user_id)

    if (existing.length === 0) {
      // No record, create one
      const result = await this.repository.createInterviewAvailability(
        user_id,
        1
      )
      return { message: "Interview availability created", interview: result }
    } else {
      // Increment interviews_available
      const result = await this.repository.incrementInterviewAvailability(
        user_id
      )
      return {
        message: "Interview availability incremented",
        interview: result,
      }
    }
  }

  async reduceInterview(user_id) {
    const existing = await this.repository.getInterviewByUserId(user_id)

    if (existing.length === 0) {
      throw new UnauthorizedError(
        "No interview availability, user needs to pay first"
      )
    }

    const interview = existing[0]
    if (interview.interviews_available > 1) {
      // Decrement interviews_available
      const result = await this.repository.decrementInterviewAvailability(
        user_id
      )
      return {
        message: "Interview availability decremented",
        interview: result,
      }
    } else {
      // Delete the record
      await this.repository.deleteInterviewAvailability(user_id)
      return { message: "Interview availability exhausted, record deleted" }
    }
  }

  async getInterview(user_id) {
    const existing = await this.repository.getInterviewByUserId(user_id)

    if (existing.length === 0) {
      return { message: "No interview availability", available: 0 }
    } else {
      return {
        message: "Interview availability found",
        available: existing[0].interviews_available,
      }
    }
  }

  async saveBillingInfo(billingData) {
    const billing = await this.repository.addBillingInfo({
      user_id: billingData.user_id,
      billingAddress1: billingData.billingAddress1,
      billingAddress2: billingData.billingAddress2,
      billingTo: billingData.billingTo,
      companyName: billingData.companyName,
      promoCode: billingData.promoCode,
    })

    return billing
  }

  async getPackages(package_type, country) {
    if (!package_type) {
      throw new BadRequestError("package type is required.")
    }

    const packages = await this.repository.getPackages(package_type, country)

    return packages
  }

  async getPackagesById(id) {
    const packages = await this.repository.getPackagesById(id)

    return packages
  }

  async applyPromocode(promocode, user_id) {
    const promocodeExists = await this.repository.checkPromoCodeExists(
      promocode
    )

    if (!promocodeExists) {
      throw new BadRequestError("Promocode does not exist.")
    }

    const promocodeUsage = await this.repository.checkPromoCodeUsage(
      promocodeExists.id,
      user_id
    )
    console.log("agaega", promocodeUsage)
    if (promocodeUsage) {
      throw new BadRequestError("Promocode already used.")
    }
    return promocodeExists
  }

  async promoCodeUsed(promocode_id, user_id) {
    const result = await this.repository.addPromoCodeUsage(
      promocode_id,
      user_id
    )
    return result
  }

  // Generate unique referral code
  generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  async referral(user_id, referral_code) {
    const createReferral = await DB.query({
      text: `INSERT INTO user_referrals (user_id, referral_code) VALUES ($1, $2) RETURNING *`,
      values: [user_id, this.generateReferralCode()],
    })

    if (referral_code) {
      const referrer = await DB.query({
        text: `SELECT * FROM user_referrals WHERE referral_code = $1`,
        values: [referral_code],
      })

      if (referrer.rows.length > 0) {
        // Update referrer's total referrals
        await DB.query({
          text: `UPDATE user_referrals SET total_referrals = total_referrals + 1 WHERE user_id = $1`,
          values: [referrer.rows[0].user_id],
        })

        // Check if referrer should get new discount coupon (every 3 referrals)
        const referral = await DB.query({
          text: `SELECT * FROM user_referrals WHERE user_id = $1`,
          values: [referrer.rows[0].user_id],
        })

        if (referral.rows[0].total_referrals % 3 === 0) {
          const discount_percent = Math.min(
            Math.floor(referral.rows[0].total_referrals / 3) * 10,
            50
          )

          let promo_code = null
          const expiration_date = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ) // 30 days

          if (referral.rows[0].promo_code_id === null) {
            // Create new promo code
            promo_code = await DB.query({
              text: `INSERT INTO promo_codes (code, discount_percent, expiration_date) VALUES ($1, $2, $3) RETURNING *`,
              values: [
                this.generateReferralCode(),
                discount_percent,
                expiration_date,
              ],
            })
          } else {
            // Update promo code
            promo_code = await DB.query({
              text: `UPDATE promo_codes SET code = $1, discount_percent = $2, expiration_date = $3 WHERE id = $4 RETURNING *`,
              values: [
                this.generateReferralCode(),
                discount_percent,
                expiration_date,
                referral.rows[0].promo_code_id,
              ],
            })
          }

          // Assign promo code to referrer
          await DB.query({
            text: `UPDATE user_referrals SET promo_code_id = $1 WHERE user_id = $2`,
            values: [promo_code.rows[0].id, referrer.rows[0].user_id],
          })
        }
      }

      return createReferral
    }
  }

  async getReferral(user_id) {
    const result = await DB.query({
      text: `SELECT user_referrals.*, promo_codes.code 
              FROM user_referrals 
              INNER JOIN promo_codes 
              ON user_referrals.promo_code_id = promo_codes.id 
              WHERE user_referrals.user_id = $1`,
      values: [user_id],
    })

    return result.rows[0]
  }
}

// EventService.subscribe(SERVICE_QUEUE, Service);
// RPCService.respond(Service);

module.exports = Service
