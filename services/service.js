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
    promocode,
    role
  ) {
    let finalPrice = product.price
    let promocode_id = null

    if (promocode) {
      const discount = await this.applyPromocode(promocode, user_id, role)

      promocode_id = discount.id

      if (discount.promo_code_type === "flat") {
        finalPrice = product.price - discount.discount_value
      } else if (discount.promo_code_type === "percentage") {
        finalPrice = discount
          ? product.price - (product.price * discount.discount_value) / 100
          : product.price
      } else {
        throw new BadRequestError("Invalid promo code type")
      }

      if (isNaN(finalPrice) || finalPrice < 0) {
        throw new BadRequestError("Something went wrong")
      }
    }

    let stripe_customer_id
    if (product.package_type.toUpperCase() === "RECURRING") {
      const subscription = await this.repository.getSubscription(user_id)

      if (subscription) {
        stripe_customer_id = subscription.stripe_customer_id
      } else {
        const stripeCustomer = await stripe.customers.create({
          name: `${user_id}`,
          metadata: {
            user_id,
          },
        })

        stripe_customer_id = stripeCustomer.id

        await this.repository.createSubscription(
          user_id,
          product.id,
          stripe_customer_id
        )
      }
    }

    let mode
    let lineItems = [
      {
        price_data: {
          currency: product.currency,
          product_data: {
            name: product.name,
          },
          unit_amount: Math.round(finalPrice * 100),
          ...(product.package_type.toUpperCase() === "RECURRING" && {
            recurring: {
              interval: "day",
            },
          }),
        },
        quantity: product.quantity,
      },
    ]

    if (product.package_type.toUpperCase() === "RECURRING") {
      mode = "subscription"
    } else {
      mode = "payment" // for one-time payment
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      ...(product.package_type.toUpperCase() === "RECURRING" && {
        customer: stripe_customer_id,
      }),
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata: {
        promocode_id,
        number_of_interviews,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    })

    console.log(session)

    return { id: session.id }
  }

  async addSessionInfo(session_id, user_id) {
    const result = await this.repository.addSession(session_id, user_id)
    return { message: "Session Added successfully", session: result }
  }

  async webhookservice(sig, info) {
    let event
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

      if (session.subscription) {
        // update stripe_subscription_id
        await this.repository.updateSubscriptionId(
          session.customer,
          session.subscription
        )
      }

      const session_id = session.id

      const user_id = await this.repository.getUserBySessionId(session_id)

      if (!user_id) {
        throw new NotFoundError("User not found")
      }

      await this.repository.updateSession(session_id)

      // Save the transaction details in your database
      await this.repository.addPayment(
        user_id,
        session_id,
        paymentintent_id,
        amount_total,
        currency,
        payment_method_types,
        customer_email,
        timestamp
      )

      const promocode_id = session.metadata.promocode_id

      if (promocode_id) {
        await this.promoCodeUsed(promocode_id, user_id)
      }

      if (session.mode === "payment") {
        const existing = await this.repository.getInterviewByUserId(user_id)
        const interview_availability = session.metadata.number_of_interviews
        if (existing.length === 0) {
          // No record, create one
          await this.repository.createInterviewAvailability(
            user_id,
            interview_availability
          )
        } else {
          // Increment interviews_available
          await this.repository.incrementInterviewAvailability(
            user_id,
            interview_availability
          )
        }
      }
    }

    // Event when the payment is successfull (every subscription interval)
    if (event.type === "invoice.paid") {
      const invoice = event.data.object

      await this.repository.updateSubscriptionStatus(
        invoice.subscription,
        "ACTIVE"
      )
    }

    // Event when the payment failed due to card problems or insufficient funds (every subscription interval)
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object

      await this.repository.updateSubscriptionStatus(
        invoice.subscription,
        "UNPAID"
      )
    }

    // Event when subscription is updated
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object
      
      if (subscription.status === "canceled") {
        await this.repository.updateSubscriptionStatus(
          subscription.id,
          "CANCELED"
        )
      }

      if (subscription.status === "active") {
        await this.repository.updateSubscriptionStatus(
          subscription.id,
          "ACTIVE"
        )

        const existingSubscription =
          await this.repository.getSubscriptionByStripeCustomerId(
            subscription.customer
          )
        const user_id = existingSubscription.user_id
        if (existingSubscription) {
          const pkg = await this.repository.getPackageById(
            existingSubscription.package_id
          )
          
          if (pkg) {
            const existing = await this.repository.getInterviewByUserId(user_id)
            const interview_availability = pkg.number_of_interviews
            if (existing.length === 0) {
              // No record, create one
              await this.repository.createInterviewAvailability(
                user_id,
                interview_availability
              )
            } else {
              // Increment interviews_available
              await this.repository.incrementInterviewAvailability(
                user_id,
                interview_availability
              )
            }
          }
        }
      }
    }

    return true
  }

  async cancelSubscription(stripe_subscription_id) {
    return await stripe.subscriptions.cancel(
      stripe_subscription_id
    )
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

  async getPackages(user_type, country) {
    if (!user_type) {
      throw new BadRequestError("user type is required.")
    }

    const packages = await this.repository.getPackages(user_type, country)

    return packages
  }

  async getPackagesById(id) {
    const packages = await this.repository.getPackagesById(id)

    return packages
  }

  async applyPromocode(promocode, user_id, role) {
    const promocodeExists = await this.repository.checkPromoCodeExists(
      promocode,
      role
    )

    if (!promocodeExists) {
      throw new BadRequestError("Promocode does not exist.")
    }

    const promocodeUsage = await this.repository.checkPromoCodeUsage(
      promocodeExists.id,
      user_id
    )

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

  async referral(user_id, referral_code, role) {
    const createReferral = await this.repository.createReferral(
      user_id,
      this.generateReferralCode()
    )
    if (referral_code) {
      const referrer = await this.repository.getReferrer(referral_code)
      if (referrer) {
        // Update referrer's total referrals
        await this.repository.updateTotalReferrals(referrer.user_id)

        // Check if referrer should get new discount coupon (every 3 referrals)
        const referral = await this.repository.getTotalReferrals(
          referrer.user_id
        )

        if (referral.total_referrals % 3 === 0) {
          const discount_percent = Math.min(
            Math.floor(referral.total_referrals / 3) * 10,
            50
          )

          let promo_code = null
          const expiration_date = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ) // 30 days

          if (referral.promo_code_id === null) {
            // Create new promo code
            promo_code = await this.repository.createPromoCode(
              this.generateReferralCode(),
              discount_percent,
              expiration_date,
              role
            )
          } else {
            // Update promo code
            promo_code = await this.repository.updatePromoCode(
              this.generateReferralCode(),
              discount_percent,
              expiration_date,
              referral.promo_code_id
            )
          }

          // Assign promo code to referrer
          await this.repository.assignPromoCode(promo_code.id, referrer.user_id)
        }
      }

      return createReferral
    }
  }

  async getReferral(user_id) {
    let result = await this.repository.getReferral(user_id)
    // If no record, create one
    if (!result) {
      result = await this.repository.createReferral(
        user_id,
        this.generateReferralCode()
      )
    }
    return result
  }
}

// EventService.subscribe(SERVICE_QUEUE, Service);
// RPCService.respond(Service);

module.exports = Service
