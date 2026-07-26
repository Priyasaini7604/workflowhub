import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

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
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [formData, setFormData] = useState({
    category: "",
    brand: "",
    model_name: "",
    serial_number: "",
    condition: "new",
    warranty_expiry_date: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await axiosInstance.get("/master-data/categories/");
      const activeCategories = res.data.filter((c) => c.is_active);
      setCategories(activeCategories);
      // default select first category once loaded
      if (activeCategories.length > 0) {
        setFormData((prev) => ({ ...prev, category: activeCategories[0].id }));
      }
    } catch (err) {
      setError("Failed to load asset categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

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
              <label style={labelStyle}>ASSET CATEGORY *</label>
              {categoriesLoading ? (
                <p style={{ fontSize: "12px", color: "#64748b" }}>Loading categories...</p>
              ) : (
                <select name="category" value={formData.category} onChange={handleChange} required style={inputStyle}>
                  {categories.length === 0 && <option value="">No categories available</option>}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
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