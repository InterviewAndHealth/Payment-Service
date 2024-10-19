const { customAlphabet } = require("nanoid");
const DB = require("./db");

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

// Repository will be used to interact with the database
class Repository {
 
    async  getInterviewByUserId(user_id) {
      const result = await DB.query({
        text: "SELECT * FROM interview_availability WHERE user_id = $1",
        values: [user_id],
      });
      return result.rows;
    }
    
    async  createInterviewAvailability(user_id, interviews_available = 1) {
      const result = await DB.query({
        text: "INSERT INTO interview_availability (user_id, interviews_available) VALUES ($1, $2) RETURNING *",
        values: [user_id, interviews_available],
      });
      return result.rows[0];
    }
    
    async  incrementInterviewAvailability(user_id) {
      const result = await DB.query({
        text: "UPDATE interview_availability SET interviews_available = interviews_available + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *",
        values: [user_id],
      });
      return result.rows[0];
    }
    
    async  decrementInterviewAvailability(user_id) {
      const result = await DB.query({
        text: "UPDATE interview_availability SET interviews_available = interviews_available - 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *",
        values: [user_id],
      });
      return result.rows[0];
    }
    
    async  deleteInterviewAvailability(user_id) {
      await DB.query({
        text: "DELETE FROM interview_availability WHERE user_id = $1",
        values: [user_id],
      });
    }
  



}

module.exports = Repository;
