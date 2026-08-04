import { useState, useEffect, useMemo } from "react";
import axiosInstance from "../api/axiosInstance";
import { idsMatch } from '../utils/idUtils';

const statusColors = {
  pending: { bg: "#451a03", text: "#f59e0b" },
  in_progress: { bg: "#1e3a5f", text: "#3b82f6" },
  completed: { bg: "#064e3b", text: "#10b981" },
};

// reporting_manager may come back as a plain FK id or a nested object.
const getManagerId = (emp) => {
  if (!emp.reporting_manager) return null;
  return typeof emp.reporting_manager === "object" ? emp.reporting_manager.id : emp.reporting_manager;
};

const ManagerOffboardingPage = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const meRes = await axiosInstance.get("/employees/me/");
      const myId = meRes.data.id;

      const allRes = await axiosInstance.get("/employees/?all=true");
      const allEmployees = allRes.data.results || allRes.data;

      setTeam(allEmployees.filter((emp) => getManagerId(emp) === myId));
    } catch (err) {
      console.error("Failed to load team", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffboardingDetail = async (employeeId) => {
    setDetailLoading(true);
    try {
      const checklistRes = await axiosInstance.get(`/offboarding/${employeeId}/checklist/`);
      setChecklist(checklistRes.data);

      const tasksRes = await axiosInstance.get(`/offboarding/${employeeId}/tasks/`);
      setTasks(tasksRes.data.results || tasksRes.data);
    } catch (err) {
      console.error("Failed to load offboarding detail", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelect = (emp) => {
    setSelectedEmployee(emp);
    fetchOffboardingDetail(emp.id);
  };

  const handleTaskStatusUpdate = async (taskId, newStatus) => {
    try {
      await axiosInstance.patch(`/offboarding/tasks/${taskId}/update/`, {
        status: newStatus,
      });
      // Re-fetch so the checklist reflects the auto-tick that happens
      // server-side once this task is marked completed.
      fetchOffboardingDetail(selectedEmployee.id);
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const filteredTeam = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return team;
    return team.filter(
      (emp) =>
        emp.full_name?.toLowerCase().includes(term) ||
        emp.employee_id?.toLowerCase().includes(term)
    );
  }, [team, search]);

  // Only employees who are actually in the offboarding process (not just
  // "active" team members) are relevant here.
  const offboardingTeam = filteredTeam.filter(
    (emp) => emp.current_status !== "active"
  );

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Team Offboarding</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Track exit progress and complete your sign-off for team members leaving</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "16px" }}>
        {/* Left — team list (only those in offboarding) */}
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "16px", borderBottom: "0.5px solid #1e293b" }}>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 10px" }}>Team Members</p>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              style={{ width: "100%", background: "#0f1a2e", border: "0.5px solid #1e293b", borderRadius: "6px", padding: "8px 10px", fontSize: "12px", color: "#f1f5f9", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <p style={{ color: "#64748b", fontSize: "13px" }}>Loading...</p>
            </div>
          ) : offboardingTeam.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <p style={{ color: "#475569", fontSize: "13px" }}>No team members currently offboarding</p>
            </div>
          ) : (
            offboardingTeam.map((emp) => (
              <div
                key={emp.id}
                onClick={() => handleSelect(emp)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "0.5px solid #1e293b",
                  cursor: "pointer",
                  background: idsMatch(selectedEmployee?.id, emp.id) ? "#1e3a5f" : "transparent",
                }}
              >
                <p style={{ fontSize: "13px", color: "#f1f5f9", margin: 0 }}>{emp.full_name}</p>
                <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>{emp.employee_id} — {emp.current_status}</p>
              </div>
            ))
          )}
        </div>

        {/* Right — checklist + my tasks */}
        <div>
          {!selectedEmployee ? (
            <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "60px", textAlign: "center" }}>
              <p style={{ color: "#64748b", fontSize: "13px" }}>Select a team member to view offboarding progress</p>
            </div>
          ) : detailLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "#64748b", fontSize: "13px" }}>Loading...</p>
            </div>
          ) : (
            <>
              {/* Overall progress */}
              {checklist && (
                <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
                    📋 Overall Offboarding Progress
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {[
                      { label: "Asset Recovery (IT)", value: checklist.asset_recovery_status },
                      { label: "Access Revocation (IT)", value: checklist.access_revocation_status },
                      { label: "Manager Clearance (You)", value: checklist.manager_clearance_status, highlight: true },
                      { label: "HR Clearance", value: checklist.hr_clearance_status },
                      { label: "Final Clearance", value: checklist.final_clearance_status },
                    ].map((item) => (
                      <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: item.value ? "#064e3b" : "#1e293b", border: `0.5px solid ${item.value ? "#10b981" : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {item.value && <span style={{ fontSize: "10px", color: "#10b981" }}>✓</span>}
                        </div>
                        <span style={{ fontSize: "12px", color: item.highlight ? "#f1f5f9" : "#64748b", fontWeight: item.highlight ? 500 : 400 }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: "11px", color: "#475569", margin: "12px 0 0" }}>
                    "Manager Clearance" ticks automatically once you mark your sign-off task below as completed.
                  </p>
                </div>
              )}

              {/* My tasks only (server already scopes this to assigned_to_role='manager') */}
              <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
                  ✅ Your Sign-off Task
                </h3>
                {tasks.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>No task found</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {tasks.map((task) => {
                      const statusStyle = statusColors[task.status] || statusColors.pending;
                      return (
                        <div key={task.id} style={{ background: "#0f1a2e", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                          <div>
                            <p style={{ fontSize: "13px", color: "#f1f5f9", margin: "0 0 4px", fontWeight: 500 }}>{task.task_name}</p>
                            <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>{task.description}</p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                              {task.status}
                            </span>
                            {task.status !== "completed" && (
                              <button
                                onClick={() => handleTaskStatusUpdate(task.id, task.status === "pending" ? "in_progress" : "completed")}
                                style={{ background: "#1e3a5f", color: "#3b82f6", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}
                              >
                                {task.status === "pending" ? "Start" : "Mark Complete"}
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
      </div>
    </div>
  );
};

export default ManagerOffboardingPage;