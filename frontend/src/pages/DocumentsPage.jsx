import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { idsMatch } from '../utils/idUtils';
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

const DocumentsPage = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docsCount, setDocsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    document_type: "resume",
    document_file: null,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/employees/?all=true");
      setEmployees(response.data.results || response.data);
    } catch (err) {
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (employeeId) => {
    setDocsLoading(true);
    try {
      const response = await axiosInstance.get(`/documents/${employeeId}/list/`);
      const results = response.data.results || response.data;
      setDocuments(results);
      setDocsCount(response.data.count ?? results.length);
    } catch (err) {
      console.error("Failed to load documents");
    } finally {
      setDocsLoading(false);
    }
  };

  const handleEmployeeClick = (emp) => {
    setSelectedEmployee(emp);
    setShowUploadForm(false);
    fetchDocuments(emp.id);
  };

  const handleVerify = async (docId) => {
    try {
      await axiosInstance.post(`/documents/${docId}/verify/`);
      fetchDocuments(selectedEmployee.id);
    } catch (err) {
      console.error("Failed to verify document");
    }
  };

  const handleArchive = async (docId) => {
    if (!window.confirm("Archive this document?")) return;
    try {
      await axiosInstance.post(`/documents/${docId}/archive/`);
      fetchDocuments(selectedEmployee.id);
    } catch (err) {
      console.error("Failed to archive document");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.document_file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("employee", selectedEmployee.id);
      formData.append("document_type", uploadData.document_type);
      formData.append("document_file", uploadData.document_file);

      await axiosInstance.post("/documents/create/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowUploadForm(false);
      setUploadData({ document_type: "resume", document_file: null });
      fetchDocuments(selectedEmployee.id);
    } catch (err) {
      console.error("Failed to upload document");
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

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Documents</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Manage employee documents</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px" }}>

        {/* Left — Employee List */}
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "16px", borderBottom: "0.5px solid #1e293b" }}>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#f1f5f9", margin: 0 }}>Employees</p>
          </div>
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <p style={{ color: "#64748b", fontSize: "13px" }}>Loading...</p>
            </div>
          ) : (
            <div>
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => handleEmployeeClick(emp)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "0.5px solid #1e293b",
                    cursor: "pointer",
                    background: idsMatch(selectedEmployee?.id, emp.id) ? "#1e3a5f" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div style={{ width: "30px", height: "30px", background: "#1e3a5f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 500 }}>
                      {emp.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", color: "#f1f5f9", margin: 0 }}>{emp.full_name}</p>
                    <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>{emp.employee_id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Documents */}
        <div>
          {!selectedEmployee ? (
            <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "60px", textAlign: "center" }}>
              <p style={{ color: "#64748b", fontSize: "13px" }}>Select an employee to view documents</p>
            </div>
          ) : (
            <div>
              {/* Employee Header */}
              <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "16px 20px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", background: "#1e3a5f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "16px", color: "#3b82f6", fontWeight: 500 }}>
                      {selectedEmployee.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 500, color: "#f1f5f9", margin: 0 }}>{selectedEmployee.full_name}</p>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{selectedEmployee.designation} — {selectedEmployee.department}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  style={{ background: "#2563eb", color: "#eff6ff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
                >
                  + Upload Document
                </button>
              </div>

              {/* Upload Form */}
              {showUploadForm && (
                <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px" }}>Upload Document</h3>
                  <form onSubmit={handleUpload}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#64748b", marginBottom: "6px", letterSpacing: "0.8px" }}>DOCUMENT TYPE</label>
                        <select
                          value={uploadData.document_type}
                          onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                          style={inputStyle}
                        >
                          {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#64748b", marginBottom: "6px", letterSpacing: "0.8px" }}>FILE</label>
                        <input
                          type="file"
                          onChange={(e) => setUploadData({ ...uploadData, document_file: e.target.files[0] })}
                          style={{ ...inputStyle, padding: "8px 14px" }}
                          required
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setShowUploadForm(false)}
                        style={{ padding: "8px 16px", background: "#0f1a2e", border: "0.5px solid #1e293b", borderRadius: "8px", color: "#64748b", fontSize: "13px", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={uploading}
                        style={{ padding: "8px 16px", background: uploading ? "#1e3a5f" : "#2563eb", border: "none", borderRadius: "8px", color: "#eff6ff", fontSize: "13px", fontWeight: 500, cursor: uploading ? "not-allowed" : "pointer" }}
                      >
                        {uploading ? "Uploading..." : "Upload"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Documents List */}
              <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "16px", borderBottom: "0.5px solid #1e293b" }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#f1f5f9", margin: 0 }}>Documents ({docsCount})</p>
                </div>
                {docsLoading ? (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <p style={{ color: "#64748b", fontSize: "13px" }}>Loading documents...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <p style={{ color: "#475569", fontSize: "13px" }}>No documents found</p>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>DOCUMENT TYPE</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>STATUS</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>UPLOADED</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => {
                        const statusStyle = statusColors[doc.verification_status] || statusColors.pending;
                        return (
                          <tr key={doc.id} style={{ borderBottom: "0.5px solid #1e293b" }}>
                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#f1f5f9" }}>
                              {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                                {doc.verification_status}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b" }}>
                              {new Date(doc.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                {doc.document_file && (
                                  <a
                                    href={doc.document_file}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ background: "#1e3a5f", color: "#3b82f6", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer", textDecoration: "none" }}
                                  >
                                    View
                                  </a>
                                )}
                                {doc.verification_status === "pending" && (
                                  <button
                                    onClick={() => handleVerify(doc.id)}
                                    style={{ background: "#064e3b", color: "#10b981", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}
                                  >
                                    Verify
                                  </button>
                                )}
                                <button
                                  onClick={() => handleArchive(doc.id)}
                                  style={{ background: "#451a03", color: "#f59e0b", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}
                                >
                                  Archive
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;