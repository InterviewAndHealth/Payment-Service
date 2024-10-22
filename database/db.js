const { Pool } = require("pg");
const {
  PGUSER,
  PGPASSWORD,
  PGHOST,
  PGPORT,
  PGDATABASE,
  NODE_ENV,
} = require("../config");
const path = require("path");
const fs = require("fs");

class DB {
  static #pool;
  static #isConnected = false;

  static async connect() {
    if (!this.#pool) {
      this.#pool = new Pool({
        user: PGUSER,
        password: PGPASSWORD,
        host: PGHOST,
        port: PGPORT,
        database: PGDATABASE,
        ssl: {
          rejectUnauthorized: false,
        },
      });

      this.#pool.on("error", (err) => {
        console.error("Unexpected error on idle client", err);
        process.exit(-1);
      });

      this.#pool.on("connect", (con) => {
        if (!this.#isConnected) console.log("Connected to database");
        this.#isConnected = true;
      });

      this.paymentsTable();
      console.log("abcd");
      this.interviewAvailabilityTable();
      console.log("abcd123");
      this.sessionsTable();

      console.log("pqrs");
    }
    return this.#pool.connect();
  }

  static async query(query) {
    return this.#pool.query(query);
  }

  static async paymentsTable() {
    const pathToSQL = path.join(__dirname, "queries", "payments.sql");
    const rawQuery = fs.readFileSync(pathToSQL).toString();
    const query = rawQuery.replace(/\n/g, "").replace(/\s+/g, " ");
    return this.#pool.query(query);
  }

  static async interviewAvailabilityTable() {
    const pathToSQL = path.join(__dirname, "queries", "interview_availability.sql");
    const rawQuery = fs.readFileSync(pathToSQL).toString();
    const query = rawQuery.replace(/\n/g, "").replace(/\s+/g, " ");
    return this.#pool.query(query);
  }

  static async sessionsTable() {
    const pathToSQL = path.join(__dirname, "queries", "sessions.sql");
    const rawQuery = fs.readFileSync(pathToSQL).toString();
    const query = rawQuery.replace(/\n/g, "").replace(/\s+/g, " ");
    return this.#pool.query(query);
  }
}

module.exports = DB;
