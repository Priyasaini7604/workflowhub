import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { idsMatch } from '../utils/idUtils';
import { statusColors } from "../constants/statusColors";


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

const DOCUMENT_TYPE_LABELS = {
  resume: "Resume",
  offer_letter: "Offer Letter",
  nda: "NDA",
  aadhaar: "Aadhaar",
  pan: "PAN",
  passport: "Passport",
  educational_certificate: "Educational Certificate",
  experience_certificate: "Experience Certificate",
  policy_acceptance: "Policy Acceptance Form",
  exit_document: "Exit Document",
  other: "Other",
};



const MyProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [documents, setDocuments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    document_type: "pdf",
    document_file: null,
  });
  const [uploading, setUploading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

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
      // Fetch documents & assets
      fetchDocuments(response.data.id);
      fetchAssets(response.data.id);
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (empId) => {
    try {
      const response = await axiosInstance.get(`/documents/${empId}/list/`);
      setDocuments(response.data.results || response.data);
    } catch (err) {
      console.error("Failed to load documents");
    }
  };

  const fetchAssets = async (empId) => {
    try {
      const response = await axiosInstance.get("/assets/");
      const allAssets = response.data.results || response.data;
      setAssets(allAssets.filter((a) => idsMatch(a.assigned_to?.id, empId)));
    } catch (err) {
      console.error("Failed to load assets");
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
      await axiosInstance.patch("/employees/me/", {
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        blood_group: formData.blood_group || null,
        personal_email: formData.personal_email,
        mobile_number: formData.mobile_number,
        alternate_mobile_number: formData.alternate_mobile_number,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_number: formData.emergency_contact_number,
        emergency_contact_relationship: formData.emergency_contact_relationship,
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formDataObj = new FormData();
    formDataObj.append("profile_photo", file);
    try {
      await axiosInstance.patch("/employees/me/", formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Profile photo updated!");
      fetchProfile();
    } catch (err) {
      setError("Failed to upload photo");
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.document_file) return;
    setUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append("employee", profile.id);
      formDataObj.append("document_type", uploadData.document_type);
      formDataObj.append("document_file", uploadData.document_file);
      await axiosInstance.post("/documents/create/", formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowUploadForm(false);
      setUploadData({ document_type: "resume", document_file: null });
      fetchDocuments(profile.id);
      setSuccess("Document uploaded successfully!");
    } catch (err) {
      setError("Failed to upload document");
    } finally {
      setUploading(false);
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

  const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" };
  const fieldLabel = { fontSize: "11px", color: "#64748b", margin: "0 0 4px", letterSpacing: "0.8px" };
  const fieldValue = { fontSize: "13px", color: "#f1f5f9", margin: 0 };

  const tabStyle = (tab) => ({
    padding: "8px 20px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    borderRadius: "8px",
    background: activeTab === tab ? "#2563eb" : "#0a1628",
    color: activeTab === tab ? "#eff6ff" : "#64748b",
  });

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
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>My Profile</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>View and update your information</p>
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
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: "72px", height: "72px", background: "#1e3a5f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "28px", color: "#3b82f6", fontWeight: 500 }}>
                {profile.first_name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <label style={{ position: "absolute", bottom: 0, right: 0, width: "22px", height: "22px", background: "#2563eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <span style={{ fontSize: "12px", color: "white" }}>✏️</span>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
          </label>
        </div>
        <div style={{ flex: 1 }}>
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
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button style={tabStyle("profile")} onClick={() => setActiveTab("profile")}>👤 Profile</button>
        <button style={tabStyle("documents")} onClick={() => setActiveTab("documents")}>📄 Documents</button>
        <button style={tabStyle("assets")} onClick={() => setActiveTab("assets")}>💻 My Assets</button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <>
          {/* Employment Info — Read Only */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>💼 Employment Information </h3>
            <div style={gridStyle}>
              <div><p style={fieldLabel}>OFFICIAL EMAIL</p><p style={fieldValue}>{profile.official_email || "—"}</p></div>
              <div><p style={fieldLabel}>DATE OF JOINING</p><p style={fieldValue}>{profile.date_of_joining || "—"}</p></div>
              <div><p style={fieldLabel}>WORK MODE</p><p style={fieldValue}>{profile.work_mode || "—"}</p></div>
              <div><p style={fieldLabel}>EMPLOYEE TYPE</p><p style={fieldValue}>{profile.employee_type || "—"}</p></div>
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
                      {GENDER_CHOICES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>DATE OF BIRTH</label>
                    <input name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>BLOOD GROUP</label>
                    <select name="blood_group" value={formData.blood_group} onChange={handleChange} style={inputStyle}>
                      <option value="">Select</option>
                      {BLOOD_GROUP_CHOICES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
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

              <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                <button type="button" onClick={() => setIsEditing(false)}
                  style={{ padding: "12px 24px", background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", color: "#64748b", fontSize: "13px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: "12px 24px", background: saving ? "#1e3a5f" : "#2563eb", border: "none", borderRadius: "8px", color: "#eff6ff", fontSize: "13px", fontWeight: 500, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div style={sectionStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: 0 }}>👤 Personal Information</h3>
                  <button onClick={() => setIsEditing(true)}
                    style={{ background: "#2563eb", color: "#eff6ff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
                    ✏️ Edit
                  </button>
                </div>
                <div style={gridStyle}>
                  <div><p style={fieldLabel}>GENDER</p><p style={fieldValue}>{profile.gender || "—"}</p></div>
                  <div><p style={fieldLabel}>DATE OF BIRTH</p><p style={fieldValue}>{profile.date_of_birth || "—"}</p></div>
                  <div><p style={fieldLabel}>BLOOD GROUP</p><p style={fieldValue}>{profile.blood_group || "—"}</p></div>
                  <div><p style={fieldLabel}>PERSONAL EMAIL</p><p style={fieldValue}>{profile.personal_email || "—"}</p></div>
                  <div><p style={fieldLabel}>MOBILE NUMBER</p><p style={fieldValue}>{profile.mobile_number || "—"}</p></div>
                  <div><p style={fieldLabel}>ALTERNATE MOBILE</p><p style={fieldValue}>{profile.alternate_mobile_number || "—"}</p></div>
                </div>
              </div>

              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>🚨 Emergency Contact</h3>
                <div style={gridStyle}>
                  <div><p style={fieldLabel}>NAME</p><p style={fieldValue}>{profile.emergency_contact_name || "—"}</p></div>
                  <div><p style={fieldLabel}>NUMBER</p><p style={fieldValue}>{profile.emergency_contact_number || "—"}</p></div>
                  <div><p style={fieldLabel}>RELATIONSHIP</p><p style={fieldValue}>{profile.emergency_contact_relationship || "—"}</p></div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div style={sectionStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: 0 }}>📄 My Documents ({documents.length})</h3>
            <button onClick={() => setShowUploadForm(!showUploadForm)}
              style={{ background: "#2563eb", color: "#eff6ff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
              + Upload Document
            </button>
          </div>

          {showUploadForm && (
            <div style={{ background: "#0f1a2e", border: "0.5px solid #1e293b", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
              <form onSubmit={handleDocumentUpload}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={labelStyle}>DOCUMENT TYPE</label>
                    <select value={uploadData.document_type}
                      onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                      style={inputStyle}>
                      {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>FILE</label>
                    <input type="file"
                      onChange={(e) => setUploadData({ ...uploadData, document_file: e.target.files[0] })}
                      style={{ ...inputStyle, padding: "8px 14px" }} required />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={() => setShowUploadForm(false)}
                    style={{ padding: "8px 16px", background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", color: "#64748b", fontSize: "13px", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={uploading}
                    style={{ padding: "8px 16px", background: uploading ? "#1e3a5f" : "#2563eb", border: "none", borderRadius: "8px", color: "#eff6ff", fontSize: "13px", fontWeight: 500, cursor: uploading ? "not-allowed" : "pointer" }}>
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {documents.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>No documents uploaded yet</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                  <th style={{ padding: "12px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>DOCUMENT TYPE</th>
                  <th style={{ padding: "12px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>STATUS</th>
                  <th style={{ padding: "12px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>UPLOADED</th>
                  <th style={{ padding: "12px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>VIEW</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const statusStyle = statusColors[doc.verification_status] || statusColors.pending;
                  return (
                    <tr key={doc.id} style={{ borderBottom: "0.5px solid #1e293b" }}>
                      <td style={{ padding: "12px 0", fontSize: "13px", color: "#f1f5f9" }}>
                        {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </td>
                      <td style={{ padding: "12px 0" }}>
                        <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                          {doc.verification_status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 0", fontSize: "12px", color: "#64748b" }}>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 0" }}>
                        {doc.document_file && (
                          <a href={doc.document_file} target="_blank" rel="noreferrer"
                            style={{ background: "#1e3a5f", color: "#3b82f6", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", textDecoration: "none" }}>
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Assets Tab */}
      {activeTab === "assets" && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>💻 My Assigned Assets</h3>
          {assets.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>No assets assigned</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                  <th style={{ padding: "12px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ASSET ID</th>
                  <th style={{ padding: "12px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>TYPE</th>
                  <th style={{ padding: "12px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>BRAND / MODEL</th>
                  <th style={{ padding: "12px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ISSUE DATE</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} style={{ borderBottom: "0.5px solid #1e293b" }}>
                    <td style={{ padding: "12px 0", fontSize: "12px", color: "#64748b" }}>{asset.asset_id}</td>
                    <td style={{ padding: "12px 0", fontSize: "12px", color: "#64748b" }}>{asset.asset_type}</td>
                    <td style={{ padding: "12px 0", fontSize: "13px", color: "#f1f5f9" }}>{asset.brand} {asset.model_name}</td>
                    <td style={{ padding: "12px 0", fontSize: "12px", color: "#64748b" }}>{asset.asset_issue_date || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default MyProfilePage;