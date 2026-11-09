import { describe, expect, test } from "bun:test";
import { app } from "../src/index";

describe("Bun CI/CD Application", () => {
  test("GET / should return application information", async () => {
    const request = new Request("http://localhost:3000/");
    const response = app.fetch(request);

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data.message).toBe("Hello from Bun CI/CD Pipeline!");
    expect(data.runtime).toBe("Bun");
    expect(data.status).toBe("success");
  });

  test("GET /health should return healthy status", async () => {
    const request = new Request("http://localhost:3000/health");
    const response = app.fetch(request);

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data).toEqual({
      status: "healthy",
      message: "Application is running",
      runtime: "Bun",
    });
  });

  test("Unknown routes should return 404", async () => {
    const request = new Request("http://localhost:3000/unknown");
    const response = app.fetch(request);

    expect(response.status).toBe(404);
  });
});
