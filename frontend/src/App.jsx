import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import AddEmployeePage from "./pages/AddEmployeePage";
import EmployeeDetailPage from './pages/EmployeeDetailPage';

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
      </Routes>
    </BrowserRouter>
  );
};

export default App;