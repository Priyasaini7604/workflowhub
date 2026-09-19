import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const AssetCategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", asset_id_prefix: "" });
  const [submitting, setSubmitting] = useState(false);
  const [archivingId, setArchivingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/master-data/categories/");
      setCategories(res.data);
    } catch (err) {
      setError("Failed to load asset categories");
    } finally {
      setLoading(false);
    }
  };

  // auto-generate a lowercase, no-space code from the display name
  const handleNameChange = (e) => {
    const name = e.target.value;
    const code = name.trim().toLowerCase().replace(/\s+/g, "_");
    setFormData((prev) => ({ ...prev, name, code }));
  };

  // uppercase, max-5-char prefix used for physical Asset ID generation (e.g. "CHG")
  const handlePrefixChange = (e) => {
    const value = e.target.value.toUpperCase().slice(0, 5);
    setFormData((prev) => ({ ...prev, asset_id_prefix: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await axiosInstance.post("/master-data/categories/", formData);
      setFormData({ name: "", code: "", asset_id_prefix: "" });
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const firstKey = Object.keys(data)[0];
        const firstError = data[firstKey];
        setError(`${firstKey}: ${Array.isArray(firstError) ? firstError[0] : firstError}`);
      } else {
        setError("Failed to create category");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (categoryId, categoryName) => {
    if (!window.confirm(`Archive "${categoryName}"? It will no longer appear in Add Asset dropdowns.`)) return;
    setArchivingId(categoryId);
    try {
      await axiosInstance.patch(`/master-data/categories/${categoryId}/archive/`, {});
      fetchCategories();
    } catch (err) {
      setError("Failed to archive category");
    } finally {
      setArchivingId(null);
    }
  };

  const sectionStyle = {
    background: "#0a1628",
    border: "0.5px solid #1e293b",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "16px",
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

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "8px 12px", color: "#64748b", fontSize: "12px", cursor: "pointer" }}
          >
            ← Back
          </button>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Asset Categories</h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Manage asset category master data</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: "#2563eb", color: "#eff6ff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
        >
          {showForm ? "Cancel" : "+ Add Category"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Add Category Form */}
      {showForm && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
            ➕ New Category
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>CATEGORY NAME *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  style={inputStyle}
                  placeholder="e.g. Adapter, Charger, Webcam"
                />
              </div>
              <div>
                <label style={labelStyle}>CODE (auto-generated)</label>
                <input
                  name="code"
                  value={formData.code}
                  readOnly
                  style={{ ...inputStyle, color: "#64748b", cursor: "not-allowed" }}
                />
              </div>
              <div>
                <label style={labelStyle}>ASSET ID PREFIX *</label>
                <input
                  name="asset_id_prefix"
                  value={formData.asset_id_prefix}
                  onChange={handlePrefixChange}
                  required
                  maxLength={5}
                  style={inputStyle}
                  placeholder="e.g. CHG, WBC"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{ background: submitting ? "#1e3a5f" : "#2563eb", color: "#eff6ff", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 500, cursor: submitting ? "not-allowed" : "pointer" }}
            >
              {submitting ? "Saving..." : "Save Category"}
            </button>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
          📦 All Categories
        </h3>
        {loading ? (
          <p style={{ fontSize: "13px", color: "#64748b" }}>Loading...</p>
        ) : categories.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#475569" }}>No categories yet — add one above.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#0f1a2e", border: "0.5px solid #1e293b", borderRadius: "8px" }}
              >
                <div>
                  <p style={{ fontSize: "13px", color: "#f1f5f9", margin: "0 0 2px", fontWeight: 500 }}>{cat.name}</p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
                    code: {cat.code} · prefix: {cat.asset_id_prefix || "—"}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      background: cat.is_active ? "#064e3b" : "#1e293b",
                      color: cat.is_active ? "#10b981" : "#64748b",
                      borderRadius: "20px",
                      padding: "3px 10px",
                      fontSize: "11px",
                    }}
                  >
                    {cat.is_active ? "active" : "inactive"}
                  </span>
                  <button
                    onClick={() => handleArchive(cat.id, cat.name)}
                    disabled={archivingId === cat.id}
                    style={{ background: "#450a0a", color: "#fca5a5", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "11px", cursor: "pointer", opacity: archivingId === cat.id ? 0.6 : 1 }}
                  >
                    {archivingId === cat.id ? "Archiving..." : "Archive"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetCategoriesPage;