import { useNavigate } from "react-router-dom";

// This documents the permission rules already enforced in the Django backend
// (permission classes like IsITAdminOrSuperAdmin, IsHROrManagerOrSuperAdmin,
// role checks in get_queryset(), etc.) in one readable place. It is
// read-only by design — permissions themselves are still changed in code,
// not from this screen.
const ACCESS_MATRIX = [
  {
    feature: "View Employees",
    superadmin: true,
    hr: true,
    it: false,
    manager: "Team only",
    employee: "Self only",
  },
  {
    feature: "Add / Edit Employees",
    superadmin: true,
    hr: true,
    it: false,
    manager: false,
    employee: false,
  },
  {
    feature: "Manage Assets (add/edit/assign)",
    superadmin: true,
    hr: false,
    it: true,
    manager: false,
    employee: false,
  },
  {
    feature: "View Assets",
    superadmin: true,
    hr: false,
    it: true,
    manager: "Team only",
    employee: "Own only",
  },
  {
    feature: "Manage Asset Categories",
    superadmin: true,
    hr: false,
    it: true,
    manager: false,
    employee: false,
  },
  {
    feature: "Verify / Reject Documents",
    superadmin: true,
    hr: true,
    it: false,
    manager: false,
    employee: false,
  },
  {
    feature: "Grant / Revoke Software Access",
    superadmin: true,
    hr: false,
    it: true,
    manager: false,
    employee: false,
  },
  {
    feature: "Onboarding Tasks",
    superadmin: true,
    hr: "HR tasks only",
    it: "IT tasks only",
    manager: "Own task only",
    employee: false,
  },
  {
    feature: "Offboarding Tasks",
    superadmin: true,
    hr: "HR tasks only",
    it: "IT tasks only",
    manager: "Own task only",
    employee: false,
  },
  {
    feature: "Approvals Center",
    superadmin: "All items",
    hr: "Docs + HR tasks",
    it: "IT tasks + assets",
    manager: "Manager tasks",
    employee: false,
  },
  {
    feature: "Audit Logs",
    superadmin: true,
    hr: false,
    it: false,
    manager: false,
    employee: false,
  },
  {
    feature: "Reports",
    superadmin: true,
    hr: true,
    it: true,
    manager: false,
    employee: false,
  },
  {
    feature: "User Management (activate/deactivate)",
    superadmin: true,
    hr: true,
    it: false,
    manager: false,
    employee: false,
  },
];

const ROLES = [
  { key: "superadmin", label: "Super Admin" },
  { key: "hr", label: "HR" },
  { key: "it", label: "IT Admin" },
  { key: "manager", label: "Manager" },
  { key: "employee", label: "Employee" },
];

const AccessCell = ({ value }) => {
  if (value === true) {
    return <span style={{ color: "#10b981", fontSize: "15px" }}>✓</span>;
  }
  if (value === false) {
    return <span style={{ color: "#475569", fontSize: "15px" }}>—</span>;
  }
  // partial/conditional access — show the descriptive string
  return (
    <span style={{ fontSize: "11px", color: "#f59e0b", background: "#451a03", borderRadius: "12px", padding: "3px 8px" }}>
      {value}
    </span>
  );
};

const AccessMatrixPage = () => {
  const navigate = useNavigate();

  const sectionStyle = {
    background: "#0a1628",
    border: "0.5px solid #1e293b",
    borderRadius: "12px",
    overflow: "hidden",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>
            Access Control Matrix
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Reference of what each role can access across the system
          </p>
        </div>
        <button
          onClick={() => navigate("/users")}
          style={{ background: "#2563eb", color: "#eff6ff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
        >
          Manage Users →
        </button>
      </div>

      {/* Note */}
      <div style={{ background: "#0f1a2e", border: "0.5px solid #1e3a5f", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px" }}>
        <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
          ℹ️ This is a read-only reference — it reflects the permission rules enforced in the backend.
          To change a role's actual access, an IT Admin/developer updates the corresponding permission logic in code.
        </p>
      </div>

      {/* Matrix Table */}
      <div style={sectionStyle}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                <th style={{ textAlign: "left", padding: "14px 16px", fontSize: "11px", color: "#64748b", letterSpacing: "0.8px" }}>FEATURE</th>
                {ROLES.map((r) => (
                  <th key={r.key} style={{ textAlign: "center", padding: "14px 16px", fontSize: "11px", color: "#64748b", letterSpacing: "0.8px" }}>
                    {r.label.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ACCESS_MATRIX.map((row, idx) => (
                <tr key={row.feature} style={{ borderBottom: idx !== ACCESS_MATRIX.length - 1 ? "0.5px solid #1e293b" : "none" }}>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#f1f5f9" }}>{row.feature}</td>
                  {ROLES.map((r) => (
                    <td key={r.key} style={{ padding: "12px 16px", textAlign: "center" }}>
                      <AccessCell value={row[r.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccessMatrixPage;