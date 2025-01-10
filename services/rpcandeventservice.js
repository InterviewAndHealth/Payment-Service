const { Service } = require("../services")
const { Repository, DB } = require("../database")

class RPCAndEventService {
  constructor() {
    this.repository = new Repository()
    this.service = new Service()
  }

  async respondRPC(request) {
    console.log("Request received", request)

    if (request.type === "GET_RECRUITER_INTERVIEW_AVAILABLE") {
      const { user_id } = request.data
      const recruiter_data = await this.repository.getInterviewAvailabilityByUserId(user_id)

      return { recruiter_data }
    }else if(request.type === "DECREMENT_RECRUITER_INTERVIEW_AVAILABLE"){ 

      const { user_id,number_of_interviews } = request.data

      const recruiter_data = await this.repository.decrementInterviewAvailabilityByUserId(user_id,number_of_interviews)

      return { result:recruiter_data }

    }
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
