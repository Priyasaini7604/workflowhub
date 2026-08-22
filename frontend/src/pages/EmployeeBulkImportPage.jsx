import BulkImportPage from './BulkImportPage';

export function EmployeeBulkImportPage() {
  return (
    <BulkImportPage
      entityLabel="Employee"
      previewEndpoint="/employees/bulk-import/preview/"
      commitEndpoint="/employees/bulk-import/commit/"
    />
  );
}