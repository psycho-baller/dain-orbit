import { z } from "zod";
import axios from "axios";
import {
  ToolConfig,
} from "@dainprotocol/service-sdk";
import { CardUIBuilder } from "@dainprotocol/utils";

// -- primitive metadata value --
const VectorizeVectorMetadataValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
]);

// -- metadata map --
const VectorizeVectorMetadata = z.record(VectorizeVectorMetadataValue);

// -- the base VectorizeVector schema --
const VectorizeVectorSchema = z.object({
  /** The ID for the vector. */
  id: z.string(),

  /** The vector values. */
  values: z.array(z.number()), // or replace with your VectorFloatArray codec

  /** The namespace this vector belongs to. */
  namespace: z.string().optional(),

  /** Metadata associated with the vector. */
  metadata: VectorizeVectorMetadata.optional(),
});

// -- build VectorizeMatch by omitting `values`, re-adding it as optional, and adding `score` --
const VectorizeMatchSchema = z
  .object({
    score: z.number(),
  })
  // start with all fields except `values`
  .merge(VectorizeVectorSchema.omit({ values: true }))
  // then add `values` back as optional
  .extend({
    values: VectorizeVectorSchema.shape.values.optional(),
  });

// Type derived from the Zod schema for a match result
export type VectorizeMatch = z.infer<typeof VectorizeMatchSchema>;

export const generateEmbeddingsConfig: ToolConfig = {
  id: "generate-embeddings",
  name: "Generate Embeddings",
  description: "Generate embeddings from user profile details after generating the profile based on the call. Invoke this tool after we have created the user's profile.",
  input: z.object({
    text: z.string().describe("User profile details in markdown format"),
    email: z.string().describe("The current user's email address"),
  }),
  // VectorizeMatch
  output: z.array(VectorizeMatchSchema),
  handler: async ({ text, email }) => {
    try {
      const response = await axios.post(
        "https://embeddings.ramim66809.workers.dev/",
        { text, email },
        { headers: { "Content-Type": "application/json" } }
      );

      const matches = response.data.similarItems as VectorizeMatch[];
      console.log("matches", matches);

      const cardUI = new CardUIBuilder()
        .title("Embeddings Generated")
        .content(`Found ${matches.length} users that might match well with you. Here are the details:
          ${matches
            .map(
              (match) =>
                `Email: ${match.metadata?.email} Score: ${match.score}`
            )
            .join("\n")}`)
        .build();

      return {
        text: `Successfully generated embeddings for the user profile`,
        data: matches,
        ui: cardUI,
      } as { text: string; data: VectorizeMatch[]; ui: unknown }
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw new Error("Failed to generate embeddings");
    }
  },
};
