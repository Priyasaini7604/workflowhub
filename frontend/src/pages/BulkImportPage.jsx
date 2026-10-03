/*
BulkImportPage.jsx

Reusable CSV bulk-import UI — used for BOTH Employee and Asset imports
by passing different props. Flow matching the backend:
  1. Upload CSV -> POST to previewEndpoint -> shows row-by-row results
  2. Review + decide on duplicates -> POST to commitEndpoint -> shows summary
  Below the upload box: expected file format, downloadable sample CSV,
  and a mock data table showing how the rows should look.

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

// ---- Shared styles ----
const cardStyle = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '10px',
  padding: '18px',
  marginBottom: '16px',
  boxSizing: 'border-box',
  width: '100%',
  minWidth: 0,
};

const scrollBoxStyle = {
  overflowX: 'auto',
  border: `1px solid ${COLORS.border}`,
  borderRadius: '8px',
  maxWidth: '100%',
};

const primaryButton = {
  background: COLORS.primary,
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
};

const thStyle = {
  padding: '8px 10px',
  color: '#94a3b8',
  fontWeight: 500,
  fontSize: '12px',
  whiteSpace: 'nowrap',
};
const tdStyle = { padding: '8px 10px', verticalAlign: 'top' };

// ---- CSV helpers (client-side template generation) ----
const escapeCsv = (value) => {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// If no explicit sampleRows are given, build ONE row from each column's `example`
const resolveSampleRows = (formatColumns, sampleRows) =>
  sampleRows && sampleRows.length > 0
    ? sampleRows
    : [Object.fromEntries(formatColumns.map((c) => [c.name, c.example ?? '']))];

const buildSampleCsv = (formatColumns, sampleRows) => {
  const headers = formatColumns.map((c) => c.name);
  const rows = resolveSampleRows(formatColumns, sampleRows);

  const lines = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(',')),
  ];
  // BOM so Excel opens UTF-8 correctly
  return '\uFEFF' + lines.join('\r\n');
};

const downloadCsv = (csvText, fileName) => {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/*
Props:
  entityLabel      : "Employee" | "Asset" — headings/messages
  previewEndpoint  : e.g. "/employees/bulk-import/preview/"
  commitEndpoint   : e.g. "/employees/bulk-import/commit/"
  formatColumns    : [{ name, required, type, allowed?, description?, example }]
  sampleRows       : optional [{ [columnName]: value }, ...] for the sample table + downloadable template
  formatNotes      : optional [string] extra rules shown under the format table
*/
export default function BulkImportPage({
  entityLabel,
  previewEndpoint,
  commitEndpoint,
  formatColumns = [],
  sampleRows = [],
  formatNotes = [],
}) {
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

  const handleDownloadSample = () => {
    const csv = buildSampleCsv(formatColumns, sampleRows);
    downloadCsv(csv, `${entityLabel.toLowerCase()}_bulk_import_sample.csv`);
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

  const sampleTableRows = resolveSampleRows(formatColumns, sampleRows);

  return (
    <div style={{
      background: COLORS.background, minHeight: '100vh', width: '100%', minWidth: 0,
      boxSizing: 'border-box', padding: '20px', color: COLORS.textPrimary,
    }}>
      <div style={{ maxWidth: '1100px', width: '100%', minWidth: 0, margin: '0 auto' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '2px' }}>
          Bulk {entityLabel} Import
        </h1>
        <p style={{ color: COLORS.textMuted, marginBottom: '16px', fontSize: '13px' }}>
          Upload a CSV file to create multiple {entityLabel.toLowerCase()} records at once.
        </p>

        {errorMsg && (
          <div style={{
            background: '#3f1d1d', border: `1px solid ${COLORS.error}`, color: '#fecaca',
            padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
          }}>
            {errorMsg}
          </div>
        )}

        {/* Step 1: File upload (top) */}
        {!preview && !result && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '2px' }}>
              Upload CSV File
            </h2>
            <p style={{ color: COLORS.textMuted, fontSize: '12px', marginBottom: '12px' }}>
              Select a .csv file that follows the format described below.
            </p>

            <label
              htmlFor="bulk-import-file"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '4px', padding: '18px 12px', marginBottom: '12px', cursor: 'pointer',
                background: COLORS.background, border: `2px dashed ${file ? COLORS.primary : COLORS.border}`,
                borderRadius: '8px', textAlign: 'center', boxSizing: 'border-box', width: '100%',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 500, color: COLORS.textPrimary, wordBreak: 'break-all' }}>
                {file ? file.name : 'Click to choose a CSV file'}
              </span>
              <span style={{ fontSize: '12px', color: COLORS.textMuted }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB — click to change` : 'Only .csv files are supported'}
              </span>
              <input
                id="bulk-import-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>

            <button
              onClick={handlePreview}
              disabled={!file || loading}
              style={{
                ...primaryButton,
                background: !file || loading ? COLORS.border : COLORS.primary,
                cursor: !file || loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Validating...' : 'Preview Import'}
            </button>
          </div>
        )}

        {/* Step 2: Expected format + sample download */}
        {!preview && !result && formatColumns.length > 0 && (
          <div style={cardStyle}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              gap: '12px', flexWrap: 'wrap', marginBottom: '12px',
            }}>
              <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '2px' }}>
                  Expected File Format
                </h2>
                <p style={{ color: COLORS.textMuted, fontSize: '12px' }}>
                  File type: <strong style={{ color: COLORS.textPrimary }}>.csv</strong> (opens in Excel).
                  First row must be the header row with the column names below.
                </p>
              </div>
              <button onClick={handleDownloadSample} style={primaryButton}>
                ⬇ Download Sample CSV
              </button>
            </div>

            <div style={scrollBoxStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: COLORS.background, textAlign: 'left' }}>
                    <th style={thStyle}>Column</th>
                    <th style={thStyle}>Required</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Allowed values / notes</th>
                    <th style={thStyle}>Example</th>
                  </tr>
                </thead>
                <tbody>
                  {formatColumns.map((col) => (
                    <tr key={col.name} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>
                        {col.name}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          color: col.required ? COLORS.error : COLORS.textMuted,
                          fontWeight: col.required ? 600 : 400,
                        }}>
                          {col.required ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: COLORS.textMuted }}>{col.type}</td>
                      <td style={{ ...tdStyle, color: COLORS.textMuted }}>
                        {col.allowed && col.allowed.length > 0 && (
                          <div>{col.allowed.join(' | ')}</div>
                        )}
                        {col.description && <div>{col.description}</div>}
                        {!col.allowed?.length && !col.description && '—'}
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>
                        {col.example === '' || col.example == null ? '—' : String(col.example)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {formatNotes.length > 0 && (
              <ul style={{
                marginTop: '12px', paddingLeft: '18px', color: COLORS.textMuted,
                fontSize: '12px', lineHeight: 1.6,
              }}>
                {formatNotes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Step 3: Mock data table (bottom) */}
        {!preview && !result && formatColumns.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '2px' }}>
              Sample Data
            </h2>
            <p style={{ color: COLORS.textMuted, fontSize: '12px', marginBottom: '12px' }}>
              This is how the rows in your CSV file should look. This data is for reference only and will not be imported.
              Scroll sideways to see all columns.
            </p>

            <div style={scrollBoxStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: COLORS.background, textAlign: 'left' }}>
                    <th style={thStyle}>#</th>
                    {formatColumns.map((col) => (
                      <th key={col.name} style={{ ...thStyle, fontFamily: 'monospace' }}>
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleTableRows.map((row, idx) => (
                    <tr key={idx} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <td style={{ ...tdStyle, color: COLORS.textMuted }}>{idx + 1}</td>
                      {formatColumns.map((col) => (
                        <td key={col.name} style={{ ...tdStyle, color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>
                          {row[col.name] === '' || row[col.name] == null ? '—' : String(row[col.name])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 4: Preview results table */}
        {preview && !result && (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <SummaryChip label="Total rows" value={preview.total_rows} color={COLORS.textPrimary} />
              <SummaryChip label="Valid" value={preview.valid_count} color={COLORS.success} />
              <SummaryChip label="Errors" value={preview.error_count} color={COLORS.error} />
              <SummaryChip label="Duplicates" value={preview.duplicate_count} color={COLORS.warning} />
            </div>

            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
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
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleCommit}
                disabled={loading || preview.valid_count + preview.duplicate_count === 0}
                style={{ ...primaryButton, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Importing...' : 'Confirm Import'}
              </button>
              <button
                onClick={handleReset}
                style={{
                  background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Commit result summary */}
        {result && (
          <div style={{ ...cardStyle, maxWidth: '520px' }}>
            <h2 style={{ fontSize: '15px', marginBottom: '12px' }}>Import complete</h2>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <SummaryChip label="Created" value={result.created} color={COLORS.success} />
              <SummaryChip label="Updated" value={result.updated} color={COLORS.primary} />
              <SummaryChip label="Skipped" value={result.skipped} color={COLORS.textMuted} />
              <SummaryChip label="Failed" value={result.failed_rows.length} color={COLORS.error} />
            </div>
            <button onClick={handleReset} style={primaryButton}>
              Import Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryChip({ label, value, color }) {
  return (
    <div style={{
      background: '#0a1628', border: '1px solid #1e293b', borderRadius: '8px',
      padding: '8px 14px', minWidth: '84px',
    }}>
      <div style={{ fontSize: '18px', fontWeight: 600, color }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{label}</div>
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