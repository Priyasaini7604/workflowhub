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

const BLOOD_GROUP_CHOICES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
  (b) => ({ value: b, label: b })
);

// Ye stages me employee ke paas designation/department/joining date nahi hoti
const PRE_EMPLOYMENT_STATUSES = ["candidate", "offer_sent"];

const EditEmployeePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(""); // general / unmapped errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [managers, setManagers] = useState([]);
  const [originalEmployee, setOriginalEmployee] = useState(null);

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

  const isPreEmployment = PRE_EMPLOYMENT_STATUSES.includes(
    originalEmployee?.current_status
  );

  useEffect(() => {
    fetchEmployee();
    fetchManagers();
  }, [id]);

  const fetchEmployee = async () => {
    setFetchLoading(true);
    try {
      const response = await axiosInstance.get(`/employees/${id}/`);
      const emp = response.data;
      setOriginalEmployee(emp);
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
      const response = await axiosInstance.get("/employees/?all=true");
      setManagers(response.data.results || response.data);
    } catch (err) {
      console.error("Failed to fetch managers");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // ---------- Form layout config ----------
  const sections = [
    {
      title: "👤 Personal Information",
      fields: [
        { name: "first_name", label: "FIRST NAME", required: true },
        { name: "middle_name", label: "MIDDLE NAME" },
        { name: "last_name", label: "LAST NAME", required: true },
        { name: "gender", label: "GENDER", select: GENDER_CHOICES, placeholder: "Select Gender" },
        { name: "date_of_birth", label: "DATE OF BIRTH", type: "date" },
        { name: "blood_group", label: "BLOOD GROUP", select: BLOOD_GROUP_CHOICES, placeholder: "Select Blood Group" },
      ],
    },
    {
      title: "📞 Contact Information",
      fields: [
        { name: "personal_email", label: "PERSONAL EMAIL", type: "email" },
        { name: "official_email", label: "OFFICIAL EMAIL", type: "email" },
        { name: "mobile_number", label: "MOBILE NUMBER" },
        { name: "alternate_mobile_number", label: "ALTERNATE MOBILE" },
      ],
    },
    {
      title: "🚨 Emergency Contact",
      fields: [
        { name: "emergency_contact_name", label: "NAME" },
        { name: "emergency_contact_number", label: "NUMBER" },
        { name: "emergency_contact_relationship", label: "RELATIONSHIP" },
      ],
    },
    {
      title: "💼 Employment Information",
      fields: [
        { name: "designation", label: "DESIGNATION", requiredForEmployee: true },
        { name: "department", label: "DEPARTMENT", requiredForEmployee: true },
        { name: "date_of_joining", label: "DATE OF JOINING", type: "date", requiredForEmployee: true },
        { name: "employee_type", label: "EMPLOYEE TYPE", select: EMPLOYEE_TYPE_CHOICES },
        { name: "work_mode", label: "WORK MODE", select: WORK_MODE_CHOICES },
        { name: "reporting_manager", label: "REPORTING MANAGER", manager: true },
        { name: "confirmation_date", label: "CONFIRMATION DATE", type: "date" },
      ],
    },
  ];

  const knownFieldNames = new Set([
    ...sections.flatMap((s) => s.fields.map((f) => f.name)),
    "probation_end_date",
  ]);

  const toMessage = (val) =>
    Array.isArray(val) ? val.join(" ") : typeof val === "string" ? val : JSON.stringify(val);

  // ---------- Submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      // user / employee_id system-managed hain — edit form se kabhi nahi bhejte
      const cleanedData = {
        ...formData,
        designation: formData.designation || null,
        department: formData.department || null,
        date_of_joining: formData.date_of_joining || null,
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

        // Jo errors kisi visible input se map nahi hote, unko banner me naam ke saath dikhao
        const unmapped = Object.entries(data)
          .filter(([key]) => !knownFieldNames.has(key))
          .map(([key, val]) =>
            key === "non_field_errors" || key === "detail"
              ? toMessage(val)
              : `${key}: ${toMessage(val)}`
          );

        const hasMappedErrors = Object.keys(data).some((k) => knownFieldNames.has(k));
        const parts = [];
        if (hasMappedErrors) parts.push("Please fix the highlighted fields below.");
        parts.push(...unmapped);
        setError(parts.join(" | ") || "Something went wrong. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  // ---------- Styles ----------
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

  const inputErrorStyle = { ...inputStyle, border: "0.5px solid #dc2626" };

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

  // ---------- Renderers ----------
  const renderFieldError = (fieldName) => {
    if (!fieldErrors[fieldName]) return null;
    const msg = Array.isArray(fieldErrors[fieldName])
      ? fieldErrors[fieldName][0]
      : toMessage(fieldErrors[fieldName]);
    return <p style={fieldErrorTextStyle}>{msg}</p>;
  };

  const renderField = (f) => {
    const isRequired = f.required || (f.requiredForEmployee && !isPreEmployment);
    const style = fieldErrors[f.name] ? inputErrorStyle : inputStyle;

    let control;
    if (f.manager) {
      control = (
        <select name={f.name} value={formData[f.name]} onChange={handleChange} style={style}>
          <option value="">Select Manager</option>
          {managers
            .filter((m) => m.id !== parseInt(id))
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} — {m.designation}
              </option>
            ))}
        </select>
      );
    } else if (f.select) {
      control = (
        <select name={f.name} value={formData[f.name]} onChange={handleChange} style={style}>
          {f.placeholder && <option value="">{f.placeholder}</option>}
          {f.select.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    } else {
      control = (
        <input
          name={f.name}
          type={f.type || "text"}
          value={formData[f.name]}
          onChange={handleChange}
          required={isRequired}
          style={style}
        />
      );
    }

    return (
      <div key={f.name}>
        <label style={labelStyle}>
          {f.label}
          {isRequired ? " *" : ""}
        </label>
        {control}
        {renderFieldError(f.name)}
      </div>
    );
  };

  if (fetchLoading)
    return (
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

      {/* Error banner */}
      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {sections.map((section) => (
          <div key={section.title} style={sectionStyle}>
            <h3 style={sectionTitleStyle}>{section.title}</h3>
            <div style={gridStyle}>{section.fields.map(renderField)}</div>
          </div>
        ))}

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