import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import fs from "fs/promises";
import path from "path";
import { Chroma } from "@langchain/community/vectorstores/chroma";

const VAULT_PATH = process.env.VAULT_PATH || '/Users/rami/Documents/Obsidian';


/**
 * Load all markdown notes from your vault folder.
 * Adjust the file extension filter if necessary.
 */
export async function loadVaultNotes(vaultPath: string): Promise<Document[]> {
    const docs: Document[] = [];
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 4000,
        chunkOverlap: 200,
    });

    const constraints = (filePath: string) => {
        const parts = filePath.split(path.sep);
        return parts.some(part => part.startsWith(".") || part.startsWith("_") || part.startsWith("My Calendar") || part.startsWith("Hidden") || part.startsWith("Essays") || part.startsWith("USV"));
    };

    const selectedDirs = new Set<string>(["My Greenhouse", "My Thoughts"]);

    // Function to remove YAML frontmatter from markdown content
    const removeYAMLFrontmatter = (content: string): string => {
        const lines = content.split('\n');
        if (lines[0]?.trim() === '---') {
            const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
            if (closingIndex !== -1) {
                // Return content after the closing '---', skipping an extra newline
                return lines.slice(closingIndex + 1).join('\n').trim();
            }
        }
        return content;
    };

    const visit = async (dirPath: string) => {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = await fs.stat(filePath);
            if (stat.isDirectory() && selectedDirs.has(file)) {
                console.log("filePath:", filePath);
                await visit(filePath);
            } else if (file.endsWith(".md")) {
                let content = await fs.readFile(filePath, "utf8");

                // Remove YAML frontmatter if it exists
                content = removeYAMLFrontmatter(content);

                // Only process if there's content after removing frontmatter
                if (content.trim()) {
                    // Split the content into smaller chunks
                    const chunks = await splitter.createDocuments([content]);
                    // Add metadata to each chunk
                    chunks.forEach((chunk, index) => {
                        chunk.metadata = {
                            fileName: file,
                            chunkIndex: index,
                            totalChunks: chunks.length
                        };
                    });
                    docs.push(...chunks);
                }
            }
        }
    }
    await visit(vaultPath);
    return docs;
}

/**
 * Create a vector store for your vault notes.
 * This function computes embeddings (using OpenAIEmbeddings in this example)
 * for each note and stores them in an in-memory vector store.
 */
export async function createVectorStore(vaultPath: string): Promise<Chroma> {
    console.log("Creating vector store...", vaultPath);
    const docs = await loadVaultNotes(vaultPath);
    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
        apiKey: process.env.OPENAI_API_KEY
    });

    const collectionName = "rami-journal-embeddings";
    const vectorStore = new Chroma(embeddings, {
        collectionName,
        url: "http://localhost:8000"
    });

    // Ensure collection exists and get its content
    let existingDocs;
    try {
        // First, ensure the collection exists
        await vectorStore.ensureCollection();

        // Then get the collection's content
        const collection = vectorStore.collection;
        if (collection) {
            existingDocs = await collection.get();
            console.log("Existing collection size:", existingDocs?.ids?.length || 0);
        }
    } catch (error) {
        console.error("Error accessing collection:", error);
        existingDocs = { ids: [] };
    }

    // Create a Set of existing file names
    const existingFileNames = new Set(existingDocs?.ids?.map((id: string) => {
        console.log("Document ID:", id);
        try {
            return id.split('_')[0];
        } catch {
            return id;
        }
    }) || []);

    // Filter out documents that are already in the store
    const newDocs = docs.filter(doc => !existingFileNames.has(doc.metadata.fileName));

    if (newDocs.length > 0) {
        console.log(`Adding ${newDocs.length} new documents to vector store...`);
        await vectorStore.addDocuments(newDocs, {
            ids: newDocs.map(doc => `${doc.metadata.fileName}_${doc.metadata.chunkIndex}`)
        });
    } else {
        console.log("No new documents to add to vector store.");
    }

    return vectorStore;
}

/**
 * Save the vector store to a JSON file locally.
 * (This is a simple approach; for larger datasets, consider a dedicated vector DB.)
 */
export async function saveVectorStore(vectorStore: Chroma, savePath: string): Promise<void> {
    const storeData = vectorStore.embeddings;
    await fs.writeFile(savePath, JSON.stringify(storeData, null, 2), "utf8");
}

/**
 * Given a query text, find the most similar notes in the vector store.
 */
export async function findSimilarNotes(
    vectorStore: Chroma,
    queryText: string,
    topK: number = 20
) {
    const results = await vectorStore.similaritySearchWithScore(queryText, topK);
    return results;
}

// // Example usage:
(async () => {
    // Check if a stored vector store exists; if so, load it. Otherwise, create it.
    let vectorStore: Chroma;
    // try {
    //     await fs.access(vectorStoreFile);
    //     console.log("Loading existing vector store from disk...");
    //     vectorStore = await loadVectorStore(vectorStoreFile);
    // } catch (e) {
    //     console.log("Creating new vector store...");
    vectorStore = await createVectorStore(VAULT_PATH);
    // await saveVectorStore(vectorStore, vectorStoreFile);
    // }

    // Now, given some query content (for your current note), find similar notes.
    const queryText = `- Finding your life partner is one of the most important parts of anyone's life.
	- just as important as what university you go to or don't go to
	- or what profession you decide to pursue
	- or where you're born
- The thing is, we have full autonomy on who we decide to pick but unfortunately men are too scared to approach and talk to the [[Women]] around them
- For that reason, they never figure out the kind of woman that matches well with them.
	- this knowledge can't be claimed from any book. It can only be found from experience

# The internal conflict
- In my religion, talking and having [[Relationships]] with women who is not your wife is prohibited
- so as someone who believes in [[Islam]], I can't be advocating for people to approach women
- in addition to that, so many of these YouTubers/influencers give off that vibe that they are "using" women. Flexing that he can pick up any women he wants
	- I don't wanna be that kinda guy

# So what should I do?
- there must be other ways I can achieve that:
	- educating
	- showing the perspective of women that a lot of men are not aware of or don't consider
		- conducting interviews with women
`;
    const similarNotes = await findSimilarNotes(vectorStore, queryText);
    console.log("Found", similarNotes.length, "similar notes:");
    const seenDocs = new Set<string>();


    similarNotes.forEach(([doc, score]) => {
        const key = `${doc.metadata.fileName}-${doc.pageContent.substring(0, 50)}`;
        if (!seenDocs.has(key)) {
            seenDocs.add(key);
            console.log(`\n[Score: ${(score * 100).toFixed(2)}%] ${doc.metadata.fileName}:`);
            console.log(`${doc.pageContent.substring(0, 50)}...`);
        }
    });
})();