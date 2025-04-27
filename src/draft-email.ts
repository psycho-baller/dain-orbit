import { ToolConfig } from "@dainprotocol/service-sdk";
import { DainResponse, FormUIBuilder } from "@dainprotocol/utils";
import z from "zod";

// Simulated AI function (replace with actual AI service call)
async function generateAIEmail(senderEmail: string, recipientEmail: string) {
  // In a real scenario, this would be an API call to an AI service
  const subject = `Introducing two amazing professionals: ${senderEmail} meet ${recipientEmail}`;
  const body = `Dear ${senderEmail} and ${recipientEmail},

I hope this email finds you both well. As someone who knows you both, I thought it would be great to introduce you to each other.

${senderEmail.split('@')[0]}, meet ${recipientEmail.split('@')[0]}. You both have impressive backgrounds in technology and I believe you could benefit from knowing each other. ${recipientEmail.split('@')[0]} has been doing groundbreaking work in AI, while ${senderEmail.split('@')[0]} has been innovating in the field of blockchain.

${recipientEmail.split('@')[0]}, ${senderEmail.split('@')[0]} is not only a talented professional but also a great person to brainstorm with. I think you'll find their insights on emerging tech trends particularly valuable.

I'll leave it to you both to take it from here. Perhaps you could set up a virtual coffee chat to explore potential collaborations or simply exchange ideas.

Best regards,
Your AI Matchmaker`;

  return { subject, body };
}

export const draftEmailConfig: ToolConfig = {
  id: "draft-email",
  name: "Draft Email",
  description: "Generate a draft email for a warm introduction between two professionals when the user asks to create a new mail",
  input: z.object({
    recipientEmail: z.string().describe("Email address of the recipient"),
    senderEmail: z.string().describe("Email address of the sender"),
  }),
  output: z.object({
    subject: z.string(),
    body: z.string(),
  }),
  handler: async ({ recipientEmail, senderEmail }) => {
    try {
      // Generate email content using AI
      const { subject, body } = await generateAIEmail(senderEmail, recipientEmail);

      const formUI = new FormUIBuilder()
        .title("AI-Generated Introduction Email")
        .addField({
          name: "subject",
          label: "Subject",
          type: "string",
          widget: "text",
          defaultValue: subject,
        })
        .addField({
          name: "body",
          label: "Email Body",
          type: "string",
          widget: "textarea",
          defaultValue: body,
        })
        .onSubmit({
          tool: "send-gmail", // You would need to create this tool to actually send the email
          paramSchema: {
            recipientEmail: { type: "string" },
            senderEmail: { type: "string" },
            subject: { type: "string" },
            body: { type: "string" },
          },
          params: {
            recipientEmail,
            senderEmail,
            subject,
            body,
          },
          type: "callTool",
          key: "send-gmail",
          shouldCallLLMAfterTool: true
        })
        .build();

      return new DainResponse({
        text: `Generated warm introduction email for ${senderEmail} and ${recipientEmail}`,
        data: { subject, body },
        ui: formUI,
      });
    } catch (error) {
      console.error("Error generating email:", error);
      throw new Error("Failed to generate email");
    }
  },
};
