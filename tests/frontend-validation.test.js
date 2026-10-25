import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * Validation logic matching JoinClassSection.jsx
 */
function validateJoinKey(key) {
  const trimmed = (key || "").trim();
  if (!trimmed) {
    return "Class key cannot be empty.";
  }
  if (trimmed.length < 4) {
    return "Class key must be at least 4 characters.";
  }
  if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
    return "Class key can only contain letters and numbers.";
  }
  return "";
}

/**
 * Validation logic matching CreateClassModal.jsx
 */
function validateClassName(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return "Class name is required.";
  }
  if (trimmed.length < 3) {
    return "Class name must be at least 3 characters long.";
  }
  return "";
}

/**
 * Duplicate check matching JoinClassSection.jsx
 */
function isDuplicateEnrollment(enrolledClasses, targetKeyOrId) {
  const normalized = (targetKeyOrId || "").trim();
  const upper = normalized.toUpperCase();
  const lower = normalized.toLowerCase();
  return enrolledClasses.some(
    (c) =>
      (c.joinCode && c.joinCode.toUpperCase() === upper) ||
      (c._id && c._id.toLowerCase() === lower)
  );
}

/**
 * Authorization filtering matching ProfessorWorkspace.jsx
 */
function filterProfessorClasses(allClasses, user) {
  if (!user) return [];
  return allClasses.filter(
    (c) =>
      (user.id && c.professorId === user.id) ||
      c.professor === user.name
  );
}

describe("Frontend Join Class Validation", () => {
  it("rejects empty or whitespace-only join keys", () => {
    assert.strictEqual(validateJoinKey(""), "Class key cannot be empty.");
    assert.strictEqual(validateJoinKey("   "), "Class key cannot be empty.");
    assert.strictEqual(validateJoinKey(null), "Class key cannot be empty.");
  });

  it("rejects join keys with fewer than 4 characters", () => {
    assert.strictEqual(
      validateJoinKey("AB"),
      "Class key must be at least 4 characters."
    );
    assert.strictEqual(
      validateJoinKey(" 123 "),
      "Class key must be at least 4 characters."
    );
  });

  it("rejects join keys with special characters", () => {
    assert.strictEqual(
      validateJoinKey("KEY-1234"),
      "Class key can only contain letters and numbers."
    );
    assert.strictEqual(
      validateJoinKey("KEY_1234"),
      "Class key can only contain letters and numbers."
    );
    assert.strictEqual(
      validateJoinKey("KEY@123"),
      "Class key can only contain letters and numbers."
    );
  });

  it("accepts valid alphanumeric join keys", () => {
    assert.strictEqual(validateJoinKey("A3F9B2C1"), "");
    assert.strictEqual(validateJoinKey("CS101"), "");
    assert.strictEqual(validateJoinKey("MATH2020"), "");
  });
});

describe("Frontend Class Creation Validation", () => {
  it("rejects empty or blank class names", () => {
    assert.strictEqual(validateClassName(""), "Class name is required.");
    assert.strictEqual(validateClassName("   "), "Class name is required.");
    assert.strictEqual(validateClassName(null), "Class name is required.");
  });

  it("rejects class names shorter than 3 characters", () => {
    assert.strictEqual(
      validateClassName("CS"),
      "Class name must be at least 3 characters long."
    );
  });

  it("accepts valid class names", () => {
    assert.strictEqual(validateClassName("Operating Systems"), "");
    assert.strictEqual(validateClassName("Database Management"), "");
    assert.strictEqual(validateClassName("CS 101 Introduction"), "");
  });
});

describe("Frontend Class Edit Validation and State Update", () => {
  it("rejects empty or whitespace-only edited class names", () => {
    assert.strictEqual(validateClassName(""), "Class name is required.");
    assert.strictEqual(validateClassName("   "), "Class name is required.");
  });

  it("rejects edited class names shorter than 3 characters", () => {
    assert.strictEqual(
      validateClassName("AI"),
      "Class name must be at least 3 characters long."
    );
  });

  it("updates existing class in list without mutating other classes", () => {
    const initialClasses = [
      { _id: "c1", name: "Operating Systems", subject: "CSED" },
      { _id: "c2", name: "Computer Networks", subject: "CSED" },
    ];
    const updatedClass = {
      _id: "c1",
      name: "Operating Systems (Honors)",
      subject: "CSED Advanced",
    };

    const nextClasses = initialClasses.map((c) =>
      c._id === updatedClass._id ? updatedClass : c
    );

    assert.strictEqual(nextClasses.length, 2);
    assert.strictEqual(nextClasses[0].name, "Operating Systems (Honors)");
    assert.strictEqual(nextClasses[0].subject, "CSED Advanced");
    assert.strictEqual(nextClasses[1].name, "Computer Networks");
  });
});

describe("Student Class Unenrollment", () => {
  it("filters out left class from student classes list", () => {
    const enrolled = [
      { _id: "c1", name: "Operating Systems" },
      { _id: "c2", name: "Data Structures" },
    ];
    const leaveId = "c1";
    const remaining = enrolled.filter((c) => (c._id || c.id) !== leaveId);

    assert.strictEqual(remaining.length, 1);
    assert.strictEqual(remaining[0]._id, "c2");
  });

  it("handles unenrollment using fallback id property", () => {
    const enrolled = [
      { id: "c1", name: "Operating Systems" },
      { id: "c2", name: "Data Structures" },
    ];
    const leaveId = "c2";
    const remaining = enrolled.filter((c) => (c._id || c.id) !== leaveId);

    assert.strictEqual(remaining.length, 1);
    assert.strictEqual(remaining[0].id, "c1");
  });
});

describe("Duplicate Enrollment Protection", () => {
  const existingClasses = [
    { _id: "class_1", name: "Networks", joinCode: "NET101" },
    { _id: "class_2", name: "Algorithms", joinCode: "ALGO202" },
  ];

  it("detects duplicates by uppercase join code", () => {
    assert.strictEqual(
      isDuplicateEnrollment(existingClasses, "NET101"),
      true
    );
  });

  it("detects duplicates case-insensitively", () => {
    assert.strictEqual(
      isDuplicateEnrollment(existingClasses, "net101"),
      true
    );
    assert.strictEqual(
      isDuplicateEnrollment(existingClasses, "algo202"),
      true
    );
  });

  it("detects duplicates by class ID", () => {
    assert.strictEqual(
      isDuplicateEnrollment(existingClasses, "class_1"),
      true
    );
  });

  it("allows non-enrolled new class keys", () => {
    assert.strictEqual(
      isDuplicateEnrollment(existingClasses, "NEWCOURSE1"),
      false
    );
  });
});

describe("Professor Workspace Class Authorization Filtering", () => {
  const mockClasses = [
    {
      _id: "c1",
      name: "Operating Systems",
      professor: "Prof. Alan Turing",
      professorId: "prof_1",
    },
    {
      _id: "c2",
      name: "Quantum Computing",
      professor: "Prof. Richard Feynman",
      professorId: "prof_2",
    },
    {
      _id: "c3",
      name: "Theory of Computation",
      professor: "Prof. Alan Turing",
      professorId: "prof_1",
    },
  ];

  it("returns only classes owned by professor ID", () => {
    const user = { id: "prof_1", name: "Prof. Alan Turing", role: "professor" };
    const filtered = filterProfessorClasses(mockClasses, user);

    assert.strictEqual(filtered.length, 2);
    assert.deepStrictEqual(
      filtered.map((c) => c._id),
      ["c1", "c3"]
    );
  });

  it("returns empty array when professor has no classes", () => {
    const user = { id: "prof_99", name: "Prof. New", role: "professor" };
    const filtered = filterProfessorClasses(mockClasses, user);

    assert.strictEqual(filtered.length, 0);
  });

  it("falls back to matching professor display name if ID is missing", () => {
    const user = { id: null, name: "Prof. Richard Feynman", role: "professor" };
    const filtered = filterProfessorClasses(mockClasses, user);

    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0]._id, "c2");
  });
});

describe("Admin Dashboard Workspace and Filtering", () => {
  const mockStudents = [
    { id: "s1", name: "Alice Johnson", email: "alice@university.edu" },
    { id: "s2", name: "Bob Smith", email: "bob@university.edu" },
    { id: "s3", name: "Carol Davis", email: "carol@college.org" },
  ];

  it("filters students case-insensitively by name", () => {
    const query = "alice";
    const filtered = mockStudents.filter((s) =>
      `${s.name} ${s.email}`.toLowerCase().includes(query.toLowerCase())
    );
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].name, "Alice Johnson");
  });

  it("filters students case-insensitively by email domain", () => {
    const query = "college.org";
    const filtered = mockStudents.filter((s) =>
      `${s.name} ${s.email}`.toLowerCase().includes(query.toLowerCase())
    );
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].id, "s3");
  });

  it("returns all students when search query is empty", () => {
    const query = "";
    const filtered = mockStudents.filter((s) =>
      `${s.name} ${s.email}`.toLowerCase().includes(query.toLowerCase())
    );
    assert.strictEqual(filtered.length, 3);
  });
});

describe("Study Material Upload and Validation", () => {
  function validateUploadFile(fileName, fileSize) {
    if (!fileName?.toLowerCase().endsWith(".pdf")) {
      return "Only PDF files (.pdf) are supported for RAG indexing.";
    }
    if (fileSize > 25 * 1024 * 1024) {
      return "File size exceeds 25 MB limit. Please upload a smaller PDF.";
    }
    return "";
  }

  it("rejects non-PDF files", () => {
    assert.strictEqual(
      validateUploadFile("lecture_notes.docx", 1024),
      "Only PDF files (.pdf) are supported for RAG indexing."
    );
    assert.strictEqual(
      validateUploadFile("slides.pptx", 1024),
      "Only PDF files (.pdf) are supported for RAG indexing."
    );
  });

  it("rejects files larger than 25MB", () => {
    assert.strictEqual(
      validateUploadFile("huge_textbook.pdf", 30 * 1024 * 1024),
      "File size exceeds 25 MB limit. Please upload a smaller PDF."
    );
  });

  it("accepts valid PDF within 25MB limit", () => {
    assert.strictEqual(
      validateUploadFile("os_chapter_1.pdf", 5 * 1024 * 1024),
      ""
    );
  });
});

describe("Classroom Chat State and Citation Preservation", () => {
  it("correctly resolves assistant answer and citations into chat history", () => {
    const initialMessages = [
      { id: 1, role: "user", text: "What is paging?" },
      { id: 2, role: "assistant", text: "Analyzing...", loading: true },
    ];

    const answer = "Paging is a memory management scheme.";
    const citations = [{ document_title: "OS Unit 3", page_number: 14 }];

    const updated = initialMessages.map((msg) =>
      msg.id === 2
        ? { id: 2, role: "assistant", text: answer, citations, loading: false }
        : msg
    );

    assert.strictEqual(updated.length, 2);
    assert.strictEqual(updated[1].text, "Paging is a memory management scheme.");
    assert.strictEqual(updated[1].loading, false);
    assert.strictEqual(updated[1].citations.length, 1);
    assert.strictEqual(updated[1].citations[0].page_number, 14);
  });
});
