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

// -- recursive metadata map --
const VectorizeVectorMetadata: z.ZodType<
  Record<string, unknown>
> = z.lazy(() =>
  z.record(VectorizeVectorMetadataValue)
);

// -- the base VectorizeVector schema --
const VectorizeVectorSchema = z.object({
  /** The ID for the vector. */
  id: z.string(),

  /** The vector values. */
  values: z.array(z.number()), // or replace with your VectorFloatArray codec

  /** The namespace this vector belongs to. */
  namespace: z.string().optional(),

  /** Metadata associated with the vector. */
  metadata: z.record(VectorizeVectorMetadata).optional(),
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

export const generateEmbeddingsConfig: ToolConfig = {
  id: "generate-embeddings",
  name: "Generate Embeddings",
  description: "Generate embeddings from user profile details",
  input: z.object({
    text: z.string().describe("User profile details in markdown format"),
  }),
  // VectorizeMatch
  output: z.array(VectorizeMatchSchema),
  handler: async ({ text }, agentInfo) => {
    try {
      const response = await axios.post(
        "https://embeddings.ramim66809.workers.dev/",
        { text, email: agentInfo.address },
        { headers: { "Content-Type": "application/json" } }
      );

      const matches = response.data.similarItems;

      const cardUI = new CardUIBuilder()
        .title("Embeddings Generated")
        .content(`Generated ${matches.length} embeddings from the user profile`)
        .build();

      return {
        text: `Successfully generated embeddings for the user profile`,
        data: matches,
        ui: cardUI,
      };
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw new Error("Failed to generate embeddings");
    }
  },
};
