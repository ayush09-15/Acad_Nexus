# Acad_Nexus Backend API Documentation

## Base URL

`http://localhost:5000/api`

Protected endpoints require a JWT access token:

`Authorization: Bearer <token>`

## Authentication

### Login

Use the authentication endpoints defined in `src/routes/authRoutes.js`.

**Login**

`POST /api/auth/login`

Request body:
```json
{
  "email": "student@example.com",
  "password": "your-password"
}
```

A successful login returns a token in `data.token`. Use this token for protected endpoints.

*Note: Confirm the registration endpoint and exact response fields in `authRoutes.js` and `authController.js` before relying on them.*

## Class APIs

### 1. Create a class

`POST /classes`

**Access:** Approved, authenticated professor.

Request body:
```json
{
  "name": "Data Structures",
  "subject": "Computer Science",
  "description": "DSA course"
}
```

Success: `201 Created`

The server generates a unique join code and associates the class with the authenticated professor.

### 2. List classes

`GET /classes`

**Access:** Authenticated user.

- Professors see classes they own, including archived classes.
- Students see only classes they are enrolled in that are not archived.

Success: `200 OK`

### 3. Get a class by ID

`GET /classes/:id`

**Access:** Authenticated user.

- Professors can access their own classes.
- Students can access only enrolled, non-archived classes.

Errors include `400 Bad Request` for an invalid ID and `404 Not Found` when the class is inaccessible or does not exist.

### 4. Update a class

`PUT /classes/:id`

**Access:** Authenticated professor who owns the class.

Request body may include one or more of:
```json
{
  "name": "Advanced Data Structures",
  "subject": "Computer Science",
  "description": "Updated course description"
}
```

Success: `200 OK`

Errors include `400 Bad Request` for invalid input and `404 Not Found` if the class does not exist or is not owned by the professor.

### 5. Archive a class

`PATCH /classes/:id/archive`

**Access:** Authenticated professor who owns the class.

Marks the class as archived rather than permanently deleting it.

Success: `200 OK`

Archived classes are excluded from student listings, direct student access, and joining by join code.

### 6. Delete a class

`DELETE /classes/:id`

**Access:** Authenticated professor who owns the class.

Permanently removes the class document.

Success: `200 OK`

### 7. Join a class

`POST /classes/join`

**Access:** Authenticated student.

Request body:
```json
{
  "joinCode": "AB12CD34"
}
```

Success: `200 OK`

The student's ID is saved in the class's `students` array in MongoDB.

Errors include:
- `400 Bad Request` — missing or invalid join code input.
- `404 Not Found` — join code does not match an active class.
- `409 Conflict` — student is already enrolled.

## Common error responses

Responses generally include:
```json
{
  "success": false,
  "message": "Description of the error"
}
```

Common status codes:

| Status | Meaning |
|---|---|
| `200` | Request successful |
| `201` | Resource created |
| `400` | Invalid input |
| `401` | Authentication required or invalid |
| `403` | Insufficient permissions |
| `404` | Resource not found or inaccessible |
| `409` | Conflict, such as duplicate enrollment |
| `500` | Internal server error |

## Health check

`GET /api/health`

Success: `200 OK`

Confirms the backend server is running.

## Notes

- Professor identity and ownership are derived from the authenticated user, not trusted from request bodies.
- Class data and enrollment are persisted in MongoDB.
- The API uses JSON request and response bodies.
