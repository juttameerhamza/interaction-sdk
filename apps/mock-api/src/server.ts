import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  campaignId: string;
  status: "new";
  createdAt: string;
};

const leads = new Map<string, Lead>();
const port = Number(process.env.PORT ?? 4300);

function json(response: import("node:http").ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, authorization, idempotency-key, x-interaction-id",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request: import("node:http").IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown> : {};
}

createServer(async (request, response) => {
  if (request.method === "OPTIONS") return json(response, 204, null);

  if (request.method === "POST" && request.url === "/leads") {
    try {
      const input = await readJson(request);
      if (!input.firstName || !input.lastName || !input.email || !input.campaignId) {
        return json(response, 422, { code: "LEAD_INVALID", message: "Missing required lead fields", correlationId: request.headers["x-interaction-id"] });
      }
      const lead: Lead = {
        id: randomUUID(),
        firstName: String(input.firstName),
        lastName: String(input.lastName),
        email: String(input.email),
        phone: input.phone ? String(input.phone) : null,
        campaignId: String(input.campaignId),
        status: "new",
        createdAt: new Date().toISOString(),
      };
      leads.set(lead.id, lead);
      return json(response, 201, lead);
    } catch {
      return json(response, 400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
    }
  }

  if (request.method === "GET" && request.url?.startsWith("/leads/")) {
    const id = decodeURIComponent(request.url.slice("/leads/".length));
    const lead = leads.get(id);
    return lead
      ? json(response, 200, lead)
      : json(response, 404, { code: "LEAD_NOT_FOUND", message: "Lead not found", correlationId: request.headers["x-interaction-id"] });
  }

  if (request.method === "GET" && request.url === "/health") {
    return json(response, 200, { ok: true });
  }

  return json(response, 404, { code: "NOT_FOUND", message: "Route not found" });
}).listen(port, () => {
  console.log(`Mock Interaction SDK API listening on http://localhost:${port}`);
});
