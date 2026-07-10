import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const ASSET_TYPE_CHOICES = [
  { value: "laptop", label: "Laptop" },
  { value: "monitor", label: "Monitor" },
  { value: "keyboard", label: "Keyboard" },
  { value: "mouse", label: "Mouse" },
  { value: "headset", label: "Headset" },
  { value: "mobile", label: "Mobile Device" },
  { value: "other", label: "Other" },
];

const CONDITION_CHOICES = [
  { value: "new", label: "New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "damaged", label: "Damaged" },
];

const AddAssetPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    asset_type: "laptop",
    brand: "",
    model_name: "",
    serial_number: "",
    condition: "new",
    warranty_expiry_date: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axiosInstance.post("/assets/create/", {
        ...formData,
        warranty_expiry_date: formData.warranty_expiry_date || null,
        
      });
      navigate("/assets");
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
          onClick={() => navigate("/assets")}
          style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "8px 12px", color: "#64748b", fontSize: "12px", cursor: "pointer" }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Add Asset</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Add new IT asset to inventory</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* Section 1 — Asset Info */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>💻 Asset Information</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>ASSET TYPE *</label>
              <select name="asset_type" value={formData.asset_type} onChange={handleChange} style={inputStyle}>
                {ASSET_TYPE_CHOICES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>BRAND</label>
              <input name="brand" value={formData.brand} onChange={handleChange} style={inputStyle} placeholder="Dell, HP, Apple..." />
            </div>
            <div>
              <label style={labelStyle}>MODEL NAME</label>
              <input name="model_name" value={formData.model_name} onChange={handleChange} style={inputStyle} placeholder="Inspiron 15, MacBook Pro..." />
            </div>
            <div>
              <label style={labelStyle}>SERIAL NUMBER</label>
              <input name="serial_number" value={formData.serial_number} onChange={handleChange} style={inputStyle} placeholder="SN123456789" />
            </div>
          </div>
        </div>

        {/* Section 2 — Condition & Warranty */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>🔧 Condition & Warranty</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>CONDITION</label>
              <select name="condition" value={formData.condition} onChange={handleChange} style={inputStyle}>
                {CONDITION_CHOICES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>WARRANTY EXPIRY DATE</label>
              <input name="warranty_expiry_date" type="date" value={formData.warranty_expiry_date} onChange={handleChange} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={() => navigate("/assets")}
            style={{ padding: "12px 24px", background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", color: "#64748b", fontSize: "13px", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: "12px 24px", background: loading ? "#1e3a5f" : "#2563eb", border: "none", borderRadius: "8px", color: "#eff6ff", fontSize: "13px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Adding..." : "Add Asset"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddAssetPage;