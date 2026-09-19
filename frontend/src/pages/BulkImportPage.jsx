/*
BulkImportPage.jsx

Reusable CSV bulk-import UI — used for BOTH Employee and Asset imports
by passing different props. Two-step flow matching the backend:
  1. Upload CSV -> POST to previewEndpoint -> shows row-by-row results
  2. Review + decide on duplicates -> POST to commitEndpoint -> shows summary

*** IMPORTANT: update the axiosInstance import path below to match
*** your actual project structure before using this file.
*/

import { useState } from 'react';
import axiosInstance from '../api/axiosInstance'; // <-- UPDATE THIS PATH

const COLORS = {
  background: '#060b14',
  card: '#0a1628',
  primary: '#2563eb',
  border: '#1e293b',
  textPrimary: '#e2e8f0',
  textMuted: '#94a3b8',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#eab308',
};

// entityLabel: "Employee" | "Asset" — used for headings/messages only
// previewEndpoint / commitEndpoint: full API paths, e.g.
//   "/employees/bulk-import/preview/" and "/employees/bulk-import/commit/"
export default function BulkImportPage({ entityLabel, previewEndpoint, commitEndpoint }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);   // response from preview endpoint
  const [decisions, setDecisions] = useState({});  // { rowNumber: "skip"|"update"|"create" }
  const [result, setResult] = useState(null);      // response from commit endpoint
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
    setPreview(null);
    setResult(null);
    setErrorMsg('');
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axiosInstance.post(previewEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(res.data);
      setDecisions({});
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Preview failed. Check the file and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionChange = (rowNumber, value) => {
    setDecisions((prev) => ({ ...prev, [rowNumber]: value }));
  };

  const handleCommit = async () => {
    if (!preview) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axiosInstance.post(commitEndpoint, {
        session_id: preview.session_id,
        row_decisions: decisions,
      });
      setResult(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Import failed. The preview session may have expired — try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setDecisions({});
    setResult(null);
    setErrorMsg('');
  };

  return (
    <div style={{ background: COLORS.background, minHeight: '100vh', padding: '32px', color: COLORS.textPrimary }}>
      <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '4px' }}>
        Bulk {entityLabel} Import
      </h1>
      <p style={{ color: COLORS.textMuted, marginBottom: '24px', fontSize: '14px' }}>
        Upload a CSV file to create multiple {entityLabel.toLowerCase()} records at once.
      </p>

      {errorMsg && (
        <div style={{
          background: '#3f1d1d', border: `1px solid ${COLORS.error}`, color: '#fecaca',
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px',
        }}>
          {errorMsg}
        </div>
      )}

      {/* Step 1: File upload */}
      {!preview && !result && (
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '12px',
          padding: '24px', maxWidth: '520px',
        }}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{
              display: 'block', width: '100%', color: COLORS.textPrimary,
              background: COLORS.background, border: `1px solid ${COLORS.border}`,
              borderRadius: '8px', padding: '10px', marginBottom: '16px', fontSize: '14px',
            }}
          />
          <button
            onClick={handlePreview}
            disabled={!file || loading}
            style={{
              background: !file || loading ? COLORS.border : COLORS.primary,
              color: '#fff', border: 'none', borderRadius: '8px',
              padding: '10px 20px', fontSize: '14px', fontWeight: 500,
              cursor: !file || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Validating...' : 'Preview Import'}
          </button>
        </div>
      )}

      {/* Step 2: Preview results table */}
      {preview && !result && (
        <div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <SummaryChip label="Total rows" value={preview.total_rows} color={COLORS.textPrimary} />
            <SummaryChip label="Valid" value={preview.valid_count} color={COLORS.success} />
            <SummaryChip label="Errors" value={preview.error_count} color={COLORS.error} />
            <SummaryChip label="Duplicates" value={preview.duplicate_count} color={COLORS.warning} />
          </div>

          <div style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '12px',
            overflow: 'hidden', marginBottom: '20px',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: COLORS.background, textAlign: 'left' }}>
                  <th style={thStyle}>Row</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Details</th>
                  <th style={thStyle}>Decision</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.row_number} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <td style={tdStyle}>{row.row_number}</td>
                    <td style={tdStyle}>
                      <StatusBadge status={row.status} />
                    </td>
                    <td style={tdStyle}>
                      {row.status === 'error' && (
                        <span style={{ color: COLORS.error }}>
                          {Object.entries(row.errors).map(([field, msgs]) => `${field}: ${msgs.join(', ')}`).join('; ')}
                        </span>
                      )}
                      {row.status === 'duplicate' && (
                        <span style={{ color: COLORS.warning }}>
                          Matches existing record ({row.matched_id})
                        </span>
                      )}
                      {row.status === 'valid' && (
                        <span style={{ color: COLORS.textMuted }}>Ready to import</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {row.status === 'duplicate' ? (
                        <select
                          value={decisions[row.row_number] || 'skip'}
                          onChange={(e) => handleDecisionChange(row.row_number, e.target.value)}
                          style={{
                            background: COLORS.background, color: COLORS.textPrimary,
                            border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '4px 8px',
                          }}
                        >
                          <option value="skip">Skip</option>
                          <option value="update">Update existing</option>
                          <option value="create">Create anyway</option>
                        </select>
                      ) : (
                        <span style={{ color: COLORS.textMuted }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCommit}
              disabled={loading || preview.valid_count + preview.duplicate_count === 0}
              style={{
                background: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px',
                padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Importing...' : 'Confirm Import'}
            </button>
            <button
              onClick={handleReset}
              style={{
                background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`,
                borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Commit result summary */}
      {result && (
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '12px',
          padding: '24px', maxWidth: '520px',
        }}>
          <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Import complete</h2>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <SummaryChip label="Created" value={result.created} color={COLORS.success} />
            <SummaryChip label="Updated" value={result.updated} color={COLORS.primary} />
            <SummaryChip label="Skipped" value={result.skipped} color={COLORS.textMuted} />
            <SummaryChip label="Failed" value={result.failed_rows.length} color={COLORS.error} />
          </div>
          <button
            onClick={handleReset}
            style={{
              background: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px',
              padding: '10px 20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryChip({ label, value, color }) {
  return (
    <div style={{
      background: '#0a1628', border: '1px solid #1e293b', borderRadius: '8px',
      padding: '10px 16px', minWidth: '90px',
    }}>
      <div style={{ fontSize: '20px', fontWeight: 600, color }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    valid: { bg: '#052e16', color: '#22c55e', label: 'Valid' },
    error: { bg: '#3f1d1d', color: '#ef4444', label: 'Error' },
    duplicate: { bg: '#3f2d0d', color: '#eab308', label: 'Duplicate' },
  };
  const s = map[status] || map.valid;
  return (
    <span style={{
      background: s.bg, color: s.color, padding: '2px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 500,
    }}>
      {s.label}
    </span>
  );
}

const thStyle = { padding: '10px 12px', color: '#94a3b8', fontWeight: 500, fontSize: '12px' };
const tdStyle = { padding: '10px 12px', verticalAlign: 'top' };