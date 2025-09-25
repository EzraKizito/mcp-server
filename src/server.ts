import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";

// Create a server
const server = new McpServer({
  name: "first-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
    prompts: {},
  },
});

server.registerTool(
  "create-user",
  {
    title: "Second create user",
    description: "Create a new user in the database",
    inputSchema: {
      name: z.string(),
      email: z.string(),
      address: z.string(),
      phone: z.string(),
    },
    annotations: {
      title: "Create User",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params) => {
    try {
      const id = await createUser(params);
      return {
        content: [{ type: "text", text: `User ${id} created successfully` }],
      };
    } catch {
      return {
        content: [{ type: "text", text: `Failed to save user` }],
      };
    }
  }
);

server.resource(
  "users",
  "users://all",
  {
    description: "Get all users",
    title: "Users",
    mimeType: "application/json",
  },
  async (uri) => {
    const dataPath = path.resolve(process.cwd(), "src", "data", "users.json");
    // // Read and parse existing users
    const raw = await fs.readFile(dataPath, "utf-8");
    const users: Array<any> = JSON.parse(raw || "[]");

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(users),
          mimeType: "application/json",
        },
      ],
    };
  }
);

async function createUser(user: {
  name: string;
  email: string;
  address: string;
  phone: string;
}) {
  // Resolve path relative to the repository root so this works whether running
  // compiled JS or tsx/ts-node from the project root.
  const dataPath = path.resolve(process.cwd(), "src", "data", "users.json");

  // // Read and parse existing users
  const raw = await fs.readFile(dataPath, "utf-8");
  const users: Array<any> = JSON.parse(raw || "[]");

  const id = users.length + 1;
  users.push({ id, ...user });

  await fs.writeFile(dataPath, JSON.stringify(users, null, 2), "utf-8");

  return id;
}

async function main() {
  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
