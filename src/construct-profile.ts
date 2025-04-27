import { z } from "zod";
import { defineDAINService, ToolConfig } from "@dainprotocol/service-sdk";
import { CardUIBuilder } from "@dainprotocol/utils";

export const generateDetailedProfileConfig: ToolConfig = {
  id: "generate-detailed-profile",
  name: "Generate Detailed User Profile",
  description: "Generates a detailed markdown profile based on user input after the call with the user",
  input: z.object({
    name: z.string().describe("User's full name"),
    background: z.string().min(200).describe("Detailed background information about the user (at least 200 characters)"),
    interests: z.string().min(200).describe("User's detailed interests and current projects (at least 200 characters)"),
    strengths: z.string().min(200).describe("User's detailed strengths and how they can help others (at least 200 characters)"),
    weaknesses: z.string().min(200).describe("User's detailed areas for improvement and what help they need (at least 200 characters)")
  }),
  output: z.object({
    profile: z.string().describe("Generated detailed markdown profile")
  }),
  handler: async ({ name, background, interests, strengths, weaknesses }, agentInfo) => {
    const profile = `
# ${name}'s Detailed Profile

## Who am I
${background}

## What I enjoy working on & what I'm working on right now
${interests}

## What are my strengths that I'd love to help people with
${strengths}

## What are my weaknesses that I need help with
${weaknesses}
    `.trim();

    return {
      text: "Generated detailed user profile",
      data: { profile },
      ui: new CardUIBuilder()
        .title("Detailed User Profile")
        .content(profile)
        .build()
    };
  }
};