import { VapiClient } from "@vapi-ai/server-sdk";
import { z } from "zod";
import { ToolConfig } from "@dainprotocol/service-sdk";
import { CardUIBuilder, DainResponse } from "@dainprotocol/utils";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });
async function makePhoneCall(phoneNumber: string, message: string): Promise<string> {
  const VAPI_API_KEY = process.env.VAPI_API_KEY;    // Your Vapi API key
  const ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;    // Your persistent assistant ID
  const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;    // Your phone number ID

  if (!VAPI_API_KEY || !ASSISTANT_ID || !VAPI_PHONE_NUMBER_ID) {
    console.error('Missing Vapi configuration in environment variables.');
    throw new Error('Missing Vapi configuration in environment variables.');
  }

  // Initialize the Vapi server client
  const client = new VapiClient({ token: VAPI_API_KEY });
  console.log("Vapi client initialized", client);

  try {
    // Start an outbound phone call with the assistant
    const response = await client.calls.create({
      assistantId: ASSISTANT_ID,
      customer: { number: phoneNumber },
      phoneNumberId: VAPI_PHONE_NUMBER_ID,
      // firstMessage: message,
      // firstMessageMode: "assistant-speaks-first"
    });

    return `Call initiated successfully. Call ID: ${response}`;
  } catch (error: any) {
    console.error('Error initiating call via Server SDK:', error);
    throw new Error('Failed to initiate call.');
  }
}

export const phoneCallConfig: ToolConfig = {
  id: "call-vapi",
  name: "Call Vapi",
  description: "Initiate a phone call to a specified number given by the user. The call will be handled by Vapi and will be completed automatically.",
  input: z.object({
    phoneNumber: z.string().describe("The phone number to call"),
  }),
  output: z.object({
    text: z.string().describe("Response message to display").optional(),
    data: z.object({
      processId: z.string().describe("ID of the background process")
    }).describe("Process metadata").optional(),
    processes: z.array(z.string()).describe("List of background processes").optional(),
    ui: z.object({
      type: z.literal("processViewer").describe("UI component type"),
      props: z.object({
        processId: z.string().describe("ID of the background process for UI")
      }).describe("UI component properties")
    }).describe("UI specification for process viewer").optional(),
  }),
  handler: async ({ phoneNumber }, agentInfo, { app }) => {
    // Create a background process
    console.log("Creating background process...");
    const processId = await app.processes.createProcess(
      agentInfo,
      "one-time",
      "Phone Call",
      `Calling ${phoneNumber}`
    );
    console.log("Background process created with ID:", processId);

    // Start the call in the background
    (async () => {
      try {
        await app.processes.addUpdate(processId, {
          percentage: 25,
          text: "Initiating call..."
        });
        console.log("Initiating call...");
        const result = await makePhoneCall(phoneNumber, "Hey, I'm Jamie. Your AI friend. Let's get straight into it. Tell me about yourself. What do you enjoy working on? What are you working on right now? What area of your life are you looking to improve?");
        console.log("Call completed, processing result...", result);
        await app.processes.addUpdate(processId, {
          percentage: 75,
          text: "Call completed, processing result... " + result
        });

        // Add the final result
        await app.processes.addResult(processId, {
          text: "Call completed successfully",
          data: { result },
          ui: new CardUIBuilder()
            .title("Call Result")
            .content(result)
            .build()
        });
      } catch (error) {
        await app.processes!.failProcess(processId, error.message);
        console.error("Error making phone call:", error);
      }
    })();
    console.log("Phone call initiated");

    // Return immediately with process viewer
    return new DainResponse({
      text: "Phone call initiated",
      data: { processId },
      processes: [processId],
      // @ts-ignore
      ui: { type: "processViewer", props: { processId } },
    });
  }
};