const bcrypt = require("bcrypt");
const { Repository } = require("../database");
const {
  NotFoundError,
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} = require("../utils/errors");

const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = require("../config");
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

  async addSessionInfo(session_id, user_id) {
    const result = await this.repository.addSession(session_id, user_id);
    return { message: "Session Added successfully", session: result };
  }

  async webhookservice(sig, info) {
    let event;

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
      );
    } catch (err) {
      console.error("Webhook signature verification failed.", err);
      throw new BadRequestError(`Webhook Error: ${err.message}`);
    }

    if (!event) {
      throw new BadRequestError("Invalid Event");
    }

    // Handle the event types you care about
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      // Extract important payment details from the session object
      const paymentintent_id = session.payment_intent;
      const amount_total = session.amount_total;
      const currency = session.currency;
      const payment_method_types = session.payment_method_types;
      const customer_email = session.customer_details.email;
      // const timestamp = session.created;

      const timestamp = new Date(session.created * 1000); // Convert seconds to milliseconds

      const session_id = session.id;

      const user_id = await this.repository.getUserBySessionId(session_id);
      console.log(user_id);

      if (!user_id) {
        throw new NotFoundError("User not found");
      }

      const response1 = await this.repository.updateSession(session_id);

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
      );
      console.log("testing 123");

      const existing = await this.repository.getInterviewByUserId(user_id);

      if (existing.length === 0) {
        // No record, create one
        const response2 = await this.repository.createInterviewAvailability(
          user_id,
          1
        );
      } else {
        // Increment interviews_available
        const response3 = await this.repository.incrementInterviewAvailability(
          user_id
        );
      }

      return true;
    }
  }

  // services/interviewService.js

  async addInterview(user_id) {
    const existing = await this.repository.getInterviewByUserId(user_id);

    if (existing.length === 0) {
      // No record, create one
      const result = await this.repository.createInterviewAvailability(
        user_id,
        1
      );
      return { message: "Interview availability created", interview: result };
    } else {
      // Increment interviews_available
      const result = await this.repository.incrementInterviewAvailability(
        user_id
      );
      return {
        message: "Interview availability incremented",
        interview: result,
      };
    }
  }

  async reduceInterview(user_id) {
    const existing = await this.repository.getInterviewByUserId(user_id);

    if (existing.length === 0) {
      throw new UnauthorizedError(
        "No interview availability, user needs to pay first"
      );
    }

    const interview = existing[0];
    if (interview.interviews_available > 1) {
      // Decrement interviews_available
      const result = await this.repository.decrementInterviewAvailability(
        user_id
      );
      return {
        message: "Interview availability decremented",
        interview: result,
      };
    } else {
      // Delete the record
      await this.repository.deleteInterviewAvailability(user_id);
      return { message: "Interview availability exhausted, record deleted" };
    }
  }

  async getInterview(user_id) {
    const existing = await this.repository.getInterviewByUserId(user_id);

    if (existing.length === 0) {
      return { message: "No interview availability", available: 0 };
    } else {
      return {
        message: "Interview availability found",
        available: existing[0].interviews_available,
      };
    }
  }
}

// EventService.subscribe(SERVICE_QUEUE, Service);
// RPCService.respond(Service);

module.exports = Service;
