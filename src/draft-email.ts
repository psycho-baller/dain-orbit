import { ToolConfig } from "@dainprotocol/service-sdk";
import { DainResponse, FormUIBuilder } from "@dainprotocol/utils";
import z from "zod";

export const draftEmailConfig: ToolConfig = {
  id: "draft-email",
  name: "Draft Email",
  description: "Generate a draft email for a potential connection.",
  input: z.object({
    recipientEmail: z.string().describe("Email address of the recipient"),
  }),
  output: z.object({
    subject: z.string(),
    body: z.string(),
  }),
  handler: async ({ recipientEmail }) => {
    // Here you would typically call an AI service to generate the email draft
    // For this example, we'll use a simple template
    const subject = "Let's connect!";
    const body = `Dear ${recipientEmail},

I hope this email finds you well. I came across your profile and noticed we have some shared interests. I'd love to connect and learn more about your experiences.

Looking forward to hearing from you!

Best regards,
[Your Name]`;

    const formUI = new FormUIBuilder()
      .title("Draft Email")
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
        tool: "send-email", // You would need to create this tool to actually send the email
        paramSchema: {
          recipientEmail: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" },
        },
      })
      .build();

    return new DainResponse({
      text: `Generated draft email for ${recipientEmail}`,
      data: { subject, body },
      ui: formUI,
    });
  },
};
