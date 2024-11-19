const { customAlphabet } = require("nanoid");
const DB = require("./db");

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

// Repository will be used to interact with the database
class Repository {
  async getInterviewByUserId(user_id) {
    const result = await DB.query({
      text: `SELECT * FROM interview_availability WHERE user_id = $1`,
      values: [user_id],
    });
    return result.rows;
  }

  async createInterviewAvailability(user_id, interviews_available = 1) {
    const result = await DB.query({
      text: `INSERT INTO interview_availability (user_id, interviews_available) VALUES ($1, $2) RETURNING *`,
      values: [user_id, interviews_available],
    });
    return result.rows[0];
  }

  async incrementInterviewAvailability(user_id, interviews_available) {
    const result = await DB.query({
      text: `UPDATE interview_availability SET interviews_available = interviews_available + $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *`,
      values: [user_id, interviews_available],
    });
    return result.rows[0];
  }

  async decrementInterviewAvailability(user_id) {
    const result = await DB.query({
      text: `UPDATE interview_availability SET interviews_available = interviews_available - 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *`,
      values: [user_id],
    });
    return result.rows[0];
  }

  async deleteInterviewAvailability(user_id) {
    await DB.query({
      text: `DELETE FROM interview_availability WHERE user_id = $1`,
      values: [user_id],
    });
  }

  async addSession(session_id, user_id) {
    const result = await DB.query({
      text: `INSERT INTO sessions (session_id,user_id) VALUES ($1,$2) RETURNING *`,
      values: [session_id, user_id],
    });
    return result.rows[0];
  }

  async updateSession(session_id) {
    const result = await DB.query({
      text: `UPDATE sessions SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE session_id = $1 RETURNING *`,
      values: [session_id],
    });
    return result.rows[0];
  }

  async getUserBySessionId(sessionId) {
    const result = await DB.query({
      text: `SELECT * FROM sessions WHERE session_id = $1 and status = 'pending'`,
      values: [sessionId],
    });
    return result.rows[0].user_id;
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
    });
    return result.rows[0];
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
      ]
    });
    return result.rows[0];
  }

  async getPackages(package_type, country){
    let usertype;
    if(package_type=='student'){
      usertype = 'USER';
    }else{
      usertype = 'CORPORATE';
    }
    let result = await DB.query({
      text:  `
      SELECT *
      FROM packages
      WHERE package_type = $1 AND country = $2
    `,
    values: [usertype.toUpperCase(), country.toUpperCase()]
    });
    
    // if(result.rows.length === 0){
    //   result = await DB.query({
    //     text:  `
    //     SELECT *
    //     FROM packages
    //     WHERE package_type = $1 AND country = $2
    //   `,
    //   values: [package_type.toUpperCase(), country.toUpperCase()]
    //   });
    // }
    
    return result.rows;
  }

  async getPackagesById(id){
    const result = await DB.query({
      text: `SELECT * FROM packages WHERE id = $1`,
      values: [id],
    });
    return result.rows[0];
  }
}

module.exports = Repository;
