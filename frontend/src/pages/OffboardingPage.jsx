import { useState, useEffect, useMemo } from "react";
import axiosInstance from "../api/axiosInstance";
import { getEmployeeDocuments, verifyDocument } from "../api/documents";
import { getAuditLogs } from "../api/auditLogs";

const statusColors = {
  pending: { bg: "#451a03", text: "#f59e0b" },
  in_progress: { bg: "#1e3a5f", text: "#3b82f6" },
  completed: { bg: "#064e3b", text: "#10b981" },
  scheduled: { bg: "#1e3a5f", text: "#3b82f6" },
  waived: { bg: "#1e293b", text: "#94a3b8" },
  verified: { bg: "#064e3b", text: "#10b981" },
  rejected: { bg: "#450a0a", text: "#ef4444" },
};

const DOCUMENT_TYPE_LABELS = {
  exit_document: "Exit Document",
  other: "Other",
};

// Only these document types are relevant to the offboarding stage —
// everything else (resume, aadhaar, etc.) belongs to onboarding.
const OFFBOARDING_DOCUMENT_TYPES = ["exit_document", "other"];

const OffboardingPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [verifyingDocId, setVerifyingDocId] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/employees/");
      setEmployees(response.data.results || response.data);
    } catch (err) {
      console.error("Failed to load employees", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffboardingData = async (employeeId) => {
    setTasksLoading(true);
    try {
      // Checklist first — its get_or_create() on the backend bulk-creates the
      // default offboarding tasks the very first time. Awaiting it separately
      // avoids a race where tasks/ resolves before those default rows exist.
      const checklistResponse = await axiosInstance.get(`/offboarding/${employeeId}/checklist/`);
      setChecklist(checklistResponse.data);

      const [tasksResponse, documentsResponse, auditLogsResponse] = await Promise.all([
        axiosInstance.get(`/offboarding/${employeeId}/tasks/`),
        getEmployeeDocuments(employeeId),
        getAuditLogs(),
      ]);
      setTasks(tasksResponse.data.results || tasksResponse.data);

      const allDocs = documentsResponse.data.results || documentsResponse.data;
      const offboardingDocs = allDocs.filter((doc) =>
        OFFBOARDING_DOCUMENT_TYPES.includes(doc.document_type)
      );
      setDocuments(offboardingDocs);

      // Audit log endpoint returns ALL logs system-wide; filtered client-side below
      setAuditLogs(auditLogsResponse.data.results || auditLogsResponse.data);
    } catch (err) {
      console.error("Failed to load offboarding data", err);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleEmployeeClick = (emp) => {
    setSelectedEmployee(emp);
    fetchOffboardingData(emp.id);
  };

  const handleTaskStatusUpdate = async (taskId, newStatus) => {
    try {
      await axiosInstance.patch(`/offboarding/tasks/${taskId}/update/`, {
        status: newStatus,
      });
      fetchOffboardingData(selectedEmployee.id);
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const handleVerifyDocument = async (documentId) => {
    setVerifyingDocId(documentId);
    try {
      await verifyDocument(documentId);
      fetchOffboardingData(selectedEmployee.id);
    } catch (err) {
      console.error("Failed to verify document", err);
    } finally {
      setVerifyingDocId(null);
    }
  };

  // Filter employee list by name or employee_id as HR types in the search box
  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter(
      (emp) =>
        emp.full_name?.toLowerCase().includes(term) ||
        emp.employee_id?.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  // Derive this employee's timeline by matching audit logs (model_name + object_id)
  // against the specific record IDs we already fetched for the selected employee.
  const timelineEvents = useMemo(() => {
    if (!auditLogs.length) return [];
    const taskIds = tasks.map((t) => t.id);
    const documentIds = documents.map((d) => d.id);
    const checklistId = checklist?.id;

    return auditLogs
      .filter((log) => {
        if (log.model_name === "OffboardingTask") return taskIds.includes(log.object_id);
        if (log.model_name === "OffboardingChecklist") return log.object_id === checklistId;
        if (log.model_name === "Document") return documentIds.includes(log.object_id);
        return false;
      })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [auditLogs, tasks, documents, checklist]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Offboarding Management</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Track employee offboarding progress</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px" }}>

        {/* Left — Employee List */}
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
                    background: selectedEmployee?.id === emp.id ? "#1e3a5f" : "transparent",
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

        {/* Right — Checklist + Documents + Tasks + Timeline */}
        <div>
          {!selectedEmployee ? (
            <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "60px", textAlign: "center" }}>
              <p style={{ color: "#64748b", fontSize: "13px" }}>Select an employee to view offboarding details</p>
            </div>
          ) : (
            <div>
              {/* Employee Header */}
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
                  <p style={{ color: "#64748b", fontSize: "13px" }}>Loading offboarding data...</p>
                </div>
              ) : (
                <>
                  {/* Checklist */}
                  {checklist && (
                    <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
                        📋 Offboarding Checklist
                      </h3>

                      <div style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>Completion</span>
                          <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 500 }}>{checklist.offboarding_completion_percentage}%</span>
                        </div>
                        <div style={{ background: "#1e293b", borderRadius: "4px", height: "6px" }}>
                          <div style={{ background: "#10b981", borderRadius: "4px", height: "6px", width: `${checklist.offboarding_completion_percentage}%` }} />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                        <div>
                          <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px", letterSpacing: "0.8px" }}>EXIT REASON</p>
                          <p style={{ fontSize: "13px", color: "#f1f5f9", margin: 0, textTransform: "capitalize" }}>{checklist.exit_reason || "—"}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px", letterSpacing: "0.8px" }}>RESIGNATION DATE</p>
                          <p style={{ fontSize: "13px", color: "#f1f5f9", margin: 0 }}>{checklist.resignation_date || "—"}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px", letterSpacing: "0.8px" }}>EXIT INTERVIEW</p>
                          <span style={{ background: statusColors[checklist.exit_interview_status]?.bg || "#1e293b", color: statusColors[checklist.exit_interview_status]?.text || "#94a3b8", borderRadius: "20px", padding: "2px 10px", fontSize: "11px" }}>
                            {checklist.exit_interview_status}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        {[
                          { label: "Asset Recovery", value: checklist.asset_recovery_status },
                          { label: "Access Revocation", value: checklist.access_revocation_status },
                          { label: "Manager Clearance", value: checklist.manager_clearance_status },
                          { label: "HR Clearance", value: checklist.hr_clearance_status },
                          { label: "Final Clearance", value: checklist.final_clearance_status },
                        ].map((item) => (
                          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: item.value ? "#064e3b" : "#1e293b", border: `0.5px solid ${item.value ? "#10b981" : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {item.value && <span style={{ fontSize: "10px", color: "#10b981" }}>✓</span>}
                            </div>
                            <span style={{ fontSize: "12px", color: item.value ? "#f1f5f9" : "#64748b" }}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exit Documents — only exit_document/other types, not onboarding docs */}
                  <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
                      📄 Exit Documents
                    </h3>
                    {documents.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>No exit documents uploaded yet</p>
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
                                <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                                  {doc.verification_status}
                                </span>
                                {doc.document_file ? (
                                  <a
                                    href={doc.document_file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ background: "#1e293b", color: "#94a3b8", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", textDecoration: "none" }}
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
                                    style={{ background: "#1e3a5f", color: "#3b82f6", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer", opacity: verifyingDocId === doc.id ? 0.6 : 1 }}
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

                  {/* Tasks */}
                  <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
                      ✅ Offboarding Tasks
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
                                <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                                  {task.status}
                                </span>
                                {task.status !== "completed" && (
                                  <button
                                    onClick={() => handleTaskStatusUpdate(task.id, task.status === "pending" ? "in_progress" : "completed")}
                                    style={{ background: "#1e3a5f", color: "#3b82f6", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}
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

                  {/* Timeline — derived from Audit Logs, filtered client-side to this employee's records */}
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

export default OffboardingPage;