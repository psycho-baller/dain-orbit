import { z } from "zod";
import { defineDAINService, ToolConfig } from "@dainprotocol/service-sdk";
import { CardUIBuilder, DainResponse, TableUIBuilder } from "@dainprotocol/utils";
import fs from 'fs/promises';
import path from "path";
import dotenv from "dotenv";
import { searchUsersConfig } from "./linkd";
import { generateEmbeddingsConfig } from "./cloudflare";
import { findEmailConfig } from "./find-email";
import { phoneCallConfig } from "./call-vapi";
import { initialContext } from "./prompts";

dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

export const VAULT_PATH = process.env.VAULT_PATH || '/Users/rami/Documents/Obsidian';

const readFileConfig: ToolConfig = {
  id: "read-file",
  name: "Read Obsidian File",
  description: "Reads the content of a specified file in your Obsidian vault",
  input: z.object({
    filePath: z.string().describe("Relative path of the file in the Obsidian vault"),
  }),
  output: z.object({
    fileName: z.string().describe("Name of the file"),
    content: z.string().describe("Content of the file"),
  }),
  handler: async ({ filePath }, agentInfo) => {
    try {
      const fullPath = path.join(VAULT_PATH, filePath);

      // Check if the file exists and is within the vault
      if (!fullPath.startsWith(VAULT_PATH)) {
        throw new Error("File path must be within the Obsidian vault");
      }

      await fs.access(fullPath);

      const content = await fs.readFile(fullPath, 'utf8');
      const fileName = path.basename(filePath);

      const cardUI = new CardUIBuilder()
        .title(`File: ${fileName}`)
        .content(content)
        .build();

      return new DainResponse({
        text: `Successfully read file: ${fileName}`,
        data: { fileName, content },
        ui: cardUI
      });
    } catch (error) {
      console.error("Error reading file:", error);
      return new DainResponse({
        text: "An error occurred while reading the file.",
        data: { error: error.message },
        ui: new CardUIBuilder()
          .title("Error")
          .content(`Failed to read file: ${error.message}`)
          .build()
      });
    }
  }
};

const listFilesConfig: ToolConfig = {
  id: "list-files",
  name: "List Obsidian Files",
  description: "Lists all files in your Obsidian vault",
  input: z.object({}),
  output: z.object({
    files: z.array(z.object({
      name: z.string(),
      path: z.string(),
      isDirectory: z.boolean(),
    }))
  }),
  handler: async (_, agentInfo) => {
    try {
      const files = await listFilesRecursively(VAULT_PATH);

      const tableUI = new TableUIBuilder()
        .addColumns([
          { key: "name", header: "File Name", type: "string" },
          { key: "path", header: "Path", type: "string" },
          { key: "type", header: "Type", type: "string" }
        ])
        .rows(files.map(file => ({
          name: file.name,
          path: file.path.replace(VAULT_PATH, ''),
          type: file.isDirectory ? "Directory" : "File"
        })))
        .build();

      const cardUI = new CardUIBuilder()
        .title("Obsidian Vault Files")
        .content(`Total files and directories: ${files.length}`)
        .addChild(tableUI)
        .build();

      return new DainResponse({
        text: `Retrieved ${files.length} files and directories from the Obsidian vault.`,
        data: { files },
        ui: cardUI
      });
    } catch (error) {
      console.error("Error listing files:", error);
      return new DainResponse({
        text: "An error occurred while listing files in the Obsidian vault.",
        data: { error: error.message },
        ui: new CardUIBuilder()
          .title("Error")
          .content(`Failed to list files: ${error.message}`)
          .build()
      });
    }
  }
};

async function listFilesRecursively(dir: string): Promise<Array<{ name: string; path: string; isDirectory: boolean }>> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return [
        { name: entry.name, path: fullPath, isDirectory: true },
        ...(await listFilesRecursively(fullPath))
      ];
    } else {
      return [{ name: entry.name, path: fullPath, isDirectory: false }];
    }
  }));
  return files.flat();
}

const firstMessageConfig: ToolConfig = {
  id: "first-message",
  name: "First Message",
  description: `Hi! Welcome to Orbit. This service is created to help you find the perfect match—whether that's a mentor, mentee, or accountability partner. To get started, I need to learn about your goals and what you're passionate about.

We can jump in a short call and in just a few quick questions, we'll build your profile so we can start building your orbit full of people who can really help you grow, and who you can help too. If you're ready to get started, drop your phone number in the chat!
`,
  input: z.object({}),  // No input required for this tool
  output: z.object({
    message: z.string()
  }),
  handler: async (input, agentInfo) => {
    const welcomeMessage = `Hi! Welcome to Orbit. This service is created to help you find the perfect match—whether that's a mentor, mentee, or accountability partner. To get started, I need to learn about your goals and what you're passionate about.

We can jump in a short call and in just a few quick questions, we'll build your profile so we can start building your orbit full of people who can really help you grow, and who you can help too. If you're ready to get started, drop your phone number in the chat!
`;

    const cardUI = new CardUIBuilder()
      .title("Welcome!")
      .content(welcomeMessage)
      .build();

    return {
      text: welcomeMessage,
      data: { message: welcomeMessage },
      ui: cardUI
    };
  }
};

const dainService = defineDAINService({
  metadata: {
    title: "Orbit Service",
    description: "A service to help you find the perfect match—whether that's a mentor, mentee, or accountability partner.",
    version: "1.0.0",
    author: "Rami Maalouf",
    tags: []
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [listFilesConfig, readFileConfig, searchUsersConfig, generateEmbeddingsConfig, findEmailConfig, phoneCallConfig],
  contexts: [initialContext],
});

dainService.startNode({ port: 2023 }).then(() => {
  console.log("Orbit Service is running on port 2023");
});
