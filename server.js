const express = require("express");
require("express-async-errors");
const cors = require("cors");
const error = require("./middlewares/error");
const routes = require("./routes/routes");
const { DB } = require("./database");

module.exports = async (app) => {
  await DB.connect();

  // app.use(express.json());

  app.use((req, res, next) => {
    if (req.originalUrl === "/webhook") {
      // Bypass JSON middleware for the /webhook route
      next();
    } else {
      express.json()(req, res, next);
    }
  });
  app.use(cors());
  app.use(routes);
  app.use(error);
};
