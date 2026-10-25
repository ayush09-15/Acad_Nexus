/**
 * Centralized API configuration for Acad Nexus.
 *
 * Every authenticated request reads the JWT stored in localStorage and
 * attaches it as a Bearer token.  The helpers below standardize error
 * handling so individual components don't have to repeat try/catch
 * boilerplate around fetch().
 */

const API_BASE_URL = "http://127.0.0.1:5001/api";

/**
 * Return the current auth headers (Bearer token) if a token exists.
 */
function getAuthHeaders() {
  const token = localStorage.getItem("acadNexusToken");
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Generic fetch wrapper.
 *
 * - Automatically attaches auth headers.
 * - Parses JSON responses.
 * - Throws an error with the server's message when `success` is false
 *   or the HTTP status is not OK.
 * - Detects 401 responses and clears stored credentials so the UI can
 *   redirect to the login page.
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = getAuthHeaders();
  if (typeof FormData !== "undefined" && options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const config = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  // Handle non-JSON responses (e.g. 502 from a down server).
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The server is not responding. Please try again later.");
  }

  if (!response.ok) {
    // If the token is invalid or expired, clear credentials.
    if (response.status === 401) {
      localStorage.removeItem("acadNexusToken");
      localStorage.removeItem("acadNexusUser");
      window.dispatchEvent(new Event("acadNexusAuthChanged"));
    }

    throw new Error(result.message || `Request failed (${response.status}).`);
  }

  return result;
}

// ── Class API ─────────────────────────────────────────────────────────

/**
 * Fetch all classes visible to the authenticated user.
 */
export function fetchClasses() {
  return apiRequest("/classes");
}

/**
 * Fetch a single class by its MongoDB _id.
 */
export function fetchClassById(classId) {
  return apiRequest(`/classes/${classId}`);
}

/**
 * Ask the backend to look up a class by its join code.
 * The backend's current implementation finds the class but does not
 * persist enrollment — that is a known backend dependency.
 */
export function joinClassByCode(joinCode) {
  return apiRequest("/classes/join", {
    method: "POST",
    body: JSON.stringify({ joinCode }),
  });
}

/**
 * Leave an enrolled class (student-only).
 */
export function leaveClass(classId) {
  return apiRequest(`/classes/${classId}/leave`, {
    method: "POST",
  });
}

/**
 * Create a new class (professor-only).
 */
export function createClass({ name, subject, description }) {
  return apiRequest("/classes", {
    method: "POST",
    body: JSON.stringify({ name, subject, description }),
  });
}

/**
 * Update an existing class by its _id (professor-only, ownership-checked).
 */
export function updateClass(classId, { name, subject, description }) {
  return apiRequest(`/classes/${classId}`, {
    method: "PUT",
    body: JSON.stringify({ name, subject, description }),
  });
}

/**
 * Delete a class by its _id (professor-only, ownership-checked).
 */
export function deleteClass(classId) {
  return apiRequest(`/classes/${classId}`, {
    method: "DELETE",
  });
}

// ── Study Materials & RAG API ─────────────────────────────────────────

/**
 * Upload a PDF study material to a class (professor-only).
 */
export function uploadClassMaterial(classId, file, title) {
  const formData = new FormData();
  formData.append("file", file);
  if (title) {
    formData.append("title", title);
  }

  return apiRequest(`/classes/${classId}/materials`, {
    method: "POST",
    body: formData,
  });
}

/**
 * Fetch all study materials for a class.
 */
export function fetchClassMaterials(classId) {
  return apiRequest(`/classes/${classId}/materials`);
}

/**
 * Delete a study material by its ID (professor-only).
 */
export function deleteClassMaterial(materialId) {
  return apiRequest(`/materials/${materialId}`, {
    method: "DELETE",
  });
}

/**
 * Get download URL for a material.
 */
export function getMaterialDownloadUrl(materialId) {
  return `${API_BASE_URL}/materials/${materialId}/download`;
}

/**
 * Ask the classroom RAG AI assistant a document-grounded question.
 */
export function askClassAssistant(classId, question) {
  return apiRequest(`/classes/${classId}/chat`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

// ── Admin API ─────────────────────────────────────────────────────────

/**
 * Fetch all registered professors (admin-only).
 */
export function fetchAdminProfessors() {
  return apiRequest("/admin/professors");
}

/**
 * Fetch all registered students (admin-only).
 */
export function fetchAdminStudents() {
  return apiRequest("/admin/students");
}

// ── Auth helpers ──────────────────────────────────────────────────────

/**
 * Return the currently stored user object, or null.
 */
export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("acadNexusUser") || "null");
  } catch {
    return null;
  }
}

/**
 * Return the stored JWT, or null.
 */
export function getStoredToken() {
  return localStorage.getItem("acadNexusToken");
}

/**
 * Clear auth credentials and notify listeners.
 */
export function clearAuth() {
  localStorage.removeItem("acadNexusToken");
  localStorage.removeItem("acadNexusUser");
  window.dispatchEvent(new Event("acadNexusAuthChanged"));
}
