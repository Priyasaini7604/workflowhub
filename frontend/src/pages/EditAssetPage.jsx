import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const STATUS_CHOICES = [
  { value: "available", label: "Available" },
  { value: "assigned", label: "Assigned" },
  { value: "under_repair", label: "Under Repair" },
  {value: "lost", label : "Lost"},
  {value: "reserved" , label : "Reserved"},
  { value: "retired", label: "Retired" },
];

const EditAssetPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");           // general (non-field) errors only
  const [fieldErrors, setFieldErrors] = useState({}); // 👈 naya — field-wise errors
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    asset_id: "",
    asset_type: "laptop",
    brand: "",
    model_name: "",
    serial_number: "",
    condition: "good",
    status: "available",
    warranty_expiry_date: "",
    assigned_to: "",
    asset_issue_date: "",
    asset_return_date: "",
  });

  useEffect(() => {
    fetchAsset();
    fetchEmployees();
    fetchCategories();
  }, [id]);

  const fetchAsset = async () => {
    setFetchLoading(true);
    try {
      const response = await axiosInstance.get(`/assets/${id}/`);
      const asset = response.data;
      setFormData({
        asset_id: asset.asset_id,
        category: asset.category || "",
        asset_type: asset.asset_type || "laptop",
        brand: asset.brand || "",
        model_name: asset.model_name || "",
        serial_number: asset.serial_number || "",
        condition: asset.condition || "good",
        status: asset.status || "available",
        warranty_expiry_date: asset.warranty_expiry_date || "",
        assigned_to: asset.assigned_to?.id ?? "",
        asset_issue_date: asset.asset_issue_date || "",
        asset_return_date: asset.asset_return_date || "",
      });
    } catch (err) {
      setError("Failed to load asset data");
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get("/employees/");
      setEmployees(response.data.results || response.data);
    } catch (err) {
      console.error("Failed to fetch employees");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Jaise hi user field ko change kare, uska purana error hata do
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
        warranty_expiry_date: formData.warranty_expiry_date || null,
        asset_issue_date: formData.asset_issue_date || null,
        asset_return_date: formData.asset_return_date || null,
        assigned_to: formData.assigned_to || null,
      };

      await axiosInstance.put(`/assets/${id}/update/`, cleanedData);
      navigate(`/assets/${id}`);
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
  const [categories, setCategories] = useState([]);

const fetchCategories = async () => {
  try {
    const response = await axiosInstance.get("/master-data/categories/");
    setCategories(response.data.results || response.data);
  } catch (err) {
    console.error("Failed to fetch categories");
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

  // Ek chhota helper — field error dikhane ke liye
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
          onClick={() => navigate(`/assets/${id}`)}
          style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "8px 12px", color: "#64748b", fontSize: "12px", cursor: "pointer" }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Edit Asset</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Update asset information</p>
        </div>
      </div>

      {/* General error — ab sirf summary/fallback ke liye */}
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
              <select
                name="asset_type"
                value={formData.asset_type}
                onChange={handleChange}
                style={fieldErrors.asset_type ? inputErrorStyle : inputStyle}
              >
                {ASSET_TYPE_CHOICES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {renderFieldError("asset_type")}
            </div>
            <div>
  <label style={labelStyle}>CATEGORY *</label>
  <select
    name="category"
    value={formData.category}
    onChange={handleChange}
    style={fieldErrors.category ? inputErrorStyle : inputStyle}
  >
    <option value="">Select Category</option>
    {categories.map((cat) => (
      <option key={cat.id} value={cat.id}>
        {cat.name}
      </option>
    ))}
  </select>
  {renderFieldError("category")}
</div>
            <div>
              <label style={labelStyle}>BRAND</label>
              <input
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                style={fieldErrors.brand ? inputErrorStyle : inputStyle}
                placeholder="Dell, HP, Apple..."
              />
              {renderFieldError("brand")}
            </div>
            <div>
              <label style={labelStyle}>MODEL NAME</label>
              <input
                name="model_name"
                value={formData.model_name}
                onChange={handleChange}
                style={fieldErrors.model_name ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("model_name")}
            </div>
            <div>
              <label style={labelStyle}>SERIAL NUMBER</label>
              <input
                value={formData.serial_number}
                style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }}
                readOnly
              />
              {renderFieldError("serial_number")}
            </div>
            <div>
              <label style={labelStyle}>CONDITION</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                style={fieldErrors.condition ? inputErrorStyle : inputStyle}
              >
                {CONDITION_CHOICES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {renderFieldError("condition")}
            </div>
            <div>
              <label style={labelStyle}>STATUS</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={fieldErrors.status ? inputErrorStyle : inputStyle}
              >
                {STATUS_CHOICES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {renderFieldError("status")}
            </div>
            <div>
              <label style={labelStyle}>WARRANTY EXPIRY DATE</label>
              <input
                name="warranty_expiry_date"
                type="date"
                value={formData.warranty_expiry_date}
                onChange={handleChange}
                style={fieldErrors.warranty_expiry_date ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("warranty_expiry_date")}
            </div>

            {/* Agar backend "category" naam ki alag field maangta hai,
                ye field yahan add karni hogi — abhi form isse capture
                nahi kar raha, isliye 400 error aa raha hai. */}
            {fieldErrors.category && (
              <div>
                <label style={labelStyle}>CATEGORY *</label>
                <p style={fieldErrorTextStyle}>{Array.isArray(fieldErrors.category) ? fieldErrors.category[0] : fieldErrors.category}</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2 — Assignment Info */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>👤 Assignment Information</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>ASSIGN TO EMPLOYEE</label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                style={fieldErrors.assigned_to ? inputErrorStyle : inputStyle}
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name
                      ? `${emp.full_name} — ${emp.designation}`
                      : `${emp.employee_id} — ${emp.designation}`
                    }
                  </option>
                ))}
              </select>
              {renderFieldError("assigned_to")}
            </div>
            <div>
              <label style={labelStyle}>ISSUE DATE</label>
              <input
                name="asset_issue_date"
                type="date"
                value={formData.asset_issue_date}
                onChange={handleChange}
                style={fieldErrors.asset_issue_date ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("asset_issue_date")}
            </div>
            <div>
              <label style={labelStyle}>RETURN DATE</label>
              <input
                name="asset_return_date"
                type="date"
                value={formData.asset_return_date}
                onChange={handleChange}
                style={fieldErrors.asset_return_date ? inputErrorStyle : inputStyle}
              />
              {renderFieldError("asset_return_date")}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={() => navigate(`/assets/${id}`)}
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

export default EditAssetPage;