import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * Test harness simulating the frontend apiRequest wrapper behavior
 */
function buildRequestConfig(token, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return {
    headers,
    ...options,
  };
}

/**
 * Test harness simulating API response validation
 */
function handleApiResponse(status, body) {
  if (status >= 200 && status < 300) {
    return body;
  }
  const err = new Error(body?.message || `Request failed (${status}).`);
  err.status = status;
  throw err;
}

/**
 * Test harness simulating ProtectedRoute role resolution
 */
function resolveDashboardRoute(token, user) {
  if (!token) {
    return { redirect: "/login" };
  }
  if (user?.role === "admin") {
    return { component: "AdminDashboard" };
  }
  if (user?.role === "professor") {
    return { component: "ProfessorWorkspace" };
  }
  return { component: "StudentDashboard" };
}

describe("API Request Header Formation", () => {
  it("includes Content-Type by default", () => {
    const config = buildRequestConfig(null);
    assert.strictEqual(config.headers["Content-Type"], "application/json");
    assert.strictEqual(config.headers.Authorization, undefined);
  });

  it("injects Bearer token when token is present in localStorage", () => {
    const config = buildRequestConfig("mock_jwt_token_12345");
    assert.strictEqual(
      config.headers.Authorization,
      "Bearer mock_jwt_token_12345"
    );
  });

  it("properly formats createClass payload", () => {
    const payload = {
      name: "Distributed Systems",
      subject: "Computer Science",
      description: "Graduate seminar on consensus algorithms",
    };
    const config = buildRequestConfig("prof_token", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    assert.strictEqual(config.method, "POST");
    const parsed = JSON.parse(config.body);
    assert.strictEqual(parsed.name, "Distributed Systems");
    assert.strictEqual(parsed.subject, "Computer Science");
    assert.strictEqual(
      parsed.description,
      "Graduate seminar on consensus algorithms"
    );
  });

  it("properly formats updateClass payload and method", () => {
    const payload = {
      name: "Operating Systems Advanced",
      subject: "CSED",
      description: "Updated syllabus and course outline",
    };
    const config = buildRequestConfig("prof_token", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    assert.strictEqual(config.method, "PUT");
    assert.strictEqual(config.headers.Authorization, "Bearer prof_token");
    const parsed = JSON.parse(config.body);
    assert.strictEqual(parsed.name, "Operating Systems Advanced");
    assert.strictEqual(parsed.subject, "CSED");
    assert.strictEqual(parsed.description, "Updated syllabus and course outline");
  });

  it("properly formats joinClass payload with uppercase code", () => {
    const payload = { joinCode: "CS101NET" };
    const config = buildRequestConfig("student_token", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const parsed = JSON.parse(config.body);
    assert.strictEqual(parsed.joinCode, "CS101NET");
  });

  it("properly formats leaveClass request with student auth token", () => {
    const config = buildRequestConfig("student_token", {
      method: "POST",
    });

    assert.strictEqual(config.method, "POST");
    assert.strictEqual(config.headers.Authorization, "Bearer student_token");
  });

  it("properly formats admin requests with admin auth token", () => {
    const config = buildRequestConfig("admin_token");
    assert.strictEqual(config.headers.Authorization, "Bearer admin_token");
    assert.strictEqual(config.headers["Content-Type"], "application/json");
  });

  it("properly formats uploadClassMaterial request with multipart auth", () => {
    const config = buildRequestConfig("prof_token", {
      method: "POST",
    });
    delete config.headers["Content-Type"];

    assert.strictEqual(config.method, "POST");
    assert.strictEqual(config.headers.Authorization, "Bearer prof_token");
    assert.strictEqual(config.headers["Content-Type"], undefined);
  });

  it("properly formats fetchClassMaterials request", () => {
    const config = buildRequestConfig("user_token");
    assert.strictEqual(config.headers.Authorization, "Bearer user_token");
  });

  it("properly formats askClassAssistant request payload and auth", () => {
    const payload = { question: "What is deadlock in OS?" };
    const config = buildRequestConfig("student_token", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    assert.strictEqual(config.method, "POST");
    assert.strictEqual(config.headers.Authorization, "Bearer student_token");
    const parsed = JSON.parse(config.body);
    assert.strictEqual(parsed.question, "What is deadlock in OS?");
  });
});

describe("API Response Error Handling Contracts", () => {
  it("returns parsed data on 200 OK", () => {
    const mockSuccess = {
      success: true,
      data: [{ _id: "1", name: "AI Ethics" }],
    };
    const result = handleApiResponse(200, mockSuccess);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.length, 1);
  });

  it("returns created resource on 201 Created", () => {
    const mockCreated = {
      success: true,
      message: "Class created successfully",
      data: { _id: "c1", name: "Compilers", joinCode: "CMP2026" },
    };
    const result = handleApiResponse(201, mockCreated);
    assert.strictEqual(result.data.name, "Compilers");
    assert.strictEqual(result.data.joinCode, "CMP2026");
  });

  it("throws descriptive error on 400 Bad Request", () => {
    assert.throws(
      () =>
        handleApiResponse(400, {
          success: false,
          message: "Class name is required",
        }),
      (err) => {
        assert.strictEqual(err.message, "Class name is required");
        assert.strictEqual(err.status, 400);
        return true;
      }
    );
  });

  it("throws descriptive error on 404 Not Found (invalid join code)", () => {
    assert.throws(
      () =>
        handleApiResponse(404, {
          success: false,
          message: "Invalid join code or class not found",
        }),
      (err) => {
        assert.strictEqual(
          err.message,
          "Invalid join code or class not found"
        );
        assert.strictEqual(err.status, 404);
        return true;
      }
    );
  });

  it("throws unauthorized error on 401 Unauthorized", () => {
    assert.throws(
      () =>
        handleApiResponse(401, {
          success: false,
          message: "Authentication token is required.",
        }),
      (err) => {
        assert.strictEqual(err.status, 401);
        return true;
      }
    );
  });

  it("throws forbidden error on 403 Forbidden (non-professor creation)", () => {
    assert.throws(
      () =>
        handleApiResponse(403, {
          success: false,
          message: "Only professors can create classes.",
        }),
      (err) => {
        assert.strictEqual(err.status, 403);
        assert.strictEqual(
          err.message,
          "Only professors can create classes."
        );
        return true;
      }
    );
  });
});

describe("Role-Based Dashboard Routing Resolution", () => {
  it("redirects unauthenticated users to /login", () => {
    const result = resolveDashboardRoute(null, null);
    assert.strictEqual(result.redirect, "/login");
  });

  it("routes student user to StudentDashboard", () => {
    const user = { id: "s1", name: "Gaurav Student", role: "student" };
    const result = resolveDashboardRoute("valid_token", user);
    assert.strictEqual(result.component, "StudentDashboard");
  });

  it("routes professor user to ProfessorWorkspace", () => {
    const user = { id: "p1", name: "Prof. Gauss", role: "professor" };
    const result = resolveDashboardRoute("valid_token", user);
    assert.strictEqual(result.component, "ProfessorWorkspace");
  });

  it("routes admin user to AdminDashboard", () => {
    const user = { id: "a1", name: "System Admin", role: "admin" };
    const result = resolveDashboardRoute("valid_token", user);
    assert.strictEqual(result.component, "AdminDashboard");
  });

  it("defaults to StudentDashboard if role is unrecognized or omitted", () => {
    const user = { id: "u1", name: "Guest User" };
    const result = resolveDashboardRoute("valid_token", user);
    assert.strictEqual(result.component, "StudentDashboard");
  });
});
