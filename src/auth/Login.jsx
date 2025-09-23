import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/AuthService";
import { refreshConfig, getFallbackConfig } from "../utils/configLoader";
import { Eye, EyeOff, Lock, Mail, RefreshCw } from "lucide-react";

export function Login({ config: initialConfig }) {
  const navigate = useNavigate();
  const [config, setConfig] = useState(initialConfig || getFallbackConfig());
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mode: "WEB"
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [configLoadError, setConfigLoadError] = useState(false);
  const [isRefreshingConfig, setIsRefreshingConfig] = useState(false);

  useEffect(() => {
    const loadFreshConfig = async () => {
      setIsConfigLoading(true);
      setIsRefreshingConfig(true);
      try {
        console.log("Refreshing config for login page...");
        const freshConfig = await refreshConfig();
        setConfig(freshConfig);
        setConfigLoadError(false);
        console.log("Config refreshed successfully");
      } catch (error) {
        console.error("Failed to refresh config, using fallback:", error);
        setConfigLoadError(true);
        setConfig(getFallbackConfig());
      } finally {
        setIsConfigLoading(false);
        setIsRefreshingConfig(false);
      }
    };

    loadFreshConfig();
  }, []);

  const refreshConfiguration = async () => {
    try {
      setConfigLoadError(false);
      setIsRefreshingConfig(true);
      const freshConfig = await refreshConfig();
      setConfig(freshConfig);
    } catch (error) {
      console.error("Failed to refresh configuration:", error);
      setConfigLoadError(true);
      setConfig(getFallbackConfig());
    } finally {
      setIsRefreshingConfig(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Both email and password are required.");
      setIsLoading(false);
      return;
    }

    try {
      await authService.login(formData);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

const getLogoUrl = () => {
    if (!config?.logo || logoError) return null;

   const baseURL = import.meta.env.VITE_BASE_URL;
    
    // Normalize the path by replacing backslashes with forward slashes
    const normalizedLogo = config.logo.replace(/\\/g, '/');
    
    // If it's already a full URL
    if (normalizedLogo.startsWith('http://') || normalizedLogo.startsWith('https://')) {
      return `${baseURL}/api/proxy/image?url=${encodeURIComponent(normalizedLogo)}`;
    }
    
    // Handle public/ paths
    if (normalizedLogo.startsWith('public/')) {
      const logoPath = normalizedLogo.replace('public/', '');
      return `${baseURL}/public/${logoPath}`;
    }
    
    // Handle paths starting with /
    if (normalizedLogo.startsWith('/')) {
      return `${baseURL}/public${normalizedLogo}`;
    }
    
    // Default case - assume it's a relative path that should be in public
    return `${baseURL}/public/${normalizedLogo}`;
  };

  const handleLogoError = () => {
    console.warn("Logo failed to load, falling back to icon");
    console.warn("Attempted logo URL:", getLogoUrl());
    setLogoError(true);
  };
  const FullScreenLoader = ({ text = "Loading..." }) => {
    const colours = config?.theme?.colours || {};

    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: colours.bgColour || "#000",
        }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 mx-auto mb-4 border-4 border-transparent"
            style={{
              borderTopColor: colours.primaryColour || "#FFDF64",
              borderRightColor: colours.primaryColour || "#FFDF64",
            }}
          ></div>
          <p
            className="text-lg font-medium"
            style={{ color: colours.textSecondary || "#FFDF64" }}
          >
            {text}
          </p>
        </div>
      </div>
    );
  };

  if (!config || isConfigLoading) {
    return <FullScreenLoader text="Loading..." />;
  }

  const colours = config.theme?.colours || {};
  const displayName = config.displayName || "Login";
  const logoUrl = getLogoUrl();

  console.log("Config logo:", config.logo);
  console.log("Generated logo URL:", logoUrl);

  return (
    <>
      {isLoading ? (
        <FullScreenLoader text="Signing in..." />
      ) : (
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            background: `linear-gradient(135deg, ${colours.bgColour} 0%, ${colours.sideBg} 50%, ${colours.primaryCard} 100%)`,
          }}
        >
          <div className="w-full max-w-md">
            {configLoadError && (
              <div className="mb-4 p-3 rounded-lg border border-yellow-300 bg-yellow-50 flex items-center justify-between">
                <div className="text-sm text-yellow-700">
                  Using offline configuration
                </div>
                <button
                  onClick={refreshConfiguration}
                  disabled={isRefreshingConfig}
                  className="text-yellow-600 hover:text-yellow-800 disabled:opacity-50"
                  title="Refresh configuration"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshingConfig ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            )}

            <div className="text-center mb-8">
              {logoUrl && !logoError ? (
                <div
                  className="inline-block p-2 rounded-2xl mb-6"
                  style={{ backgroundColor: colours.primaryCard }}
                >
                  <img
                    src={logoUrl}
                    alt={displayName}
                    className="mx-auto rounded-lg max-h-16"
                    onError={handleLogoError}
                    crossOrigin="anonymous"
                  />
                </div>
              ) : (
                <div
                  className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg mb-6"
                  style={{
                    backgroundColor: colours.primaryColour,
                    boxShadow: `0 8px 25px ${colours.primaryColour}40`,
                  }}
                >
                  <Lock className="w-10 h-10" style={{ color: colours.bgColour }} />
                </div>
              )}
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: colours.textPrimary }}
              >
                {displayName}
              </h1>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl shadow-2xl p-8 space-y-6 backdrop-blur-sm"
              style={{
                backgroundColor: colours.primaryCard,
                border: `1px solid ${colours.secondaryCard}30`,
                boxShadow: `0 20px 50px ${colours.bgColour}50`,
              }}
            >
              <div className="space-y-3">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold block"
                  style={{ color: colours.textPrimary }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
                    style={{ color: colours.textSecondary }}
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all duration-300"
                    style={{
                      backgroundColor: colours.sideBg,
                      borderColor: colours.secondaryCard,
                      color: colours.textPrimary,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colours.primaryColour;
                      e.target.style.boxShadow = `0 0 0 3px ${colours.primaryColour}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colours.secondaryCard;
                      e.target.style.boxShadow = "none";
                    }}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold block"
                  style={{ color: colours.textPrimary }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
                    style={{ color: colours.textSecondary }}
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-14 py-4 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all duration-300"
                    style={{
                      backgroundColor: colours.sideBg,
                      borderColor: colours.secondaryCard,
                      color: colours.textPrimary,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colours.primaryColour;
                      e.target.style.boxShadow = `0 0 0 3px ${colours.primaryColour}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colours.secondaryCard;
                      e.target.style.boxShadow = "none";
                    }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-all duration-200 p-1 rounded"
                    style={{
                      color: colours.textSecondary,
                    }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="text-sm p-4 rounded-xl border-l-4 font-medium"
                  style={{
                    color: "#dc2626",
                    backgroundColor: colours.bgColour,
                    borderColor: "#f87171",
                    borderLeftColor: "#dc2626",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer w-full font-bold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  backgroundColor: colours.primaryColour,
                  color: colours.bgColour,
                  boxShadow: `0 4px 15px ${colours.primaryColour}40`,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.boxShadow = `0 6px 20px ${colours.primaryColour}60`;
                    e.target.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.boxShadow = `0 4px 15px ${colours.primaryColour}40`;
                    e.target.style.transform = "translateY(0)";
                  }
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div
                      className="animate-spin rounded-full h-5 w-5 border-2 border-transparent"
                      style={{
                        borderTopColor: colours.bgColour,
                        borderRightColor: colours.bgColour,
                      }}
                    ></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <p
                className="text-xs opacity-60"
                style={{ color: colours.textSecondary }}
              >
                © 2025 {displayName}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        input::placeholder {
          color: ${colours.textSecondary}80 !important;
          opacity: 0.8;
        }

        input:focus::placeholder {
          color: ${colours.textSecondary}60 !important;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px ${colours.sideBg} inset !important;
          -webkit-text-fill-color: ${colours.textPrimary} !important;
          border-color: ${colours.secondaryCard} !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }
      `}</style>
    </>
  );
}