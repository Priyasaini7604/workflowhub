import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";

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

const MyProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    gender: "",
    date_of_birth: "",
    blood_group: "",
    personal_email: "",
    mobile_number: "",
    alternate_mobile_number: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
    emergency_contact_relationship: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
  setLoading(true);
  try {
    const response = await axiosInstance.get("/employees/me/");
    setProfile(response.data);
    setFormData({
      gender: response.data.gender || "",
      date_of_birth: response.data.date_of_birth || "",
      blood_group: response.data.blood_group || "",
      personal_email: response.data.personal_email || "",
      mobile_number: response.data.mobile_number || "",
      alternate_mobile_number: response.data.alternate_mobile_number || "",
      emergency_contact_name: response.data.emergency_contact_name || "",
      emergency_contact_number: response.data.emergency_contact_number || "",
      emergency_contact_relationship: response.data.emergency_contact_relationship || "",
    });
  } catch (err) {
    setError("Failed to load profile");
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const empResponse = await axiosInstance.get(`/employees/${profile.id}/`);
      const emp = empResponse.data;

      await axiosInstance.put(`/employees/${profile.id}/update/`, {
        ...formData,
        user: emp.user,
        employee_id: emp.employee_id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        designation: emp.designation,
        department: emp.department,
        date_of_joining: emp.date_of_joining,
        date_of_birth: formData.date_of_birth || null,
        reporting_manager: emp.reporting_manager || null,
      });

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
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

  const fieldLabel = { fontSize: "11px", color: "#64748b", margin: "0 0 4px", letterSpacing: "0.8px" };
  const fieldValue = { fontSize: "13px", color: "#f1f5f9", margin: 0 };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <p style={{ color: "#64748b", fontSize: "13px" }}>Loading profile...</p>
    </div>
  );

  if (!profile) return (
    <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px" }}>
      <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>Profile not found. Please contact HR.</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>My Profile</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>View and update your personal information</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          style={{ background: isEditing ? "#0a1628" : "#2563eb", color: isEditing ? "#64748b" : "#eff6ff", border: isEditing ? "0.5px solid #1e293b" : "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
        >
          {isEditing ? "Cancel" : "✏️ Edit Profile"}
        </button>
      </div>

      {/* Success */}
      {success && (
        <div style={{ background: "#064e3b", border: "0.5px solid #10b981", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#10b981", margin: 0 }}>{success}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Profile Card */}
      <div style={{ ...sectionStyle, display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ width: "64px", height: "64px", background: "#1e3a5f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "24px", color: "#3b82f6", fontWeight: 500 }}>
            {profile.first_name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>
            {profile.first_name} {profile.middle_name} {profile.last_name}
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 8px" }}>
            {profile.designation} — {profile.department}
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <span style={{ background: "#064e3b", color: "#10b981", borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
              {profile.current_status}
            </span>
            <span style={{ fontSize: "12px", color: "#475569" }}>{profile.employee_id}</span>
            <span style={{ fontSize: "12px", color: "#475569" }}>{profile.employee_type}</span>
          </div>
        </div>
      </div>

      {/* Employment Info — Read Only */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>💼 Employment Information</h3>
        <div style={gridStyle}>
          <div>
            <p style={fieldLabel}>OFFICIAL EMAIL</p>
            <p style={fieldValue}>{profile.official_email || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>DATE OF JOINING</p>
            <p style={fieldValue}>{profile.date_of_joining || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>WORK MODE</p>
            <p style={fieldValue}>{profile.work_mode || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>REPORTING MANAGER</p>
            <p style={fieldValue}>{profile.reporting_manager || "—"}</p>
          </div>
        </div>
      </div>

      {/* Personal Info — Editable */}
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>👤 Personal Information</h3>
            <div style={gridStyle}>
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
              <div>
                <label style={labelStyle}>BLOOD GROUP</label>
                <select name="blood_group" value={formData.blood_group} onChange={handleChange} style={inputStyle}>
                  <option value="">Select Blood Group</option>
                  {BLOOD_GROUP_CHOICES.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>PERSONAL EMAIL</label>
                <input name="personal_email" type="email" value={formData.personal_email} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>MOBILE NUMBER</label>
                <input name="mobile_number" value={formData.mobile_number} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>ALTERNATE MOBILE</label>
                <input name="alternate_mobile_number" value={formData.alternate_mobile_number} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>🚨 Emergency Contact</h3>
            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>NAME</label>
                <input name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>NUMBER</label>
                <input name="emergency_contact_number" value={formData.emergency_contact_number} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>RELATIONSHIP</label>
                <input name="emergency_contact_relationship" value={formData.emergency_contact_relationship} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ padding: "12px 24px", background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", color: "#64748b", fontSize: "13px", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: "12px 24px", background: saving ? "#1e3a5f" : "#2563eb", border: "none", borderRadius: "8px", color: "#eff6ff", fontSize: "13px", fontWeight: 500, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>👤 Personal Information</h3>
            <div style={gridStyle}>
              <div>
                <p style={fieldLabel}>GENDER</p>
                <p style={fieldValue}>{profile.gender || "—"}</p>
              </div>
              <div>
                <p style={fieldLabel}>DATE OF BIRTH</p>
                <p style={fieldValue}>{profile.date_of_birth || "—"}</p>
              </div>
              <div>
                <p style={fieldLabel}>BLOOD GROUP</p>
                <p style={fieldValue}>{profile.blood_group || "—"}</p>
              </div>
              <div>
                <p style={fieldLabel}>PERSONAL EMAIL</p>
                <p style={fieldValue}>{profile.personal_email || "—"}</p>
              </div>
              <div>
                <p style={fieldLabel}>MOBILE NUMBER</p>
                <p style={fieldValue}>{profile.mobile_number || "—"}</p>
              </div>
              <div>
                <p style={fieldLabel}>ALTERNATE MOBILE</p>
                <p style={fieldValue}>{profile.alternate_mobile_number || "—"}</p>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>🚨 Emergency Contact</h3>
            <div style={gridStyle}>
              <div>
                <p style={fieldLabel}>NAME</p>
                <p style={fieldValue}>{profile.emergency_contact_name || "—"}</p>
              </div>
              <div>
                <p style={fieldLabel}>NUMBER</p>
                <p style={fieldValue}>{profile.emergency_contact_number || "—"}</p>
              </div>
              <div>
                <p style={fieldLabel}>RELATIONSHIP</p>
                <p style={fieldValue}>{profile.emergency_contact_relationship || "—"}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyProfilePage;