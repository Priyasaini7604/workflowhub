import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Root → Login pe redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login page — sabke liye accessible */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes — sirf logged in users ke liye */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
};

export default App;