const bcrypt = require("bcrypt");
const { Repository } = require("../database");
const {
  NotFoundError,
  BadRequestError,
  InternalServerError,
} = require("../utils/errors");
const { EventService, RPCService } = require("./broker");
const {
  SERVICE_QUEUE,
  EVENT_TYPES,
  TEST_QUEUE,
  TEST_RPC,
} = require("../config");

const {STRIPE_SECRET_KEY} = require('../config');
const stripe = require("stripe")(STRIPE_SECRET_KEY);

// Service will contain all the business logic
class Service {


  constructor() {
    this.repository = new Repository();
  }



  async createCheckoutSession(product, successUrl, cancelUrl) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
            },
            unit_amount: product.price * 100,
          },
          quantity: product.quantity,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  
    return { id: session.id };
  }



  // services/interviewService.js

async addInterview(user_id) {
  const existing = await repository.getInterviewByUserId(user_id);

  if (existing.length === 0) {
    // No record, create one
    const result = await repository.createInterviewAvailability(user_id, 1);
    return { message: "Interview availability created", interview: result };
  } else {
    // Increment interviews_available
    const result = await repository.incrementInterviewAvailability(user_id);
    return { message: "Interview availability incremented", interview: result };
  }
}

async reduceInterview(user_id) {
  const existing = await repository.getInterviewByUserId(user_id);

  if (existing.length === 0) {
    throw new Error("No interview availability, user needs to pay first");
  }

  const interview = existing[0];
  if (interview.interviews_available > 1) {
    // Decrement interviews_available
    const result = await repository.decrementInterviewAvailability(user_id);
    return { message: "Interview availability decremented", interview: result };
  } else {
    // Delete the record
    await repository.deleteInterviewAvailability(user_id);
    return { message: "Interview availability exhausted, record deleted" };
  }
}

async getInterview(user_id) {
  const existing = await repository.getInterviewByUserId(user_id);

  if (existing.length === 0) {
    return { message: "No interview availability", available: 0 };
  } else {
    return { message: "Interview availability found", available: existing[0].interviews_available };
  }
}


}

// EventService.subscribe(SERVICE_QUEUE, Service);
// RPCService.respond(Service);

module.exports = Service;
