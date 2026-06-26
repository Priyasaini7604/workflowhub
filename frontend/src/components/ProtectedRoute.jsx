import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Ab bhi check ho rahi hai localStorage — wait karo
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // User nahi hai → Login pe bhejo
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User hai → Page dikhao
  return children;
};

export default ProtectedRoute;