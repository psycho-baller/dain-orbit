/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
export interface Env {
	VECTORIZE: Vectorize;
	AI: Ai;
}
interface EmbeddingResponse {
	shape: number[];
	data: number[][];
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		let path = new URL(request.url).pathname;
		if (path.startsWith("/favicon")) {
			return new Response("", { status: 404 });
		}
		if (request.method !== "POST") {
			return new Response("Only POST method allowed", { status: 405 });
		}

		try {
			const body = await request.json();
			if (typeof body !== 'object' || body === null || typeof (body as any).text !== 'string' || typeof (body as any).email !== 'string') {
				return new Response("Missing or invalid 'text' or 'email' in body", { status: 400 });
			}
			const { text, email } = body as { text: string; email: string };

			// 1. Generate embedding for the input text
			const modelResp: EmbeddingResponse = await env.AI.run(
				'@cf/baai/bge-base-en-v1.5',
				{ text }
			);

			const newEmbedding = modelResp.data[0]; // Assuming it's like [{ embedding: [...] }]


			// 1. Get the current number of vectors in the database
			const allVectors = (await env.VECTORIZE); // or .count() if available
			const initialId = (await allVectors.describe()).vectorCount; // or .count if that's available

			// 2. Assign incremental IDs
			let idCounter = initialId;
			let vectors: VectorizeVector[] = [];
			modelResp.data.forEach((vector) => {
				vectors.push({
					id: idCounter.toString(),
					values: vector,
					metadata: { text, email },
				});
				idCounter++;
			});
			console.log("Inserted vector IDs:", vectors.map(v => v.id));

			const inserted = await env.VECTORIZE.upsert(vectors);
			console.log("Inserted vector IDs:", inserted.mutationId);
			// return Response.json(inserted);
			// 3. Search for 10 most similar items (excluding the one just added)
			const searchResults = await env.VECTORIZE.query(newEmbedding, {
				topK: 10,
				returnMetadata: true,
			});

			return Response.json({
				success: true,
				newEmbedding,
				similarItems: (searchResults.matches || []).map(match => ({
					id: match.id,
					score: match.score,
					metadata: match.metadata || {}
				})),
			});
		} catch (err) {
			console.error("Error processing request:", err);
			return new Response("Internal Server Error", { status: 500 });
		}
	}
} satisfies ExportedHandler<Env>;
