import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import AddEmployeePage from "./pages/AddEmployeePage";
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import EditEmployeePage from "./pages/EditEmployeePage";
import AssetsPage from "./pages/AssetsPage";
import AddAssetPage from "./pages/AddAssetPage";
import AssetDetailPage from "./pages/AssetDetailPage";
import EditAssetPage from "./pages/EditAssetPage";
import OnboardingPage from "./pages/OnboardingPage";
import OffboardingPage from "./pages/OffboardingPage";
import ReportsPage from "./pages/ReportsPage";
import DocumentsPage from "./pages/DocumentsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import MyProfilePage from "./pages/MyProfilePage";
import MyAssetsPage from "./pages/MyAssetsPage";
import MyDocumentsPage from "./pages/MyDocumentsPage";
import ITEmployeeAssetsPage from "./pages/ITEmployeeAssetsPage";
import StockOverviewPage from "./pages/StockOverviewPage";
import MyTeamPage from "./pages/MyTeamPage";
import ManagerOffboardingPage from "./pages/ManagerOffboardingPage";
import AssetCategoriesPage from "./pages/AssetCategoriesPage";
import ApprovalsCenterPage from "./pages/ApprovalsCenterPage";
import UserManagementPage from "./pages/UserManagementPage";
import AccessMatrixPage from "./pages/AccessMatrixPage";
import ScanPage from "./pages/ScanPage";



const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/scan/:assetId" element={<ScanPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <Layout>
                <EmployeesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
         <Route
          path="/employees/add"
          element={
            <ProtectedRoute>
              <Layout>
                <AddEmployeePage />
              </Layout>
            </ProtectedRoute>
        }
      />
        <Route path="/employees/:id" element={
        <ProtectedRoute><Layout><EmployeeDetailPage /></Layout></ProtectedRoute>
          } />
          <Route
      path="/employees/:id/edit"
      element={
        <ProtectedRoute>
          <Layout>
            <EditEmployeePage />
          </Layout>
        </ProtectedRoute>
      }
    />
  <Route
    path="/assets"
    element={
      <ProtectedRoute>
        <Layout>
          <AssetsPage />
        </Layout>
      </ProtectedRoute>
    }
  />
    <Route
      path="/assets/add"
      element={
        <ProtectedRoute>
          <Layout>
            <AddAssetPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route path="/assets/:id" element={
        <ProtectedRoute><Layout><AssetDetailPage /></Layout></ProtectedRoute>
          } />
          <Route
      path="/assets/stock-overview"
      element={
        <ProtectedRoute>
          <Layout>
            <StockOverviewPage />
          </Layout>
        </ProtectedRoute>
      }
    />
          <Route
      path="/assets/:id/edit"
      element={
        <ProtectedRoute>
          <Layout>
            <EditAssetPage />
          </Layout>
        </ProtectedRoute>
      }
    />
        <Route
      path="/onboarding"
      element={
        <ProtectedRoute>
          <Layout>
            <OnboardingPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/offboarding"
      element={
        <ProtectedRoute>
          <Layout>
            <OffboardingPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
  path="/reports"
  element={
    <ProtectedRoute>
      <Layout>
        <ReportsPage />
      </Layout>
    </ProtectedRoute>
  }
/>
  <Route
  path="/documents"
  element={
    <ProtectedRoute>
      <Layout>
        <DocumentsPage />
      </Layout>
    </ProtectedRoute>
  }
  />
  <Route
  path="/audit-logs"
  element={
    <ProtectedRoute>
      <Layout>
        <AuditLogsPage />
      </Layout>
    </ProtectedRoute>
  }
  />
  <Route
  path="/my-profile"
  element={
    <ProtectedRoute>
      <Layout>
        <MyProfilePage />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/my-assets"
  element={
    <ProtectedRoute>
      <Layout>
        <MyAssetsPage />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/my-documents"
  element={
    <ProtectedRoute>
      <Layout>
        <MyDocumentsPage />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/it/employee-assets"
  element={
    <ProtectedRoute>
      <Layout>
        <ITEmployeeAssetsPage />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/my-team"
  element={
    <ProtectedRoute>
      <Layout>
        <MyTeamPage />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/my-team/offboarding"
  element={
    <ProtectedRoute>
      <Layout>
        <ManagerOffboardingPage />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
      path="/assets/categories"
      element={
        <ProtectedRoute>
          <Layout>
            <AssetCategoriesPage />
          </Layout>
        </ProtectedRoute>
      }
    />
<Route
  path="/approvals"
  element={
    <ProtectedRoute>
      <Layout>
        <ApprovalsCenterPage />
      </Layout>
    </ProtectedRoute>
  }
/><Route
  path="/users"
  element={
    <ProtectedRoute>
      <Layout>
        <UserManagementPage />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/access-matrix"
  element={
    <ProtectedRoute>
      <Layout>
        <AccessMatrixPage />
      </Layout>
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
};

export default App;