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
			if (typeof body !== 'object' || body === null || typeof (body as any).text !== 'string') {
				return new Response("Missing or invalid 'text' in body", { status: 400 });
			}
			const text = (body as { text: string }).text;

			// 1. Generate embedding for the input text
			const modelResp: EmbeddingResponse = await env.AI.run(
				'@cf/baai/bge-base-en-v1.5',
				{ text }
			);

			const newEmbedding = modelResp.data[0]; // Assuming it's like [{ embedding: [...] }]

			// 2. Add the embedding to the vector DB
			// const id = crypto.randomUUID(); // or any unique ID
			// await env.VECTORIZE.upsert([
			// 	{
			// 		id,
			// 		values: newEmbedding,
			// 		metadata: { text },
			// 	},
			// ]);
			// Convert the vector embeddings into a format Vectorize can accept.
			// Each vector needs an ID, a value (the vector) and optional metadata.
			// In a real application, your ID would be bound to the ID of the source
			// document.
			let vectors: VectorizeVector[] = [];
			let id = 1;
			modelResp.data.forEach((vector) => {
				vectors.push({ id: `${id}`, values: vector });
				id++;
			});

			const inserted = await env.VECTORIZE.upsert(vectors);
			// return Response.json(inserted);
			// 3. Search for 10 most similar items (excluding the one just added)
			const searchResults = await env.VECTORIZE.query(newEmbedding, {
				topK: 10,
				returnMetadata: true,
			});

			return Response.json({
				success: true,
				similarItems: searchResults.matches || [],
				newEmbedding,
			});

		} catch (err) {
			console.error("Error processing request:", err);
			return new Response("Internal Server Error", { status: 500 });
		}
	}
} satisfies ExportedHandler<Env>;
