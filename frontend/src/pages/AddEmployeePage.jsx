import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const ROLE_CHOICES = [
  { value: "employee", label: "Employee" },
  { value: "hr_admin", label: "HR Admin" },
  { value: "it_manager", label: "IT Manager" },
  { value: "manager", label: "Manager" },
  { value: "superadmin", label: "Super Admin" },
];

const EMPLOYEE_TYPE_CHOICES = [
  { value: "permanent", label: "Permanent" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
];

const WORK_MODE_CHOICES = [
  { value: "office", label: "Office" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

const GENDER_CHOICES = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const AddEmployeePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [managers, setManagers] = useState([]);

  const [formData, setFormData] = useState({
    // Account fields
    username: "",
    official_email: "",
    role: "employee",
    // Personal fields
    first_name: "",
    last_name: "",
    personal_email: "",
    mobile_number: "",
    gender: "",
    date_of_birth: "",
    // Employment fields
    designation: "",
    department: "",
    date_of_joining: "",
    employee_type: "permanent",
    work_mode: "office",
    reporting_manager: "",
  });

  useEffect(() => {
    // Existing employees fetch karo reporting manager ke liye
    const fetchManagers = async () => {
      try {
        const response = await axiosInstance.get("/employees/");
        setManagers(response.data.results || response.data);
      } catch (err) {
        console.error("Failed to fetch managers");
      }
    };
    fetchManagers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1 — User account banao
      const userResponse = await axiosInstance.post("/users/register/", {
        username: formData.username,
        email: formData.official_email,
        password: "TempPass@123",  // backend override karega
        role: formData.role,
      });

      const userId = userResponse.data.id;

      // Step 2 — Employee profile banao
      await axiosInstance.post("/employees/create/", {
        user: userId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        personal_email: formData.personal_email,
        official_email: formData.official_email,
        mobile_number: formData.mobile_number,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth || null,
        designation: formData.designation,
        department: formData.department,
        date_of_joining: formData.date_of_joining,
        employee_type: formData.employee_type,
        work_mode: formData.work_mode,
        reporting_manager: formData.reporting_manager || null,
        employee_id: "AUTO",  // backend override karega
      });

      navigate("/employees");

    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const firstKey = Object.keys(data)[0];
        const firstError = data[firstKey];
        setError(`${firstKey}: ${Array.isArray(firstError) ? firstError[0] : firstError}`);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
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

  const sectionTitleStyle = {
    fontSize: "14px",
    fontWeight: 500,
    color: "#f1f5f9",
    margin: "0 0 20px",
    paddingBottom: "12px",
    borderBottom: "0.5px solid #1e293b",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button
          onClick={() => navigate("/employees")}
          style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "8px 12px", color: "#64748b", fontSize: "12px", cursor: "pointer" }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Add Employee</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Create new employee account</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* Section 1 — Account Info */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>🔐 Account Information</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>USERNAME *</label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="kavita_saini"
                autoComplete="off"
              />
            </div>
            <div>
              <label style={labelStyle}>OFFICIAL EMAIL *</label>
              <input
                name="official_email"
                type="email"
                value={formData.official_email}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="kavita@mprw.com"
              />
            </div>
            <div>
              <label style={labelStyle}>ROLE *</label>
              <select name="role" value={formData.role} onChange={handleChange} style={inputStyle}>
                {ROLE_CHOICES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2 — Personal Info */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>👤 Personal Information</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>FIRST NAME *</label>
              <input name="first_name" value={formData.first_name} onChange={handleChange} required style={inputStyle} placeholder="Kavita" />
            </div>
            <div>
              <label style={labelStyle}>LAST NAME *</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} required style={inputStyle} placeholder="Saini" />
            </div>
            <div>
              <label style={labelStyle}>PERSONAL EMAIL *</label>
              <input
                name="personal_email"
                type="email"
                value={formData.personal_email}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="kavita@gmail.com"
              />
            </div>
            <div>
              <label style={labelStyle}>MOBILE NUMBER</label>
              <input name="mobile_number" value={formData.mobile_number} onChange={handleChange} style={inputStyle} placeholder="9876543210" />
            </div>
            <div>
              <label style={labelStyle}>GENDER</label>
              <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
                <option value="">Select Gender</option>
                {GENDER_CHOICES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>DATE OF BIRTH</label>
              <input name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Section 3 — Employment Info */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>💼 Employment Information</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>DESIGNATION *</label>
              <input name="designation" value={formData.designation} onChange={handleChange} required style={inputStyle} placeholder="Software Developer" />
            </div>
            <div>
              <label style={labelStyle}>DEPARTMENT *</label>
              <input name="department" value={formData.department} onChange={handleChange} required style={inputStyle} placeholder="Engineering" />
            </div>
            <div>
              <label style={labelStyle}>DATE OF JOINING *</label>
              <input name="date_of_joining" type="date" value={formData.date_of_joining} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>EMPLOYEE TYPE</label>
              <select name="employee_type" value={formData.employee_type} onChange={handleChange} style={inputStyle}>
                {EMPLOYEE_TYPE_CHOICES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>WORK MODE</label>
              <select name="work_mode" value={formData.work_mode} onChange={handleChange} style={inputStyle}>
                {WORK_MODE_CHOICES.map((w) => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>REPORTING MANAGER</label>
              <select name="reporting_manager" value={formData.reporting_manager} onChange={handleChange} style={inputStyle}>
                <option value="">Select Manager</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name} — {m.designation}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={() => navigate("/employees")}
            style={{ padding: "12px 24px", background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", color: "#64748b", fontSize: "13px", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: "12px 24px", background: loading ? "#1e3a5f" : "#2563eb", border: "none", borderRadius: "8px", color: "#eff6ff", fontSize: "13px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Creating..." : "Create Employee"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddEmployeePage;