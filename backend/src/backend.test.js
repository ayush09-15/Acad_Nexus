
const request = require("supertest");
const app = require("./app");

describe("Backend API Tests", () => {
  test("GET /api/health should return success", async () => {
    const response = await request(app).get("/api/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Acad_Nexus backend is running!"
    );
  });

  test("POST /api/auth/login should reject missing credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Email and password are required."
    );
  });

  test("POST /api/classes should reject an unauthenticated request", async () => {
    const response = await request(app)
      .post("/api/classes")
      .send({ name: "Test Class" });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Authentication token is required."
    );
  });

  test("GET /api/classes/123/materials should reject an unauthenticated request", async () => {
    const response = await request(app).get("/api/classes/123/materials");

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
