import { useState, useEffect, useCallback } from "react";
import {
  fetchClassMaterials,
  uploadClassMaterial,
  deleteClassMaterial,
  getMaterialDownloadUrl,
} from "../../services/api";
import { LoadingSpinner, ErrorMessage, SuccessMessage } from "../ui/FeedbackComponents";

/**
 * ClassMaterialsModal allows professors to upload, manage, and inspect
 * course PDFs and study documents for the RAG AI knowledge base.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   classItem: object | null,
 * }} props
 */
export default function ClassMaterialsModal({ isOpen, onClose, classItem }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Delete State
  const [deletingId, setDeletingId] = useState(null);

  const loadMaterials = useCallback(async () => {
    if (!classItem?._id) return;

    try {
      setLoading(true);
      setError("");
      const result = await fetchClassMaterials(classItem._id);
      setMaterials(result.data || []);
    } catch (err) {
      setError(err.message || "Failed to load study materials.");
    } finally {
      setLoading(false);
    }
  }, [classItem?._id]);

  useEffect(() => {
    if (isOpen && classItem?._id) {
      loadMaterials();
      setSelectedFile(null);
      setTitle("");
      setUploadError("");
      setSuccess("");
    }
  }, [isOpen, classItem?._id, loadMaterials]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && !uploading) {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, uploading, onClose]);

  if (!isOpen || !classItem) return null;

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    setUploadError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setUploadError("Only PDF files (.pdf) are supported for RAG indexing.");
      setSelectedFile(null);
      e.target.value = "";
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError("File size exceeds 25 MB limit. Please upload a smaller PDF.");
      setSelectedFile(null);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.pdf$/i, ""));
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a PDF file to upload.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setSuccess("");

      const result = await uploadClassMaterial(
        classItem._id,
        selectedFile,
        title.trim()
      );

      setMaterials((prev) => [result.data, ...prev]);
      setSuccess(`"${result.data.title}" was uploaded and queued for RAG indexing.`);
      setSelectedFile(null);
      setTitle("");

      const fileInput = document.getElementById("material-file-input");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setUploadError(err.message || "Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(material) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${material.title}"? It will be removed from the class knowledge base and vector index.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(material._id);
      await deleteClassMaterial(material._id);
      setMaterials((prev) => prev.filter((m) => m._id !== material._id));
      setSuccess(`"${material.title}" was deleted.`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete material.");
    } finally {
      setDeletingId(null);
    }
  }

  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  }

  function getStatusBadge(status) {
    switch (status) {
      case "indexed":
        return <span className="rag-badge rag-badge--indexed">● RAG Ready</span>;
      case "processing":
        return <span className="rag-badge rag-badge--processing">◐ Vectorizing</span>;
      case "failed":
        return <span className="rag-badge rag-badge--failed">✕ Failed</span>;
      default:
        return <span className="rag-badge rag-badge--uploaded">○ Queued for RAG</span>;
    }
  }

  return (
    <div
      className="prof-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="materials-modal-title"
      onClick={onClose}
    >
      <div
        className="prof-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "680px", width: "95%" }}
      >
        <div className="prof-modal-header">
          <div>
            <h2 id="materials-modal-title">Study Materials & RAG Knowledge</h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
              {classItem.name} {classItem.subject && `• ${classItem.subject}`}
            </p>
          </div>
          <button
            type="button"
            className="prof-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={uploading}
          >
            ✕
          </button>
        </div>

        {/* Upload Form Section */}
        <section
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px 18px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: "15px", color: "#0f172a" }}>
            Upload Course PDF for AI Ingestion
          </h3>
          <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#64748b" }}>
            Uploaded academic materials are converted into vector embeddings for the classroom AI assistant.
          </p>

          <form onSubmit={handleUpload}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label
                  htmlFor="material-file-input"
                  style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}
                >
                  Select PDF File <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  id="material-file-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                  style={{ fontSize: "12px", width: "100%" }}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="material-title-input"
                  style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}
                >
                  Document Title (Optional)
                </label>
                <input
                  id="material-title-input"
                  type="text"
                  placeholder="e.g. Unit 1: Process Synchronization"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={uploading}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    fontSize: "12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "7px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {uploadError && (
              <p className="form-message form-message--error" role="alert" style={{ marginBottom: "10px" }}>
                {uploadError}
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="prof-primary-btn"
                disabled={uploading || !selectedFile}
                style={{ fontSize: "12px", padding: "8px 16px" }}
              >
                {uploading ? "Uploading & Vectorizing…" : "Upload PDF for RAG"}
              </button>
            </div>
          </form>
        </section>

        {/* Status / Feedback messages */}
        {success && <SuccessMessage message={success} />}
        {error && <ErrorMessage message={error} onRetry={loadMaterials} />}

        {/* Existing Materials List */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a" }}>
              Class Knowledge Base ({materials.length})
            </h3>
            <button
              type="button"
              onClick={loadMaterials}
              disabled={loading}
              style={{
                background: "transparent",
                border: "none",
                color: "#0ea5e9",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {loading ? "Loading…" : "↻ Refresh"}
            </button>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading course study materials…" />
          ) : materials.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "30px 20px",
                border: "2px dashed #e2e8f0",
                borderRadius: "12px",
                background: "#fafafa",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>📚</div>
              <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#334155" }}>
                No materials uploaded yet
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b", maxWidth: "380px", marginInline: "auto" }}>
                Upload lecture notes, textbooks, or syllabus PDFs above to empower the AI assistant with document-grounded answers.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "280px", overflowY: "auto" }}>
              {materials.map((mat) => (
                <div
                  key={mat._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    background: "#fff",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: "#fee2e2",
                        color: "#ef4444",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 800,
                        fontSize: "10px",
                        flexShrink: 0,
                      }}
                    >
                      PDF
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: "13px",
                          color: "#1e293b",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={mat.title}
                      >
                        {mat.title}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                        {formatFileSize(mat.fileSize)} • {new Date(mat.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                    {getStatusBadge(mat.ragStatus)}

                    <a
                      href={getMaterialDownloadUrl(mat._id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="prof-secondary-btn"
                      style={{ padding: "5px 10px", fontSize: "11px", textDecoration: "none" }}
                      title="Download PDF"
                    >
                      Download
                    </a>

                    <button
                      type="button"
                      className="prof-danger-action"
                      style={{ padding: "5px 10px", fontSize: "11px" }}
                      onClick={() => handleDelete(mat)}
                      disabled={deletingId === mat._id}
                    >
                      {deletingId === mat._id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="prof-modal-footer" style={{ marginTop: "24px" }}>
          <button type="button" className="prof-secondary-btn" onClick={onClose} disabled={uploading}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
