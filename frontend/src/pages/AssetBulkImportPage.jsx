import BulkImportPage from './BulkImportPage';

const FORMAT_COLUMNS = [
  {
    name: 'asset_id',
    required: true,
    type: 'Text',
    description: 'Unique, max 20 characters. Not auto-generated during import.',
    example: 'AST101',
  },
  {
    name: 'category',
    required: true,
    type: 'Number',
    description: 'Asset category ID (see Settings > Asset Categories)',
    example: '1',
  },
  { name: 'brand', required: false, type: 'Text', example: 'Dell' },
  { name: 'model_name', required: false, type: 'Text', example: 'Latitude 5440' },
  {
    name: 'serial_number',
    required: false,
    type: 'Text',
    description: 'Must be unique. Used for duplicate detection. Recommended for every asset.',
    example: 'SN-DL5440-0001',
  },
  {
    name: 'status',
    required: false,
    type: 'Text',
    description: 'available | under_repair | lost | retired | reserved. Default: available',
    example: 'available',
  },
  {
    name: 'condition',
    required: false,
    type: 'Text',
    description: 'new | good | fair | damaged. Default: good',
    example: 'good',
  },
  {
    name: 'warranty_expiry_date',
    required: false,
    type: 'Date',
    description: 'Format: YYYY-MM-DD',
    example: '2028-03-31',
  },
  {
    name: 'assigned_to',
    required: false,
    type: 'Number',
    description: 'Employee database ID. Leave blank for unassigned assets',
    example: '',
  },
  {
    name: 'asset_issue_date',
    required: false,
    type: 'Date',
    description: 'Format: YYYY-MM-DD. Only if assigned_to is filled',
    example: '',
  },
  {
    name: 'asset_return_date',
    required: false,
    type: 'Date',
    description: 'Format: YYYY-MM-DD. Leave blank for new assets',
    example: '',
  },
];

const SAMPLE_ROWS = [
  {
    asset_id: 'AST101',
    category: '1',
    brand: 'Dell',
    model_name: 'Latitude 5440',
    serial_number: 'SN-DL5440-0001',
    status: 'available',
    condition: 'good',
    warranty_expiry_date: '2028-03-31',
    assigned_to: '',
    asset_issue_date: '',
    asset_return_date: '',
  },
  {
    asset_id: 'AST102',
    category: '1',
    brand: 'HP',
    model_name: 'ProBook 450 G10',
    serial_number: 'SN-HP450-0002',
    status: 'available',
    condition: 'new',
    warranty_expiry_date: '2027-11-15',
    assigned_to: '',
    asset_issue_date: '',
    asset_return_date: '',
  },
  {
    asset_id: 'AST103',
    category: '2',
    brand: 'LG',
    model_name: 'UltraFine 27UP850',
    serial_number: 'SN-LG27-0003',
    status: 'reserved',
    condition: 'good',
    warranty_expiry_date: '2027-06-30',
    assigned_to: '',
    asset_issue_date: '',
    asset_return_date: '',
  },
  {
    asset_id: 'AST104',
    category: '3',
    brand: 'Samsung',
    model_name: 'Galaxy S23',
    serial_number: 'SN-SGS23-0004',
    status: 'under_repair',
    condition: 'damaged',
    warranty_expiry_date: '2026-12-31',
    assigned_to: '',
    asset_issue_date: '',
    asset_return_date: '',
  },
  {
    asset_id: 'AST105',
    category: '4',
    brand: 'Logitech',
    model_name: 'MX Keys',
    serial_number: 'SN-LGMX-0005',
    status: 'available',
    condition: 'fair',
    warranty_expiry_date: '2028-01-31',
    assigned_to: '',
    asset_issue_date: '',
    asset_return_date: '',
  },
];

const FORMAT_NOTES = [
  'The first row must be the header row, and the column names must match the ones listed above exactly.',
  'Unlike employees, asset IDs are not auto-generated during import. Every row must have a unique asset_id.',
  'If a serial_number already exists in the system, that row will be marked "Duplicate" in the preview.',
  'Dates must be in YYYY-MM-DD format. Leave optional columns empty if not needed.',
  'Statuses such as assigned, pending_acknowledgment and pending_return are set by the assignment workflow. Import assets as unassigned and assign them later from the asset page.',
];

export function AssetBulkImportPage() {
  return (
    <BulkImportPage
      entityLabel="Asset"
      previewEndpoint="/assets/bulk-import/preview/"
      commitEndpoint="/assets/bulk-import/commit/"
      formatColumns={FORMAT_COLUMNS}
      sampleRows={SAMPLE_ROWS}
      formatNotes={FORMAT_NOTES}
    />
  );
}