import { useState } from "react";
import { X, Mail, CheckCircle, AlertCircle } from "lucide-react";

const baseURL = import.meta.env.VITE_BASE_URL;

export function ForgotPasswordDialog({ isOpen, onClose, config }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");

  const colours = config?.theme?.colours || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResponse(null);
    setIsLoading(true);

    if (!email.trim()) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${baseURL}/api/appSphere/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          mode: "WEB",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResponse({
          success: true,
          message: data.message || "Password reset link sent successfully!",
        });
        setEmail("");
      } else {
        setResponse({
          success: false,
          message: data.message || data.error || "Failed to send reset link",
        });
      }
    } catch (err) {
      setResponse({
        success: false,
        message: err.message || "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setResponse(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
        onClick={handleClose}
      >
        <div
          className="w-full max-w-md rounded-2xl shadow-2xl p-8 relative animate-slideUp"
          style={{
            backgroundColor: colours.primaryCard,
            border: `1px solid ${colours.secondaryCard}30`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleClose}
            className="cursor-pointer absolute top-4 right-4 p-2 rounded-lg hover:bg-opacity-80 transition-all"
            style={{
              color: colours.textSecondary,
              backgroundColor: colours.sideBg,
            }}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{
                backgroundColor: `${colours.primaryColour}20`,
              }}
            >
              <Mail
                className="w-8 h-8"
                style={{ color: colours.primaryColour }}
              />
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: colours.textPrimary }}
            >
              Forgot Password?
            </h2>
            <p
              className="text-sm"
              style={{ color: colours.textSecondary }}
            >
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="forgot-email"
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
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                    setResponse(null);
                  }}
                  required
                  className="w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all"
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
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div
                className="text-sm p-3 rounded-xl border-l-4 flex items-start space-x-2"
                style={{
                  color: "#dc2626",
                  backgroundColor: `${colours.bgColour}80`,
                  borderLeftColor: "#dc2626",
                }}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {response && (
              <div
                className={`text-sm p-3 rounded-xl border-l-4 flex items-start space-x-2 ${
                  response.success ? "" : ""
                }`}
                style={{
                  color: response.success ? "#16a34a" : "#dc2626",
                  backgroundColor: `${colours.bgColour}80`,
                  borderLeftColor: response.success ? "#16a34a" : "#dc2626",
                }}
              >
                {response.success ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <span>{response.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer w-full font-bold py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: colours.primaryColour,
                color: colours.bgColour,
                boxShadow: `0 4px 15px ${colours.primaryColour}40`,
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
                  <span>Sending...</span>
                </div>
              ) : (
                "Send"
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        input::placeholder {
          color: ${colours.textSecondary}80 !important;
          opacity: 0.8;
        }

        input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
