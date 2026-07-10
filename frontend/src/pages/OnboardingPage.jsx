import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const statusColors = {
  pending: { bg: "#451a03", text: "#f59e0b" },
  in_progress: { bg: "#1e3a5f", text: "#3b82f6" },
  completed: { bg: "#064e3b", text: "#10b981" },
};

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/employees/");
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
      const [tasksResponse, checklistResponse] = await Promise.all([
        axiosInstance.get(`/onboarding/${employeeId}/tasks/`),
        axiosInstance.get(`/onboarding/${employeeId}/checklist/`),
      ]);
      setTasks(tasksResponse.data.results || tasksResponse.data);
      setChecklist(checklistResponse.data);
    } catch (err) {
      console.error("Failed to load onboarding data");
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
      console.error("Failed to update task");
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Onboarding Management</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Track employee onboarding progress</p>
        </div>
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

        {/* Right — Tasks + Checklist */}
        <div>
          {!selectedEmployee ? (
            <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "60px", textAlign: "center" }}>
              <p style={{ color: "#64748b", fontSize: "13px" }}>Select an employee to view onboarding details</p>
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
                  <p style={{ color: "#64748b", fontSize: "13px" }}>Loading onboarding data...</p>
                </div>
              ) : (
                <>
                  {/* Checklist */}
                  {checklist && (
                    <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
                        📋 Onboarding Checklist
                      </h3>

                      {/* Progress Bar */}
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
                        <span style={{ background: statusColors[checklist.background_verification_status]?.bg || "#1e293b", color: statusColors[checklist.background_verification_status]?.text || "#94a3b8", borderRadius: "20px", padding: "2px 10px", fontSize: "11px" }}>
                          {checklist.background_verification_status}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tasks */}
                  <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
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