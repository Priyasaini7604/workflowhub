import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

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

const BLOOD_GROUP_CHOICES = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
];

const EditEmployeePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");             // general (non-field) errors only
  const [fieldErrors, setFieldErrors] = useState({});  // 👈 naya — field-wise errors
  const [managers, setManagers] = useState([]);
  const [originalEmployee, setOriginalEmployee] = useState(null); // 👈 Issue #2 fix ke liye

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    date_of_birth: "",
    blood_group: "",
    personal_email: "",
    official_email: "",
    mobile_number: "",
    alternate_mobile_number: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
    emergency_contact_relationship: "",
    designation: "",
    department: "",
    date_of_joining: "",
    employee_type: "permanent",
    work_mode: "office",
    reporting_manager: "",
    confirmation_date: "",
    probation_end_date: "",
  });

  useEffect(() => {
    fetchEmployee();
    fetchManagers();
  }, [id]);

  const fetchEmployee = async () => {
    setFetchLoading(true);
    try {
      const response = await axiosInstance.get(`/employees/${id}/`);
      const emp = response.data;
      setOriginalEmployee(emp); // poora object save kar lo — Issue #2 fix
      setFormData({
        first_name: emp.first_name || "",
        middle_name: emp.middle_name || "",
        last_name: emp.last_name || "",
        gender: emp.gender || "",
        date_of_birth: emp.date_of_birth || "",
        blood_group: emp.blood_group || "",
        personal_email: emp.personal_email || "",
        official_email: emp.official_email || "",
        mobile_number: emp.mobile_number || "",
        alternate_mobile_number: emp.alternate_mobile_number || "",
        emergency_contact_name: emp.emergency_contact_name || "",
        emergency_contact_number: emp.emergency_contact_number || "",
        emergency_contact_relationship: emp.emergency_contact_relationship || "",
        designation: emp.designation || "",
        department: emp.department || "",
        date_of_joining: emp.date_of_joining || "",
        employee_type: emp.employee_type || "permanent",
        work_mode: emp.work_mode || "office",
        reporting_manager: emp.reporting_manager || "",
        confirmation_date: emp.confirmation_date || "",
        probation_end_date: emp.probation_end_date || "",
      });
    } catch (err) {
      setError("Failed to load employee data");
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axiosInstance.get("/employees/");
      setManagers(response.data.results || response.data);
    } catch (err) {
      console.error("Failed to fetch managers");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Jaise hi user field change kare, uska purana error hata do
    if (fieldErrors[name]) {
      const updated = { ...fieldErrors };
      delete updated[name];
      setFieldErrors(updated);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const cleanedData = {
        ...formData,
        user: originalEmployee?.user,
        employee_id: originalEmployee?.employee_id,
        date_of_birth: formData.date_of_birth || null,
        confirmation_date: formData.confirmation_date || null,
        probation_end_date: formData.probation_end_date || null,
        reporting_manager: formData.reporting_manager || null,
      };

      await axiosInstance.put(`/employees/${id}/update/`, cleanedData);
      navigate(`/employees/${id}`);

    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        setFieldErrors(data);
        setError("Please fix the highlighted fields below.");
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

  const inputErrorStyle = {
    ...inputStyle,
    border: "0.5px solid #dc2626",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 500,
    color: "#64748b",
    marginBottom: "6px",
    letterSpacing: "0.8px",
  };

  const fieldErrorTextStyle = {
    color: "#fca5a5",
    fontSize: "11px",
    marginTop: "4px",
    marginBottom: 0,
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

  // Har field ke neeche uska specific error dikhane ka helper
  const renderFieldError = (fieldName) => {
    if (!fieldErrors[fieldName]) return null;
    const msg = Array.isArray(fieldErrors[fieldName])
      ? fieldErrors[fieldName][0]
      : fieldErrors[fieldName];
    return <p style={fieldErrorTextStyle}>{msg}</p>;
  };

  if (fetchLoading) return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <p style={{ color: "#64748b", fontSize: "13px" }}>Loading...</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button
          onClick={() => navigate(`/employees/${id}`)}
          style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "8px 12px", color: "#64748b", fontSize: "12px", cursor: "pointer" }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Edit Employee</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Update employee information</p>
        </div>
      </div>

      {/* General error — ab sirf summary/fallback ke liye */}
      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* Section 1 — Personal Info */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>👤 Personal Information</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>FIRST NAME *</label>
              <input
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                style={fieldErrors.first_name ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("first_name")}
            </div>
            <div>
              <label style={labelStyle}>MIDDLE NAME</label>
              <input
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
                style={fieldErrors.middle_name ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("middle_name")}
            </div>
            <div>
              <label style={labelStyle}>LAST NAME *</label>
              <input
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                style={fieldErrors.last_name ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("last_name")}
            </div>
            <div>
              <label style={labelStyle}>GENDER</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                style={fieldErrors.gender ? inputErrorStyle : inputStyle}
              >
                <option value="">Select Gender</option>
                {GENDER_CHOICES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
              {renderFieldError("gender")}
            </div>
            <div>
              <label style={labelStyle}>DATE OF BIRTH</label>
              <input
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
                style={fieldErrors.date_of_birth ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("date_of_birth")}
            </div>
            <div>
              <label style={labelStyle}>BLOOD GROUP</label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                style={fieldErrors.blood_group ? inputErrorStyle : inputStyle}
              >
                <option value="">Select Blood Group</option>
                {BLOOD_GROUP_CHOICES.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
              {renderFieldError("blood_group")}
            </div>
          </div>
        </div>

        {/* Section 2 — Contact Info */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>📞 Contact Information</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>PERSONAL EMAIL</label>
              <input
                name="personal_email"
                type="email"
                value={formData.personal_email}
                onChange={handleChange}
                style={fieldErrors.personal_email ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("personal_email")}
            </div>
            <div>
              <label style={labelStyle}>OFFICIAL EMAIL</label>
              <input
                name="official_email"
                type="email"
                value={formData.official_email}
                onChange={handleChange}
                style={fieldErrors.official_email ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("official_email")}
            </div>
            <div>
              <label style={labelStyle}>MOBILE NUMBER</label>
              <input
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleChange}
                style={fieldErrors.mobile_number ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("mobile_number")}
            </div>
            <div>
              <label style={labelStyle}>ALTERNATE MOBILE</label>
              <input
                name="alternate_mobile_number"
                value={formData.alternate_mobile_number}
                onChange={handleChange}
                style={fieldErrors.alternate_mobile_number ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("alternate_mobile_number")}
            </div>
          </div>
        </div>

        {/* Section 3 — Emergency Contact */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>🚨 Emergency Contact</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>NAME</label>
              <input
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                style={fieldErrors.emergency_contact_name ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("emergency_contact_name")}
            </div>
            <div>
              <label style={labelStyle}>NUMBER</label>
              <input
                name="emergency_contact_number"
                value={formData.emergency_contact_number}
                onChange={handleChange}
                style={fieldErrors.emergency_contact_number ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("emergency_contact_number")}
            </div>
            <div>
              <label style={labelStyle}>RELATIONSHIP</label>
              <input
                name="emergency_contact_relationship"
                value={formData.emergency_contact_relationship}
                onChange={handleChange}
                style={fieldErrors.emergency_contact_relationship ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("emergency_contact_relationship")}
            </div>
          </div>
        </div>

        {/* Section 4 — Employment Info */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>💼 Employment Information</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>DESIGNATION *</label>
              <input
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
                style={fieldErrors.designation ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("designation")}
            </div>
            <div>
              <label style={labelStyle}>DEPARTMENT *</label>
              <input
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                style={fieldErrors.department ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("department")}
            </div>
            <div>
              <label style={labelStyle}>DATE OF JOINING *</label>
              <input
                name="date_of_joining"
                type="date"
                value={formData.date_of_joining}
                onChange={handleChange}
                required
                style={fieldErrors.date_of_joining ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("date_of_joining")}
            </div>
            <div>
              <label style={labelStyle}>EMPLOYEE TYPE</label>
              <select
                name="employee_type"
                value={formData.employee_type}
                onChange={handleChange}
                style={fieldErrors.employee_type ? inputErrorStyle : inputStyle}
              >
                {EMPLOYEE_TYPE_CHOICES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {renderFieldError("employee_type")}
            </div>
            <div>
              <label style={labelStyle}>WORK MODE</label>
              <select
                name="work_mode"
                value={formData.work_mode}
                onChange={handleChange}
                style={fieldErrors.work_mode ? inputErrorStyle : inputStyle}
              >
                {WORK_MODE_CHOICES.map((w) => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
              {renderFieldError("work_mode")}
            </div>
            <div>
              <label style={labelStyle}>REPORTING MANAGER</label>
              <select
                name="reporting_manager"
                value={formData.reporting_manager}
                onChange={handleChange}
                style={fieldErrors.reporting_manager ? inputErrorStyle : inputStyle}
              >
                <option value="">Select Manager</option>
                {managers.filter(m => m.id !== parseInt(id)).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} — {m.designation}
                  </option>
                ))}
              </select>
              {renderFieldError("reporting_manager")}
            </div>
            <div>
              <label style={labelStyle}>CONFIRMATION DATE</label>
              <input
                name="confirmation_date"
                type="date"
                value={formData.confirmation_date}
                onChange={handleChange}
                style={fieldErrors.confirmation_date ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("confirmation_date")}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={() => navigate(`/employees/${id}`)}
            style={{ padding: "12px 24px", background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", color: "#64748b", fontSize: "13px", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: "12px 24px", background: loading ? "#1e3a5f" : "#2563eb", border: "none", borderRadius: "8px", color: "#eff6ff", fontSize: "13px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditEmployeePage;