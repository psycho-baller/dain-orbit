import { z } from "zod";
import { ToolConfig } from "@dainprotocol/service-sdk";
import { CardUIBuilder } from "@dainprotocol/utils";

export const findEmailConfig: ToolConfig = {
  id: "find-email",
  name: "Find Email",
  description: "Finds the email address of a user from their linkedin username",
  input: z.object({
    username: z.string().describe("Username to search for"),
  }),
  output: z.object({
    email: z.string().describe("Email address of the user"),
  }),
  handler: async ({ username }, agentInfo) => {
    const url = 'https://magicloops.dev/api/loop/a436e267-305e-4cd6-8594-85406f8fe090/run';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseJson = await response.json();

      const cardUI = new CardUIBuilder()
        .title("Magic Loops API Response")
        .content(JSON.stringify(responseJson, null, 2))
        .build();

      return {
        text: "Successfully called Magic Loops API",
        data: { email: responseJson.email },
        ui: cardUI,
      };
    } catch (error) {
      console.error("Error calling Magic Loops API:", error);

      const errorCardUI = new CardUIBuilder()
        .title("Error")
        .content(`Failed to call Magic Loops API: ${error.message}`)
        .build();

      return {
        text: "Error occurred while calling Magic Loops API",
        data: { response: null },
        ui: errorCardUI,
      };
    }
  },
};