import { http, HttpResponse } from "msw"

export const handlers = [
  http.get("/api/bootstrap/health", () => HttpResponse.json({ code: 100, message: "OK", data: { service: "api-server" } })),
]
