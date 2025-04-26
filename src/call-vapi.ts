import { z } from "zod";
import {
  defineDAINService,
  ToolConfig,
  ServiceContext
} from "@dainprotocol/service-sdk";
import { CardUIBuilder, AlertUIBuilder } from "@dainprotocol/utils";

import axios from 'axios';

async function makePhoneCall(phoneNumber: string, message: string): Promise<string> {
  const VAPI_API_KEY = process.env.VAPI_API_KEY; // Ensure this is set in your environment variables
  const ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID; // Your assistant ID
  const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID; // Your Vapi-provided phone number ID

  if (!VAPI_API_KEY || !ASSISTANT_ID || !PHONE_NUMBER_ID) {
    throw new Error('Missing Vapi configuration in environment variables.');
  }

  const url = 'https://api.vapi.ai/call';

  const payload = {
    assistantId: ASSISTANT_ID,
    // phoneNumberId: PHONE_NUMBER_ID,
    customer: {
      number: phoneNumber
    },
    assistant: {
      firstMessage: message
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const callId = response.data.id;
    return `Call initiated successfully. Call ID: ${callId}`;
  } catch (error) {
    console.error('Error initiating call:', error);
    throw new Error('Failed to initiate call.');
  }
}

export const phoneCallConfig: ToolConfig = {
  id: "make-phone-call",
  name: "Make Phone Call",
  description: "Initiate a phone call to a specified number with a message",
  input: z.object({
    phoneNumber: z.string().describe("The phone number to call"),
    message: z.string().describe("The message to deliver during the call")
  }),
  output: z.object({
    result: z.string().describe("The result of the phone call")
  }),
  handler: async ({ phoneNumber, message }, agentInfo, { app }) => {
    // Create a background process
    const processId = await app.processes!.createProcess(
      agentInfo,
      "one-time",
      "Phone Call",
      `Calling ${phoneNumber}`
    );

    // Start the call in the background
    (async () => {
      try {
        await app.processes!.addUpdate(processId, {
          percentage: 25,
          text: "Initiating call..."
        });

        const result = await makePhoneCall(phoneNumber, message);

        await app.processes!.addUpdate(processId, {
          percentage: 75,
          text: "Call completed, processing result..."
        });

        // Add the final result
        await app.processes!.addResult(processId, {
          text: "Call completed successfully",
          data: { result },
          ui: new CardUIBuilder()
            .title("Call Result")
            .content(result)
            .build()
        });
      } catch (error) {
        await app.processes!.failProcess(processId, error.message);
      }
    })();

    // Return immediately with process viewer
    return {
      text: "Phone call initiated",
      data: { processId },
      ui: { type: "processViewer", props: { processId } }
    };
  }
};