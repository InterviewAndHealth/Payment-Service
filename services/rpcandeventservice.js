const { Service } = require("../services")
const { Repository, DB } = require("../database")

class RPCAndEventService {
  constructor() {
    this.repository = new Repository()
    this.service = new Service()
  }

  async respondRPC(request) {
    console.log("Request received", request)
  }

  async handleEvent(event) {
    console.log("Event received", event)
    if (event.type === "USER_CREATED") {
      const { userId, referral_code, role } = event.data
      const user_id = userId

      const data = await this.service.referral(user_id, referral_code, role)
    }
  }
}

module.exports = { RPCAndEventService }
