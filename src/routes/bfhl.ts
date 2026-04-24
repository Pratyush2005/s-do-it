import { createFileRoute } from "@tanstack/react-router";
import { processBfhl, IDENTITY } from "@/lib/bfhl";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const Route = createFileRoute("/bfhl")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async () =>
        Response.json(
          { operation_code: 1 },
          { status: 200, headers: CORS_HEADERS },
        ),
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { data?: unknown };
          const result = processBfhl(body?.data, IDENTITY);
          return Response.json(result, { status: 200, headers: CORS_HEADERS });
        } catch {
          return Response.json(
            { error: "Invalid JSON body" },
            { status: 400, headers: CORS_HEADERS },
          );
        }
      },
    },
  },
});
