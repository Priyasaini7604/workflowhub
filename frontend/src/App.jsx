import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
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
      path="/assets/:id/edit"
      element={
        <ProtectedRoute>
          <Layout>
            <EditAssetPage />
          </Layout>
        </ProtectedRoute>
      }
    />
      </Routes>
    </BrowserRouter>
  );
};

export default App;