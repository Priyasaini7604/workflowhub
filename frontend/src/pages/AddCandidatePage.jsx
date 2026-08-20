import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const AddCandidatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    personal_email: "",
    mobile_number: "",
    designation: "",
    department: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axiosInstance.post("/employees/candidates/create/", formData);
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
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Add Candidate</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Minimal intake — no login account is created at this stage
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>👤 Candidate Information</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>FIRST NAME *</label>
              <input name="first_name" value={formData.first_name} onChange={handleChange} required style={inputStyle} placeholder="Riya" />
            </div>
            <div>
              <label style={labelStyle}>LAST NAME *</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} required style={inputStyle} placeholder="Sharma" />
            </div>
            <div>
              <label style={labelStyle}>MIDDLE NAME</label>
              <input name="middle_name" value={formData.middle_name} onChange={handleChange} style={inputStyle} placeholder="Optional" />
            </div>
            <div>
              <label style={labelStyle}>PERSONAL EMAIL</label>
              <input
                name="personal_email"
                type="email"
                value={formData.personal_email}
                onChange={handleChange}
                style={inputStyle}
                placeholder="riya.sharma@gmail.com"
              />
            </div>
            <div>
              <label style={labelStyle}>MOBILE NUMBER</label>
              <input name="mobile_number" value={formData.mobile_number} onChange={handleChange} style={inputStyle} placeholder="9876543210" />
            </div>
            <div>
              <label style={labelStyle}>APPLIED DESIGNATION</label>
              <input name="designation" value={formData.designation} onChange={handleChange} style={inputStyle} placeholder="Software Developer" />
            </div>
            <div>
              <label style={labelStyle}>DEPARTMENT</label>
              <input name="department" value={formData.department} onChange={handleChange} style={inputStyle} placeholder="Engineering" />
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
            {loading ? "Adding..." : "Add Candidate"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCandidatePage;