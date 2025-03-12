const { customAlphabet } = require("nanoid")
const DB = require("./db")

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12)

// Repository will be used to interact with the database
class Repository {
  async getInterviewByUserId(user_id, package_type) {
    let result
    if (package_type) {
      result = await DB.query({
        text: `SELECT * FROM interview_availability WHERE user_id = $1 AND package_type = $2`,
        values: [user_id, package_type],
      })
    } else {
      result = await DB.query({
        text: `SELECT * FROM interview_availability WHERE user_id = $1`,
        values: [user_id],
      })
    }

    return result.rows
  }

  async createInterviewAvailability(
    user_id,
    interviews_available = 1,
    package_type
  ) {
    const result = await DB.query({
      text: `INSERT INTO interview_availability (user_id, interviews_available, package_type) VALUES ($1, $2, $3) RETURNING *`,
      values: [user_id, interviews_available, package_type],
    })
    return result.rows[0]
  }

  async incrementInterviewAvailability(
    user_id,
    interviews_available,
    package_type
  ) {
    const result = await DB.query({
      text: `UPDATE interview_availability SET interviews_available = interviews_available + $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND package_type = $3 RETURNING *`,
      values: [user_id, interviews_available, package_type],
    })
    return result.rows[0]
  }

  async decrementInterviewAvailability(user_id, package_type) {
    const result = await DB.query({
      text: `UPDATE interview_availability SET interviews_available = interviews_available - 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND package_type = $2 RETURNING *`,
      values: [user_id, package_type],
    })
    return result.rows[0]
  }

  async deleteInterviewAvailability(user_id, package_type) {
    await DB.query({
      text: `DELETE FROM interview_availability WHERE user_id = $1 AND package_type = $2`,
      values: [user_id, package_type],
    })
  }

  async updateInterviewAvailability(
    user_id,
    interviews_available,
    package_type
  ) {
    const result = await DB.query({
      text: `UPDATE interview_availability SET interviews_available = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND package_type = $3 RETURNING *`,
      values: [user_id, interviews_available, package_type],
    })
    return result.rows[0]
  }

  async addSession(session_id, user_id) {
    const result = await DB.query({
      text: `INSERT INTO sessions (session_id,user_id) VALUES ($1,$2) RETURNING *`,
      values: [session_id, user_id],
    })
    return result.rows[0]
  }

  async updateSession(session_id) {
    const result = await DB.query({
      text: `UPDATE sessions SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE session_id = $1 RETURNING *`,
      values: [session_id],
    })
    return result.rows[0]
  }

  async getUserBySessionId(sessionId) {
    const result = await DB.query({
      text: `SELECT * FROM sessions WHERE session_id = $1 and status = 'pending'`,
      values: [sessionId],
    })
    return result.rows[0].user_id
  }

  async addPayment(
    user_id,
    session_id,
    paymentintent_id,
    amount_total,
    currency,
    payment_method_types,
    customer_email,
    timestamp
  ) {
    const result = await DB.query({
      text: `INSERT INTO payments (user_id,session_id,paymentintent_id,amount_total,currency,payment_method_types,customer_email,timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      values: [
        user_id,
        session_id,
        paymentintent_id,
        amount_total,
        currency,
        payment_method_types,
        customer_email,
        timestamp,
      ],
    })
    return result.rows[0]
  }

  async addBillingInfo(billingData) {
    const result = await DB.query({
      text: `INSERT INTO billing_info 
      (user_id,billingAddress1,billingAddress2,billingTo,companyName,promoCode)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      values: [
        billingData.user_id,
        billingData.billingAddress1,
        billingData.billingAddress2,
        billingData.billingTo,
        billingData.companyName,
        billingData.promoCode,
      ],
    })
    return result.rows[0]
  }

  async getPackages(user_type, country) {
    let result = await DB.query({
      text: `
      SELECT *
      FROM packages
      WHERE user_type = $1 AND country = $2
    `,
      values: [user_type.toUpperCase(), country.toUpperCase()],
    })

    if (result.rows.length === 0) {
      result = await DB.query({
        text: `
        SELECT *
        FROM packages
        WHERE user_type = $1 AND country = $2
      `,
        values: [user_type.toUpperCase(), "US"],
      })
    }

    return result.rows
  }

  async getPackagesById(id) {
    const result = await DB.query({
      text: `SELECT * FROM packages WHERE id = $1`,
      values: [id],
    })
    return result.rows[0]
  }

  async checkPromoCodeExists(promocode, role) {
    const result = await DB.query({
      text: "SELECT * FROM promo_codes WHERE code = $1 AND is_active = TRUE AND expiration_date > NOW() AND role = $2",
      values: [promocode, role.toLowerCase()],
    })

    return result.rows[0]
  }

  async checkPromoCodeUsage(promocode_id, user_id) {
    const result = await DB.query({
      text: "SELECT * FROM promo_code_usage WHERE promo_code_id = $1 AND user_id = $2",
      values: [promocode_id, user_id],
    })

    return result.rows[0]
  }

  async addPromoCodeUsage(promocode_id, user_id) {
    const result = await DB.query({
      text: "INSERT INTO promo_code_usage (promo_code_id, user_id) VALUES ($1, $2) RETURNING *",
      values: [promocode_id, user_id],
    })

    return result.rows[0]
  }

  async createReferral(user_id, referral_code) {
    const result = await DB.query({
      text: `INSERT INTO user_referrals (user_id, referral_code) VALUES ($1, $2) RETURNING *`,
      values: [user_id, referral_code],
    })

    return result.rows[0]
  }

  async getReferrer(referral_code) {
    const result = await DB.query({
      text: `SELECT * FROM user_referrals WHERE referral_code = $1`,
      values: [referral_code],
    })

    return result.rows[0]
  }

  async updateTotalReferrals(user_id) {
    const result = await DB.query({
      text: `UPDATE user_referrals SET total_referrals = total_referrals + 1 WHERE user_id = $1`,
      values: [user_id],
    })

    return result.rows[0]
  }

  async getTotalReferrals(user_id) {
    const result = await DB.query({
      text: `SELECT * FROM user_referrals WHERE user_id = $1`,
      values: [user_id],
    })

    return result.rows[0]
  }

  async createPromoCode({
    code,
    discount_value,
    expiration_date,
    role,
    promo_code_type,
    is_active,
  }) {
    const result = await DB.query({
      text: `INSERT INTO promo_codes (code, discount_value, expiration_date, role, promo_code_type, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      values: [
        code,
        discount_value,
        expiration_date,
        role,
        promo_code_type,
        is_active,
      ],
    })

    return result.rows[0]
  }

  async updatePromoCode(code, discount_value, expiration_date, promo_code_id) {
    const result = await DB.query({
      text: `UPDATE promo_codes SET code = $1, discount_value = $2, expiration_date = $3 WHERE id = $4 RETURNING *`,
      values: [code, discount_value, expiration_date, promo_code_id],
    })

    return result.rows[0]
  }

  async assignPromoCode(promo_code_id, user_id) {
    const result = await DB.query({
      text: `UPDATE user_referrals SET promo_code_id = $1 WHERE user_id = $2`,
      values: [promo_code_id, user_id],
    })

    return result.rows[0]
  }

  async getReferral(user_id) {
    const result = await DB.query({
      text: `SELECT user_referrals.*, promo_codes.code 
              FROM user_referrals 
              LEFT JOIN promo_codes 
              ON user_referrals.promo_code_id = promo_codes.id 
              WHERE user_referrals.user_id = $1`,
      values: [user_id],
    })

    return result.rows[0]
  }

  async getInterviewAvailabilityByUserId(user_id) {
    const result = await DB.query({
      text: `SELECT * FROM interview_availability WHERE user_id = $1`,
      values: [user_id],
    })
    return result.rows
  }

  async decrementInterviewAvailabilityByUserId(user_id, number_of_interviews) {
    const result = await DB.query({
      text: `UPDATE interview_availability SET interviews_available = interviews_available - $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *`,
      values: [user_id, number_of_interviews],
    })
    return result.rows[0]
  }

  async getSubscription(user_id) {
    const result = await DB.query({
      text: `SELECT * FROM subscriptions WHERE user_id = $1`,
      values: [user_id],
    })
    return result.rows[0]
  }

  async getActiveSubscription(user_id) {
    const result = await DB.query({
      text: `SELECT s.*, p.ai_screening
FROM subscriptions s
JOIN packages p ON s.package_id = p.id
WHERE s.user_id = $1
  AND s.status = 'ACTIVE';
`,
      values: [user_id],
    })
    return result.rows[0]
  }

  async getSubscriptionByStripeCustomerId(stripe_customer_id) {
    const result = await DB.query({
      text: `SELECT * FROM subscriptions WHERE stripe_customer_id = $1`,
      values: [stripe_customer_id],
    })
    return result.rows[0]
  }

  async createSubscription(user_id, id, stripe_customer_id) {
    const subscriptionDuration = "30 days"

    const result = await DB.query({
      text: `INSERT INTO subscriptions (user_id, package_id, stripe_customer_id, expires_at) 
               VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '${subscriptionDuration}') 
               RETURNING *`,
      values: [user_id, id, stripe_customer_id],
    })

    return result.rows[0]
  }

  async updateSubscriptionId(stripe_customer_id, stripe_subscription_id) {
    const result = await DB.query({
      text: `UPDATE subscriptions SET stripe_subscription_id = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_customer_id = $2 RETURNING *`,
      values: [stripe_subscription_id, stripe_customer_id],
    })
    return result.rows[0]
  }

  async updateSubscriptionStatus(stripe_subscription_id, status) {
    const result = await DB.query({
      text: `UPDATE subscriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = $2 RETURNING *`,
      values: [status, stripe_subscription_id],
    })
    return result.rows[0]
  }

  async updateSubscriptionPackageId(stripe_subscription_id, package_id) {
    const result = await DB.query({
      text: `UPDATE subscriptions SET package_id = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = $2 RETURNING *`,
      values: [package_id, stripe_subscription_id],
    })
    return result.rows[0]
  }

  async getPackageById(id) {
    const result = await DB.query({
      text: `SELECT * FROM packages WHERE id = $1`,
      values: [id],
    })
    return result.rows[0]
  }
}

module.exports = Repository
