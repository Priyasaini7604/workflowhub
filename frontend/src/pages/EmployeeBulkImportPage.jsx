import BulkImportPage from './BulkImportPage';

const FORMAT_COLUMNS = [
  { name: 'first_name', required: true, type: 'Text', example: 'Aarav' },
  { name: 'last_name', required: true, type: 'Text', example: 'Sharma' },
  {
    name: 'personal_email',
    required: true,
    type: 'Email',
    description: 'Used for duplicate detection',
    example: 'aarav.sharma@example.com',
  },
  { name: 'mobile_number', required: true, type: 'Text', example: '9876543210' },
  { name: 'designation', required: true, type: 'Text', example: 'Software Engineer' },
  { name: 'department', required: true, type: 'Text', example: 'Engineering' },
  // TODO: add optional columns here based on CandidateCreateSerializer
];

const SAMPLE_ROWS = [
  {
    first_name: 'Aarav',
    last_name: 'Sharma',
    personal_email: 'aarav.sharma@example.com',
    mobile_number: '9876543210',
    designation: 'Software Engineer',
    department: 'Engineering',
  },
  {
    first_name: 'Diya',
    last_name: 'Verma',
    personal_email: 'diya.verma@example.com',
    mobile_number: '9123456780',
    designation: 'HR Executive',
    department: 'Human Resources',
  },
  {
    first_name: 'Rohan',
    last_name: 'Gupta',
    personal_email: 'rohan.gupta@example.com',
    mobile_number: '9988776655',
    designation: 'IT Support Engineer',
    department: 'IT',
  },
  {
    first_name: 'Meera',
    last_name: 'Iyer',
    personal_email: 'meera.iyer@example.com',
    mobile_number: '9012345678',
    designation: 'Finance Analyst',
    department: 'Finance',
  },
  {
    first_name: 'Kabir',
    last_name: 'Singh',
    personal_email: 'kabir.singh@example.com',
    mobile_number: '9345678901',
    designation: 'Product Designer',
    department: 'Design',
  },
];

const FORMAT_NOTES = [
  'The first row must be the header row, and the column names must match the ones listed above exactly.',
  'Every employee is imported at the Candidate stage. The Employee ID and login account are created at the joining stage.',
  'If a personal_email already exists in the system, that row will be marked "Duplicate" in the preview.',
];

export function EmployeeBulkImportPage() {
  return (
    <BulkImportPage
      entityLabel="Employee"
      previewEndpoint="/employees/bulk-import/preview/"
      commitEndpoint="/employees/bulk-import/commit/"
      formatColumns={FORMAT_COLUMNS}
      sampleRows={SAMPLE_ROWS}
      formatNotes={FORMAT_NOTES}
    />
  );
}