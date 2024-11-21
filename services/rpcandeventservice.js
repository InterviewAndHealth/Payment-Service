class RPCAndEnentService {
  constructor() {}

  async respondRPC(request) {
    console.log("Request received", request);
  }

  async handleEvent(event) {
    console.log("Event received", event);
  }
}

module.exports = { RPCAndEnentService };
