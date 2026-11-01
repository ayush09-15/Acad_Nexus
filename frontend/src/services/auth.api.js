const API_BASE_URL = "http://localhost:5001/api/auth";

async function authRequest(endpoint, payload) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Something went wrong.");
  }

  return result;
}

export function registerUser({
  name,
  email,
  password,
  role = "student",
  department,
  designation,
  qualification,
  institution,
}) {
  return authRequest("/register", {
    name,
    email,
    password,
    role,
    department,
    designation,
    qualification,
    institution,
  });
}

export function registerStudent({ name, email, password }) {
  return registerUser({ name, email, password, role: "student" });
}

export function loginUser({ email, password }) {
  return authRequest("/login", { email, password });
}
