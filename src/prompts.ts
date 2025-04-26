import type { ServiceContext } from "@dainprotocol/service-sdk";

export const initialContext: ServiceContext = {
  id: "initialContext",
  name: "Initial Context",
  description: "Initial context for the service",
  getContextData: async (agentInfo) => {
    return `
    ${agentInfo.address}
    `
  }
};

export const phoneCallContext: ServiceContext = {
  id: "phoneCallContext",
  name: "Phone Call Context",
  description: "Provides context about the phone call service",
  getContextData: async (agentInfo) => {
    return `
You are interacting with a service that makes phone calls.
This service takes a phone number and a message as input.

Key points to remember:
1. The phone number should be in a valid format (e.g., +1234567890).
2. The message should be clear and concise.
3. The call may take some time to complete, so be patient.

To use this service, you can say something like:
"Make a phone call to +1234567890 with the message 'Hello, this is a test call'"

Always confirm the phone number and message with the user before initiating the call.
    `.trim();
  }
};
