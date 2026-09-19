import BulkImportPage from './BulkImportPage';

export function AssetBulkImportPage() {
  return (
    <BulkImportPage
      entityLabel="Asset"
      previewEndpoint="/assets/bulk-import/preview/"
      commitEndpoint="/assets/bulk-import/commit/"
    />
  );
}