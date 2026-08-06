import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { statusColors } from "../constants/statusColors";

const DOCUMENT_TYPE_LABELS = {
  resume: "Resume",
  offer_letter: "Offer Letter",
  nda: "NDA",
  aadhaar: "Aadhaar",
  pan: "PAN",
  passport: "Passport",
  educational_certificate: "Educational Certificate",
  experience_certificate: "Experience Certificate",
  policy_acceptance: "Policy Acceptance Form",
  exit_document: "Exit Document",
  other: "Other",
};


const MyDocumentsPage = () => {
  const [employeeId, setEmployeeId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    document_type: "resume",
    document_file: null,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    try {
      const profileRes = await axiosInstance.get("/employees/me/");
      setEmployeeId(profileRes.data.id);
      await fetchDocuments(profileRes.data.id);
    } catch (err) {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (empId) => {
    try {
      const response = await axiosInstance.get(`/documents/${empId}/list/`);
      setDocuments(response.data.results || response.data);
    } catch (err) {
      setError("Failed to load documents");
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.document_file || !employeeId) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const formDataObj = new FormData();
      formDataObj.append("employee", employeeId);
      formDataObj.append("document_type", uploadData.document_type);
      formDataObj.append("document_file", uploadData.document_file);
      await axiosInstance.post("/documents/create/", formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowUploadForm(false);
      setUploadData({ document_type: "resume", document_file: null });
      fetchDocuments(employeeId);
      setSuccess("Document uploaded successfully!");
    } catch (err) {
      setError("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "#0f1a2e",
    border: "0.5px solid #1e3a5f",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#f1f5f9",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 500,
    color: "#64748b",
    marginBottom: "6px",
    letterSpacing: "0.8px",
  };

  const sectionStyle = {
    background: "#0a1628",
    border: "0.5px solid #1e293b",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "16px",
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <p style={{ color: "#64748b", fontSize: "13px" }}>Loading documents...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>My Documents</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Upload and view your documents</p>
      </div>

      {/* Success */}
      {success && (
        <div style={{ background: "#064e3b", border: "0.5px solid #10b981", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#10b981", margin: 0 }}>{success}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "20px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: 0 }}>📄 My Documents ({documents.length})</h3>
          <button onClick={() => setShowUploadForm(!showUploadForm)}
            style={{ background: "#2563eb", color: "#eff6ff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
            + Upload Document
          </button>
        </div>

        {showUploadForm && (
          <div style={{ background: "#0f1a2e", border: "0.5px solid #1e293b", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
            <form onSubmit={handleDocumentUpload}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={labelStyle}>DOCUMENT TYPE</label>
                  <select value={uploadData.document_type}
                    onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                    style={inputStyle}>
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>FILE</label>
                  <input type="file"
                    onChange={(e) => setUploadData({ ...uploadData, document_file: e.target.files[0] })}
                    style={{ ...inputStyle, padding: "8px 14px" }} required />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => setShowUploadForm(false)}
                  style={{ padding: "8px 16px", background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", color: "#64748b", fontSize: "13px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={uploading}
                  style={{ padding: "8px 16px", background: uploading ? "#1e3a5f" : "#2563eb", border: "none", borderRadius: "8px", color: "#eff6ff", fontSize: "13px", fontWeight: 500, cursor: uploading ? "not-allowed" : "pointer" }}>
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        )}

        {documents.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>No documents uploaded yet</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                  <th style={{ padding: "12px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>DOCUMENT TYPE</th>
                  <th style={{ padding: "12px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>STATUS</th>
                  <th style={{ padding: "12px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>UPLOADED</th>
                  <th style={{ padding: "12px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>VIEW</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const statusStyle = statusColors[doc.verification_status] || statusColors.pending;
                  return (
                    <tr key={doc.id} style={{ borderBottom: "0.5px solid #1e293b" }}>
                      <td style={{ padding: "12px 0", fontSize: "13px", color: "#f1f5f9" }}>
                        {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </td>
                      <td style={{ padding: "12px 0" }}>
                        <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                          {doc.verification_status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 0", fontSize: "12px", color: "#64748b" }}>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 0" }}>
                        {doc.document_file && (
                          <a href={doc.document_file} target="_blank" rel="noreferrer"
                            style={{ background: "#1e3a5f", color: "#3b82f6", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", textDecoration: "none" }}>
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDocumentsPage;