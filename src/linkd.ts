import { z } from "zod";
import axios from "axios";
import {
  defineDAINService,
  ToolConfig,
} from "@dainprotocol/service-sdk";
import { CardUIBuilder, TableUIBuilder } from "@dainprotocol/utils";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

const API_BASE_URL = 'https://search.linkd.inc/api';

export const searchUsersConfig: ToolConfig = {
  id: "search-users",
  name: "Search Users",
  description: "Search for users based on query and optional school filter. We should provide it with a detailed description of who we are looking for. This will then return a list of users matching the query. Invoke this tool after we have ended our phone call with the assistant.",
  input: z.object({
    query: z.string().describe("detailed search query"),
    limit: z.number().optional().describe("Number of results to return"),
    school: z.array(z.string()).optional().describe("List of schools to filter by"),
  }),
  output: z.object({
    users: z.array(z.object({
      id: z.string(),
      name: z.string(),
      location: z.string(),
      headline: z.string(),
      description: z.string(),
      title: z.string(),
      profilePictureUrl: z.string(),
      linkedinProfile: z.string(),
      experience: z.array(z.unknown()),
      education: z.array(z.unknown()),
    })),
  }),
  handler: async ({ query, limit = 10, school }, agentInfo) => {
    try {
      const queryParams = new URLSearchParams({ query });
      if (limit) queryParams.append('limit', limit.toString());
      if (school) school.forEach(s => queryParams.append('school', s));

      console.log(`Query parameters: ${process.env.LINKD_API_KEY}`);
      const response = await axios.get(`${API_BASE_URL}/search/users?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${process.env.LINKD_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const rawUsers = response.data.results;
      /*
      "results": [
    {
      "profile": {
        "id": "example_user_id",
        "name": "Example User",
        "location": "Example Location",
        "headline": "Example Headline",
        "description": "Example Summary",
        "title": "Example Title",
        "profile_picture_url": "https://example.com/pic.jpg",
        "linkedin_url": "https://linkedin.com/in/example"
      },
      "experience": [],
      "education": []
    }
      */
      const users = rawUsers.map(user => ({
        id: String(user.profile.id),
        name: user.profile.name,
        location: user.profile.location,
        headline: user.profile.headline,
        description: user.profile.description ?? '',
        title: user.profile.title,
        profilePictureUrl: user.profile.profile_picture_url,
        linkedinProfile: user.profile.linkedin_url,
        experience: user.experience,
        education: user.education,
      }));


      const tableUI = new TableUIBuilder()
        .addColumns([
          { key: "name", header: "Name", type: "string" },
          { key: "location", header: "Location", type: "string" },
          { key: "headline", header: "Headline", type: "string" },
          { key: "title", header: "Title", type: "string" },
          { key: "linkedinProfile", header: "LinkedIn", type: "link" },
        ])
        .rows(users.map(u => ({ ...u, linkedinProfile: { url: u.linkedinProfile, text: 'Profile' } })))
        .build();

      const cardUI = new CardUIBuilder()
        .title("Search Results")
        .addChild(tableUI)
        .build();

      return {
        text: `Found ${users.length} users matching the query "${query}"`,
        data: { users },
        ui: cardUI,
      };
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to perform search. Please check your API key and try again.');
    }
  },
};
