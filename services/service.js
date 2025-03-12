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
    const packageType = product.package_type.toUpperCase()
    let finalPrice = product.price
    let promocode_id = null
    let stripe_promocode_id = null
    let trialPeriodDays = undefined
    let discount

    if (promocode) {
      discount = await this.applyPromocode(promocode, user_id, role)
      promocode_id = discount.id

      if (discount.promo_code_type === "flat") {
        finalPrice = product.price - discount.discount_value
      } else if (discount.promo_code_type === "percentage") {
        finalPrice =
          product.price - (product.price * discount.discount_value) / 100
      } else if (discount.promo_code_type === "trial") {
        trialPeriodDays = discount.discount_value
      } else {
        throw new BadRequestError("Invalid promo code type")
      }

      if (isNaN(finalPrice) || finalPrice < 0) {
        throw new BadRequestError("Invalid final price after applying discount")
      }
    }

    let stripe_customer_id
    if (packageType === "RECURRING") {
      const subscription = await this.repository.getActiveSubscription(user_id)

      if (subscription) {
        throw new BadRequestError("User already has a subscription")
      } else {
        const stripeCustomer = await stripe.customers.create({
          name: user_id,
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

    if (
      promocode_id &&
      packageType === "RECURRING" &&
      (discount.promo_code_type === "flat" ||
        discount.promo_code_type === "percentage")
    ) {
      const stripe_promocode = await stripe.coupons.create({
        duration: "once",
        amount_off:
          discount.promo_code_type === "flat"
            ? discount.discount_value
            : undefined,
        percent_off:
          discount.promo_code_type === "percentage"
            ? discount.discount_value
            : undefined,
        currency: product.currency,
        max_redemptions: 1,
        redeem_by: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // Expires in 30 days
      })
      stripe_promocode_id = stripe_promocode.id
    }

    let lineItems = [
      {
        ...(packageType === "RECURRING" && {
          price: product.price_id,
        }),
        ...(packageType === "ONETIME" && {
          price_data: {
            currency: product.currency,
            product_data: { name: product.name },
            unit_amount: Math.round(finalPrice * 100),
          },
        }),
        quantity: product.quantity,
      },
    ]

    const session = await stripe.checkout.sessions.create({
      mode: packageType === "RECURRING" ? "subscription" : "payment",
      customer: packageType === "RECURRING" ? stripe_customer_id : undefined,
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata: {
        promocode_id,
        number_of_interviews,
      },
      subscription_data:
        packageType === "RECURRING" && trialPeriodDays
          ? {
              trial_period_days: trialPeriodDays,
            }
          : undefined,
      discounts: stripe_promocode_id
        ? [{ coupon: stripe_promocode_id }]
        : undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
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
      console.log("checkout.session.completed", session)

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
        const existing = await this.repository.getInterviewByUserId(
          user_id,
          "ONETIME"
        )
        const interview_availability = session.metadata.number_of_interviews
        if (existing.length === 0) {
          // No record, create one
          await this.repository.createInterviewAvailability(
            user_id,
            interview_availability,
            "ONETIME"
          )
        } else {
          // Increment interviews_available
          await this.repository.incrementInterviewAvailability(
            user_id,
            interview_availability,
            "ONETIME"
          )
        }
      }
    }

    // Event when the payment is successfull (every subscription interval)
    if (event.type === "invoice.paid") {
      const invoice = event.data.object
      console.log("invoice.paid", invoice)

      const stripe_subscription_id = invoice?.subscription || invoice?.discount?.subscription
      await this.repository.updateSubscriptionStatus(
        stripe_subscription_id,
        "ACTIVE"
      )
      const stripe_customer_id = invoice?.customer || invoice?.discount?.customer
      const existingSubscription =
        await this.repository.getSubscriptionByStripeCustomerId(
          stripe_customer_id
        )
      const user_id = existingSubscription.user_id
      if (existingSubscription) {
        const pkg = await this.repository.getPackageById(
          existingSubscription.package_id
        )

        if (pkg) {
          const existing = await this.repository.getInterviewByUserId(
            user_id,
            pkg.package_type
          )
          const interview_availability = pkg.number_of_interviews
          if (existing.length === 0) {
            // No record, create one
            await this.repository.createInterviewAvailability(
              user_id,
              interview_availability,
              pkg.package_type
            )
          } else {
            // Update interviews_available
            await this.repository.updateInterviewAvailability(
              user_id,
              interview_availability,
              pkg.package_type
            )
          }
        }
      }
    }

    // Event when the payment failed due to card problems or insufficient funds (every subscription interval)
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object
      console.log("invoice.payment_failed", invoice)

      const existingSubscription =
        await this.repository.getSubscriptionByStripeCustomerId(
          invoice.customer
        )
      await this.repository.deleteInterviewAvailability(
        existingSubscription.user_id,
        "RECURRING"
      )
      await this.repository.updateSubscriptionStatus(
        invoice.subscription,
        "UNPAID"
      )
    }

    // Event when subscription is updated
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object

      console.log("customer.subscription.updated", subscription)

      if (subscription.status === "canceled") {
        const existingSubscription =
          await this.repository.getSubscriptionByStripeCustomerId(
            subscription.customer
          )
        await this.repository.deleteInterviewAvailability(
          existingSubscription.user_id,
          "RECURRING"
        )

        await this.repository.updateSubscriptionStatus(
          subscription.id,
          "CANCELED"
        )
      }
    }

    return true
  }

  async getSubscription(user_id) {
    return await this.repository.getActiveSubscription(user_id)
  }

  async cancelSubscription(user_id) {
    const subscription = await this.repository.getActiveSubscription(user_id)
    if (!subscription) {
      throw new NotFoundError("Subscription not found")
    }
    return await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: false,
      }
    )
  }

  async updateSubscription(user_id, product) {
    const subscription = await this.repository.getActiveSubscription(user_id)
    if (!subscription) {
      throw new NotFoundError("Subscription not found")
    }

    await this.repository.updateSubscriptionPackageId(
      subscription.stripe_subscription_id,
      product.id
    )

    const currentSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    )

    const currentSubscriptionItemId = currentSubscription.items.data[0].id

    return await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        items: [
          {
            id: currentSubscriptionItemId,
            price: product.price_id,
          },
        ],
        metadata: {
          type: "upgrade_subscription",
        },
      }
    )
  }

  // services/interviewService.js
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
        user_id,
        interview.package_type
      )
      return {
        message: "Interview availability decremented",
        interview: result,
      }
    } else {
      // Delete the record
      await this.repository.deleteInterviewAvailability(
        user_id,
        interview.package_type
      )
      return { message: "Interview availability exhausted, record deleted" }
    }
  }

  async getInterview(user_id) {
    const existing = await this.repository.getInterviewByUserId(user_id)

    if (existing.length === 0) {
      return { message: "No interview availability", available: 0 }
    } else {
      let totalInterviewsAvailable = 0
      for (let i = 0; i < existing.length; i++) {
        totalInterviewsAvailable += existing[i].interviews_available
      }
      return {
        message: "Interview availability found",
        available: totalInterviewsAvailable,
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

  async createPromocode({
    code,
    discount_value,
    expiration_date,
    role,
    promo_code_type,
    is_active,
  }) {
    const promocodeExists = await this.repository.checkPromoCodeExists(
      code,
      role
    )

    if (promocodeExists) {
      throw new BadRequestError("Promocode already exist.")
    }

    return await this.repository.createPromoCode({
      code,
      discount_value,
      expiration_date,
      role,
      promo_code_type,
      is_active,
    })
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
          const discount_value = Math.min(
            Math.floor(referral.total_referrals / 3) * 10,
            50
          )

          let promo_code = null
          const expiration_date = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ) // 30 days

          if (referral.promo_code_id === null) {
            // Create new promo code
            promo_code = await this.repository.createPromoCode({
              code: this.generateReferralCode(),
              discount_value,
              expiration_date,
              role,
              promo_code_type: "percentage",
              is_active: true,
            })
          } else {
            // Update promo code
            promo_code = await this.repository.updatePromoCode(
              this.generateReferralCode(),
              discount_value,
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
