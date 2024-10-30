const { nanoid } = require("nanoid");
const Broker = require("./broker");
const { RPC_QUEUE } = require("../../config");

class RPCService {
  /**
   * Request a data from a service
   * @param {string} service_rpc - The service rpc to request data from
   * @param {object} request_payload - The request payload
   * @param {number} timeout - The request timeout in seconds (default is 10 seconds)
   * @returns {Promise} - A promise that resolves when the request is successful
   * @throws {Error} - If request fails
   * @example
   * await RPCService.request('INTERVIEW_SERVICE', {
   *    type: 'GET_INTERVIEW',
   *    data: {
   *        interviewId: 1,
   *    },
   * });
   */
  static async request(service_rpc, request_payload, timeout = 10) {
    try {
      const id = nanoid();
      const channel = await Broker.connect();
      const queue = await channel.assertQueue("", { exclusive: true });

      channel.sendToQueue(
        service_rpc,
        Buffer.from(JSON.stringify(request_payload)),
        {
          replyTo: queue.queue,
          correlationId: id,
        }
      );

      return new Promise((resolve, reject) => {
        const rpcTimeout = setTimeout(() => {
          reject("Unable to get data");
        }, timeout * 1000);

        channel.consume(
          queue.queue,
          (data) => {
            if (data.properties.correlationId === id) {
              resolve(JSON.parse(data.content.toString()));
              clearTimeout(rpcTimeout);
            } else {
              reject("Data not found");
            }
          },
          { noAck: true }
        );
      });
    } catch (err) {
      console.log("Failed to request data");
    }
  }

  /**
   * Respond to a request from a service
   * @param {function} responder - Service to respond to requests with function `respondRPC` to handle requests
   * @returns {Promise} - A promise that resolves when the response is successful
   * @throws {Error} - If response fails
   * @example
   * await RPCService.respond(Service);
   */
  static async respond(responder) {
    try {
      const channel = await Broker.connect();
      await channel.assertQueue(RPC_QUEUE, {
        durable: true,
        arguments: {
          "x-queue-type": "quorum",
        },
      });
      channel.prefetch(1);
      channel.consume(
        RPC_QUEUE,
        async (data) => {
          if (data.content) {
            const message = JSON.parse(data.content.toString());
            const response = await responder.respondRPC(message);
            channel.sendToQueue(
              data.properties.replyTo,
              Buffer.from(JSON.stringify(response)),
              {
                correlationId: data.properties.correlationId,
              }
            );
            channel.ack(data);
          }
        },
        { noAck: false }
      );
    } catch (err) {
      console.log("Failed to respond to request");
    }
  }
}

module.exports = RPCService;
