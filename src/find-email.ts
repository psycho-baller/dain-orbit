import { z } from "zod";
import { ToolConfig } from "@dainprotocol/service-sdk";
import { CardUIBuilder } from "@dainprotocol/utils";
import { findEmail } from "./utils";

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
    const email = findEmail();

    const cardUI = new CardUIBuilder()
      .title("Email Found")
      .content(`Selected email for ${username}: ${email}`)
      .build();

    return {
      text: `Email found for ${username}: ${email}`,
      data: { email },
      ui: cardUI,
    };
  },
};