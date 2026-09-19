import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { statusColors } from "../constants/statusColors";



const ScanPage = () => {
  const { assetId } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAsset();
  }, [assetId]);

  const fetchAsset = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
  `${import.meta.env.VITE_API_BASE_URL || "http://10.245.64.14:8000/api"}/assets/public/${assetId}/`
);
      
      setAsset(res.data);
    } catch (err) {
      setError("Asset not found.");
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    background: "#060b14",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  };

  const cardStyle = {
    background: "#0a1628",
    border: "0.5px solid #1e293b",
    borderRadius: "16px",
    padding: "32px",
    maxWidth: "360px",
    width: "100%",
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "#64748b", fontSize: "14px" }}>Loading asset details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ color: "#fca5a5", fontSize: "14px", textAlign: "center" }}>{error}</p>
        </div>
      </div>
    );
  }

  const statusStyle = statusColors[asset.status] || statusColors.available;

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <p style={{ fontSize: "11px", color: "#64748b", letterSpacing: "0.8px", margin: "0 0 4px" }}>
          MPRW RESEARCH — ASSET
        </p>
        <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#f1f5f9", margin: "0 0 20px" }}>
          {asset.asset_id}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 2px" }}>CATEGORY</p>
            <p style={{ fontSize: "14px", color: "#f1f5f9", margin: 0 }}>{asset.category_name || "—"}</p>
          </div>
          <div>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 2px" }}>MODEL</p>
            <p style={{ fontSize: "14px", color: "#f1f5f9", margin: 0 }}>
              {asset.brand} {asset.model_name}
            </p>
          </div>
<div>
  <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 2px" }}>CURRENT OWNER</p>
  <p style={{ fontSize: "14px", color: "#f1f5f9", margin: 0 }}>
    {asset.assigned_to_name || "Unassigned"}
  </p>
</div>
          <div>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 2px" }}>STATUS</p>
            <span
              style={{
                background: statusStyle.bg,
                color: statusStyle.text,
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "12px",
                display: "inline-block",
              }}
            >
              {asset.status}
            </span>
          </div>
          <div>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 2px" }}>CONDITION</p>
            <p style={{ fontSize: "14px", color: "#f1f5f9", margin: 0 }}>{asset.condition}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanPage;