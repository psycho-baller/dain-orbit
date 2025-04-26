import path from "path";
import { VAULT_PATH } from "./old-index";
import fs from 'fs/promises';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { Temporal } from "@js-temporal/polyfill";
import { createVectorStore, findSimilarNotes, loadVaultNotes, saveVectorStore } from "./embeddings";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Chroma } from "@langchain/community/vectorstores/chroma";

// Function to search for related notes
export async function searchRelatedNotes(content: string, excludeTitle: string): Promise<string[]> {
  const vaultNotes = loadVaultNotes(VAULT_PATH);
  const vaultPath = "/Users/rami/Documents/Obsidian"; // adjust this to your vault's location
  const vectorStoreFile = path.join(vaultPath, "vectorStore.json");

  // Check if a stored vector store exists; if so, load it. Otherwise, create it.
  return [] // similarNotes.map(doc => doc.metadata.fileName);
  let vectorStore: Chroma;
  // try {
  //   await fs.access(vectorStoreFile);
  //   console.log("Loading existing vector store from disk...");
  //   vectorStore = await loadVectorStore(vectorStoreFile);
  // } catch (e) {
  //   console.log("Creating new vector store...");
  vectorStore = await createVectorStore(vaultPath);
  //   await saveVectorStore(vectorStore, vectorStoreFile);
  // }

  // Now, given some query content (for your current note), find similar notes.
  const similarNotes = await findSimilarNotes(vectorStore, content, 5);

  console.log("Top similar notes:");
  similarNotes.forEach(doc => {
    console.log(`- ${doc[0].metadata.fileName}: ${doc[0].pageContent.substring(0, 100)}...`);
  });

  // if it's a title with YYYY-MM-DD, skip all the notes that are in the same folder

}

// Add this constant with your structuring instructions
const STRUCTURING_INSTRUCTIONS = `
Your goal is to take this transcript, which might contain transcription inaccuracies, and correct these transcription-induced errors to the best of your abilities while following these guidelines:
1. Fix common typographical errors, including but not limited to spelling mistakes, misuse of punctuation, incomplete sentences, and improper capitalization.
2. Use context and common sense to correct errors
3. Only fix clear errors, don't alter the content unnecessarily
4. I sometimes say something twice so that I make sure the speech-to-text accurately transcribes what I am trying to say. So just be aware of that fact and emit the things that seem to be repeated after each other
5. Ignore the speaker numbers and timestamps.  For example: 'Speaker 2 03:57' or 'Speaker 1 01:15'
6. Maintain a similar writing style as the way I speak, which is first person, and
7. Group my transcript into different headings, each one tackling a different topic

+++ TRANSCRIPT
{raw_transcript}


+++ CLEANED TRANSCRIPT
`;

// Function to structure raw content
export async function structureContent(rawContent: string): Promise<{ title: string; content: string; tags: string[] }> {
  const prompt = ChatPromptTemplate.fromTemplate(STRUCTURING_INSTRUCTIONS);
  const llm = new ChatOpenAI();
  const chain = prompt.pipe(llm);

  const response = await chain.invoke({ raw_transcript: rawContent });

  const title = "Structured Thoughts";
  const tags = ["structured", "thoughts"];

  return { title, content: response.content.toString(), tags };
}

const DAILY_NOTE_STRUCTURING_INSTRUCTIONS = `
You are a reflection expert and my personal wise advisor who has extensive knowledge in reading my thoughts and reflections. Your one and only goal is to go through 3 consecutive steps/pipelines that helps you fulfill your role as a reflection expert and my personal wise advisor.

Step 1:
Every day, I will be giving you a transcript of my daily reflection where I go through how my day went and share any key memorable moments, what I learned, and improvements for tomorrow. Your goal for this step is to take transcript, which might contain transcription inaccuracies, and correct these transcription-induced errors to the best of your abilities while following these guidelines:
1. Fix common typographical errors, including but not limited to spelling mistakes, misuse of punctuation, incomplete sentences, and improper capitalization.
2. Use context and common sense to correct errors
3. Only fix clear errors, don't alter the content unnecessarily
4. Maintain a similar writing style as the way I speak, which is first person, and
5. Group my transcript into different headings, each one tackling a different topic

Step 2:
After cleaning and polishing the transcript, please take some time to deeply reflect and analyze that transcript.
You goal for step 2 is to take this cleaned transcript and populate my daily journal markdown file that you can take a look at here

+++ START OF DAILY JOURNAL MARKDOWN FILE

{md_file}

+++ END OF DAILY JOURNAL MARKDOWN FILE

As you can see, the markdown file contains several inputs in the data and several questions within the file content. To help achieve the ultimate goal for step 2 fully and correctly. We will split step 2 into several tasks
- Task 1:
	- One of the headers that you will find is one called "Cleaned Transcript". In there, please place the cleaned transcript that you wrote during step one.
- Task 2:
	- After you ensure you are fully done with task 1, please leverage that cleaned transcript to populate the rest of the file.
	- Start with populating the metadata keys like "Summary" with a summarized version of the cleaned transcript. Then populate all keys that lie under "Summary" with a number between 0 and 10, based on the information that I shared in the raw transcript where I mentioned a certain number for each key in the metadata. So for example, I might  say something like "thanks to my good sleep I felt so energetic so I would give myself an eight on energy". This means that for the key called "Energy", you would fill it with an "8". Do the same thing for all the metadata fields that lie under "Summary". For "Rating", which is just my overall score for the day, I might say something like "overall, I would say today was a five", so that means you will need to populate the "Rating" with "5". I will most likely share a number for each of the rating metadata but if none was mentioned in the transcript, please leave that metadata key empty. All these metadatas under "Summary" should be filled with a number, anything else would break the markdown file.
	- After filling out all the metadata, the next step would be filling out the headers and questions that are in my markdown file template
		- for example, one of the headers in the template is "Improvements". What you need to do for this is deeply reflect on the cleaned transcript and look for things that I mentioned throughout the transcript where I signify that I would like to get better at something. To also fulfill you're role as my wise advisor, please place a few of your own advice for improvements that you would recommend based on your analysis of my transcript. Ensure the advice and suggestions for improvements are practical, personalized, and connected to a deeper reason/motivation.
Alright let's begin!

+++ START OF TRANSCRIPT TO USE FOR STEP 1

{raw_transcript}

+++ END OF TRANSCRIPT TO USE FOR STEP 1

Please feel free to write your thoughts out as you go through the different steps, but when it's time for you to rewrite the markdown file, I need you to give me the ABSOLUTELY COMPLETE revised markdown without ANY new headers and without adding or removing any metadata
`;

/**
 * Uses an LLM-based prompt chain to structure and clean a raw transcript.
 * The returned JSON object should contain:
 * - title: A concise title based on the transcript.
 * - content: The cleaned transcript organized under headings.
 * - tags: A list of relevant tags.
 */
export async function structureDailyNote(dailyNote: string, rawContent: string): Promise<string> {
  // Create the prompt using the template and insert the raw transcript.
  const prompt = ChatPromptTemplate.fromTemplate(DAILY_NOTE_STRUCTURING_INSTRUCTIONS);
  // Initialize the LLM (set temperature to 0 for more deterministic output).
  const llm = new ChatOpenAI({ temperature: 0, model: 'gpt-4o' });
  // Pipe the prompt to the LLM to form a chain.
  const chain = prompt.pipe(llm);
  // Invoke the chain with the raw transcript.
  console.log("Invoking chain...", dailyNote, rawContent);
  try {
    const response = await chain.invoke({ md_file: dailyNote, raw_transcript: rawContent });
    // Validate that required keys exist.
    if (typeof response.content !== "string") {
      throw new Error("Invalid structure in LLM output");
    }
    return response.content.toString();
  } catch (error) {
    throw new Error("Failed to parse structured content: " + error);
  }
}
function formatDateYYYYMMDD(date: Temporal.PlainDate): string {
  const year = date.year.toString().padStart(4, '0');
  const month = date.month.toString().padStart(2, '0');
  const day = date.day.toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Format the date
export async function getTodayNoteFilePath(): Promise<string> {
  const today = Temporal.Now.plainDateISO();
  const formattedDate = formatDateYYYYMMDD(today);
  console.log("today", today);
  return path.join(VAULT_PATH, `/My Calendar/My Daily Notes/${formattedDate}.md`);
}
export async function createDailyNoteViaURI(): Promise<void> {
  // const vaultName = path.basename(VAULT_PATH);
  const obsidianUri = `obsidian://actions-uri/daily-note/create?vault=66ed71cffdfb0ad4`;
  const openModule = await import("open");
  const open = openModule.default;
  await open(obsidianUri);
  await new Promise(resolve => setTimeout(resolve, 1000));
}

/**
 * Extracts markdown content inside a triple backtick block labeled as "markdown".
 * Returns null if no such block is found.
 */
export function extractMarkdownContent(input: string): string | null {
  const regex = /```markdown\s*([\s\S]*?)\s*```/;
  const match = input.match(regex);
  return match ? match[1].trim() : null;
}