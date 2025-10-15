import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./auth/Login";
import { Dashboard } from "./pages/Dashboard";
import Reports from "./pages/Report";
import { getCurrentStoredConfig, getFallbackConfig } from "./utils/configLoader";
import { authService } from "./services/AuthService";
import Layout from "./layout/Layout";

function ProtectedRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

function App() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const storedConfig = getCurrentStoredConfig();
    setConfig(storedConfig);
  }, []);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login config={config} />} />
        
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout config={config} />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;