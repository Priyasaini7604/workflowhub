import { useState, useEffect, useMemo } from "react";
import axiosInstance from "../api/axiosInstance";
import { getEmployeeDocuments, verifyDocument, getEmployeeAssets } from "../api/documents";
import { getAuditLogsFor } from "../api/auditLogs";
import { idsMatch } from '../utils/idUtils';
import { statusColors } from "../constants/statusColors";
import { badgeStyle, actionBtnStyle, viewBtnColors, dangerBtnColors, neutralBtnColors } from "../utils/tableStyles";

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

const ONBOARDING_DOCUMENT_TYPES = [
  'resume', 'offer_letter', 'nda', 'aadhaar', 'pan',
  'passport', 'educational_certificate', 'experience_certificate',
  'policy_acceptance', 'other'
];

const OnboardingPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [verifyingDocId, setVerifyingDocId] = useState(null);

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

  const fetchOnboardingData = async (employeeId) => {
    setTasksLoading(true);
    try {
      const checklistResponse = await axiosInstance.get(`/onboarding/${employeeId}/checklist/`);
      setChecklist(checklistResponse.data);

      const [tasksResponse, documentsResponse, assetsResponse] = await Promise.all([
        axiosInstance.get(`/onboarding/${employeeId}/tasks/`),
        getEmployeeDocuments(employeeId),
        getEmployeeAssets(employeeId),
      ]);

      const tasksData = tasksResponse.data.results || tasksResponse.data;
      setTasks(tasksData);

      const allDocs = documentsResponse.data.results || documentsResponse.data;
      const onboardingDocs = allDocs.filter((doc) =>
        ONBOARDING_DOCUMENT_TYPES.includes(doc.document_type)
      );
      setDocuments(onboardingDocs);

      setAssets(assetsResponse.data.results || assetsResponse.data);

      const taskIds = tasksData.map((t) => t.id);
      const docIds = onboardingDocs.map((d) => d.id);
      const checklistId = checklistResponse.data?.id;

      const [taskLogsRes, checklistLogsRes, docLogsRes] = await Promise.all([
        getAuditLogsFor("OnboardingTask", taskIds),
        getAuditLogsFor("OnboardingChecklist", checklistId ? [checklistId] : []),
        getAuditLogsFor("Document", docIds),
      ]);

      const mergedLogs = [
        ...(taskLogsRes.data.results || taskLogsRes.data),
        ...(checklistLogsRes.data.results || checklistLogsRes.data),
        ...(docLogsRes.data.results || docLogsRes.data),
      ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      setAuditLogs(mergedLogs);
    } catch (err) {
      console.error("Failed to load onboarding data", err);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleEmployeeClick = (emp) => {
    setSelectedEmployee(emp);
    fetchOnboardingData(emp.id);
  };

  const handleTaskStatusUpdate = async (taskId, newStatus) => {
    try {
      await axiosInstance.patch(`/onboarding/tasks/${taskId}/update/`, {
        status: newStatus,
      });
      fetchOnboardingData(selectedEmployee.id);
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const handleMarkVerificationFailed = async () => {
    if (!checklist?.id) return;
    try {
      await axiosInstance.patch(`/onboarding/checklist/${checklist.id}/update/`, {
        background_verification_status: "failed",
      });
      fetchOnboardingData(selectedEmployee.id);
    } catch (err) {
      console.error("Failed to mark verification as failed", err);
    }
  };

  const handleVerifyDocument = async (documentId) => {
    setVerifyingDocId(documentId);
    try {
      await verifyDocument(documentId);
      fetchOnboardingData(selectedEmployee.id);
    } catch (err) {
      console.error("Failed to verify document", err);
    } finally {
      setVerifyingDocId(null);
    }
  };

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter(
      (emp) =>
        emp.full_name?.toLowerCase().includes(term) ||
        emp.employee_id?.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  const timelineEvents = auditLogs;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Onboarding Management</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Track employee onboarding progress</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px" }}>

        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "16px", borderBottom: "0.5px solid #1e293b" }}>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 10px" }}>Employees</p>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or ID..."
              style={{
                width: "100%",
                background: "#0f1a2e",
                border: "0.5px solid #1e293b",
                borderRadius: "6px",
                padding: "8px 10px",
                fontSize: "12px",
                color: "#f1f5f9",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <p style={{ color: "#64748b", fontSize: "13px" }}>Loading...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <p style={{ color: "#475569", fontSize: "13px" }}>No employees match "{searchTerm}"</p>
            </div>
          ) : (
            <div>
              {filteredEmployees.map((emp) => (
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

        <div>
          {!selectedEmployee ? (
            <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "60px", textAlign: "center" }}>
              <p style={{ color: "#64748b", fontSize: "13px" }}>Select an employee to view onboarding details</p>
            </div>
          ) : (
            <div>
              <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "16px 20px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
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

              {tasksLoading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <p style={{ color: "#64748b", fontSize: "13px" }}>Loading onboarding data...</p>
                </div>
              ) : (
                <>
                  {checklist && (
                    <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
                        📋 Onboarding Checklist
                      </h3>

                      <div style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>Completion</span>
                          <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 500 }}>{checklist.onboarding_completion_percentage}%</span>
                        </div>
                        <div style={{ background: "#1e293b", borderRadius: "4px", height: "6px" }}>
                          <div style={{ background: "#10b981", borderRadius: "4px", height: "6px", width: `${checklist.onboarding_completion_percentage}%` }} />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        {[
                          { label: "Offer Letter Uploaded", value: checklist.offer_letter_uploaded },
                          { label: "Documents Submitted", value: checklist.documents_submitted },
                          { label: "Documents Verified", value: checklist.documents_verified },
                          { label: "Induction Completed", value: checklist.induction_completed },
                        ].map((item) => (
                          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: item.value ? "#064e3b" : "#1e293b", border: `0.5px solid ${item.value ? "#10b981" : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {item.value && <span style={{ fontSize: "10px", color: "#10b981" }}>✓</span>}
                            </div>
                            <span style={{ fontSize: "12px", color: item.value ? "#f1f5f9" : "#64748b" }}>{item.label}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>Background Verification:</span>
                        <span style={badgeStyle(statusColors[checklist.background_verification_status] || statusColors.pending)}>
                          {checklist.background_verification_status}
                        </span>
                        {checklist.background_verification_status !== "failed" &&
                          checklist.background_verification_status !== "completed" && (
                            <button
                              onClick={handleMarkVerificationFailed}
                              style={actionBtnStyle(dangerBtnColors)}
                            >
                              Mark as Failed
                            </button>
                          )}
                      </div>
                    </div>
                  )}

                  <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
                      📄 Documents
                    </h3>
                    {documents.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>No documents uploaded yet</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {documents.map((doc) => {
                          const statusStyle = statusColors[doc.verification_status] || statusColors.pending;
                          return (
                            <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#0f1a2e", border: "0.5px solid #1e293b", borderRadius: "8px" }}>
                              <span style={{ fontSize: "13px", color: "#f1f5f9" }}>
                                {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={badgeStyle(statusStyle)}>
                                  {doc.verification_status}
                                </span>
                                {doc.document_file ? (
                                  <a
                                    href={doc.document_file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ ...actionBtnStyle(neutralBtnColors), textDecoration: "none" }}
                                  >
                                    View
                                  </a>
                                ) : (
                                  <span style={{ fontSize: "11px", color: "#475569" }}>No file</span>
                                )}
                                {doc.verification_status === "pending" && (
                                  <button
                                    onClick={() => handleVerifyDocument(doc.id)}
                                    disabled={verifyingDocId === doc.id}
                                    style={{ ...actionBtnStyle(viewBtnColors), opacity: verifyingDocId === doc.id ? 0.6 : 1 }}
                                  >
                                    {verifyingDocId === doc.id ? "Verifying..." : "Verify"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
                      💻 IT Assets
                    </h3>
                    {assets.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>No assets assigned yet</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {assets.map((asset) => {
                          const statusStyle = statusColors[asset.status] || statusColors.pending;
                          return (
                            <div key={asset.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#0f1a2e", border: "0.5px solid #1e293b", borderRadius: "8px" }}>
                              <div>
                                <p style={{ fontSize: "13px", color: "#f1f5f9", margin: "0 0 2px" }}>
                                  {asset.brand} {asset.model_name} <span style={{ color: "#475569" }}>({asset.asset_id})</span>
                                </p>
                                <p style={{ fontSize: "11px", color: "#64748b", margin: 0, textTransform: "capitalize" }}>{asset.category_detail?.name}</p>
                              </div>
                              <span style={{ ...badgeStyle(statusStyle), textTransform: "capitalize" }}>
                                {asset.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
                      ✅ Onboarding Tasks
                    </h3>
                    {tasks.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>No tasks found for this employee</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {tasks.map((task) => {
                          const statusStyle = statusColors[task.status] || statusColors.pending;
                          return (
                            <div key={task.id} style={{ background: "#0f1a2e", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <p style={{ fontSize: "13px", color: "#f1f5f9", margin: "0 0 4px", fontWeight: 500 }}>{task.task_name}</p>
                                <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px" }}>{task.description}</p>
                                <div style={{ display: "flex", gap: "10px" }}>
                                  <span style={{ fontSize: "11px", color: "#475569" }}>Assigned to: {task.assigned_to_role}</span>
                                  {task.due_date && <span style={{ fontSize: "11px", color: "#475569" }}>Due: {task.due_date}</span>}
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                                <span style={badgeStyle(statusStyle)}>
                                  {task.status}
                                </span>
                                {task.status !== "completed" && (
                                  <button
                                    onClick={() => handleTaskStatusUpdate(task.id, task.status === "pending" ? "in_progress" : "completed")}
                                    style={actionBtnStyle(viewBtnColors)}
                                  >
                                    {task.status === "pending" ? "Start" : "Complete"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
                      🕒 Timeline
                    </h3>
                    {timelineEvents.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>No activity recorded yet</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {timelineEvents.map((event, idx) => (
                          <div key={event.id} style={{ display: "flex", gap: "12px" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6", marginTop: "4px", flexShrink: 0 }} />
                              {idx !== timelineEvents.length - 1 && (
                                <div style={{ width: "1px", flex: 1, background: "#1e293b", marginTop: "2px" }} />
                              )}
                            </div>
                            <div style={{ paddingBottom: "4px" }}>
                              <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 2px" }}>
                                {new Date(event.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                              <p style={{ fontSize: "13px", color: "#f1f5f9", margin: 0 }}>{event.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;