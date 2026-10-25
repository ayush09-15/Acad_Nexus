import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Professor Model & Profile Contracts", () => {
  it("validates Professor profile payload schema", () => {
    const validProfile = {
      userId: "64e0a1b2c3d4e5f6a7b8c9d0",
      name: "Dr. Alan Turing",
      email: "aturing@university.edu",
      department: "Computer Science & Engineering",
      designation: "Professor & Chair",
      qualification: "Ph.D. in Mathematics",
      institution: "Acad Nexus University",
      cabinOffice: "Turing Hall, Room 101",
      officeHours: "Tuesday & Thursday 2:00 PM - 4:00 PM",
      bio: "Research in computability, machine intelligence, and cryptography.",
      approvalStatus: "approved",
    };

    assert.strictEqual(typeof validProfile.userId, "string");
    assert.strictEqual(typeof validProfile.name, "string");
    assert.strictEqual(typeof validProfile.email, "string");
    assert.strictEqual(typeof validProfile.department, "string");
    assert.strictEqual(typeof validProfile.designation, "string");
    assert.ok(["pending", "approved", "rejected"].includes(validProfile.approvalStatus));
  });

  it("builds correct professor registration payload with Approach 2 fields", () => {
    function buildRegistrationPayload(form, role) {
      return {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
        department: role === "professor" ? form.department?.trim() : undefined,
        designation: role === "professor" ? form.designation?.trim() : undefined,
      };
    }

    const professorPayload = buildRegistrationPayload(
      {
        name: "Dr. Grace Hopper",
        email: "ghopper@navy.mil",
        password: "securePassword123!",
        department: "Computer Science",
        designation: "Associate Professor",
      },
      "professor"
    );

    assert.strictEqual(professorPayload.role, "professor");
    assert.strictEqual(professorPayload.department, "Computer Science");
    assert.strictEqual(professorPayload.designation, "Associate Professor");

    const studentPayload = buildRegistrationPayload(
      {
        name: "John Doe",
        email: "jdoe@school.edu",
        password: "securePassword123!",
        department: "CS",
        designation: "TA",
      },
      "student"
    );

    assert.strictEqual(studentPayload.role, "student");
    assert.strictEqual(studentPayload.department, undefined);
    assert.strictEqual(studentPayload.designation, undefined);
  });

  it("handles professor profile update payload sanitization", () => {
    function sanitizeProfileUpdate(body) {
      const allowed = [
        "department",
        "designation",
        "qualification",
        "institution",
        "cabinOffice",
        "officeHours",
        "bio",
      ];
      const sanitized = {};
      for (const field of allowed) {
        if (body[field] !== undefined) {
          sanitized[field] = typeof body[field] === "string" ? body[field].trim() : body[field];
        }
      }
      return sanitized;
    }

    const rawInput = {
      department: "  Mathematics  ",
      designation: "Assistant Professor",
      approvalStatus: "approved", // malicious client trying to escalate
      userId: "attacker_id",
      bio: "Algebraic geometry enthusiast",
    };

    const sanitized = sanitizeProfileUpdate(rawInput);
    assert.strictEqual(sanitized.department, "Mathematics");
    assert.strictEqual(sanitized.designation, "Assistant Professor");
    assert.strictEqual(sanitized.bio, "Algebraic geometry enthusiast");
    assert.strictEqual(sanitized.approvalStatus, undefined, "approvalStatus must not be updatable via profile PUT");
    assert.strictEqual(sanitized.userId, undefined, "userId must not be modifiable via profile PUT");
  });

  it("verifies admin professor approval state synchronization", () => {
    // Approach 2: synchronizes User.professorApproved with Professor.approvalStatus
    function syncApproval(user, professorDoc, adminId) {
      user.professorApproved = true;
      professorDoc.approvalStatus = "approved";
      professorDoc.approvedBy = adminId;
      professorDoc.approvedAt = new Date();
      return { user, professorDoc };
    }

    function syncRevocation(user, professorDoc) {
      user.professorApproved = false;
      professorDoc.approvalStatus = "pending";
      professorDoc.approvedAt = null;
      return { user, professorDoc };
    }

    const mockUser = { id: "u1", professorApproved: false };
    const mockProf = { userId: "u1", approvalStatus: "pending", approvedBy: null, approvedAt: null };

    const approved = syncApproval(mockUser, mockProf, "admin_999");
    assert.strictEqual(approved.user.professorApproved, true);
    assert.strictEqual(approved.professorDoc.approvalStatus, "approved");
    assert.strictEqual(approved.professorDoc.approvedBy, "admin_999");
    assert.ok(approved.professorDoc.approvedAt instanceof Date);

    const revoked = syncRevocation(approved.user, approved.professorDoc);
    assert.strictEqual(revoked.user.professorApproved, false);
    assert.strictEqual(revoked.professorDoc.approvalStatus, "pending");
    assert.strictEqual(revoked.professorDoc.approvedAt, null);
  });

  it("resolves professor profile payload from either res.data or res.data.profile", () => {
    function resolveProfile(res) {
      const p = res?.data?.profile || res?.data;
      if (p && typeof p === "object") {
        return {
          department: p.department || "",
          designation: p.designation || "",
        };
      }
      return null;
    }

    // Direct object shape (what backend currently sends)
    const directRes = { success: true, data: { department: "Computer Science", designation: "Professor" } };
    assert.deepStrictEqual(resolveProfile(directRes), {
      department: "Computer Science",
      designation: "Professor",
    });

    // Nested object shape
    const nestedRes = { success: true, data: { profile: { department: "Physics", designation: "Lecturer" } } };
    assert.deepStrictEqual(resolveProfile(nestedRes), {
      department: "Physics",
      designation: "Lecturer",
    });
  });
});
