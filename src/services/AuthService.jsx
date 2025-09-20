const baseURL = import.meta.env.VITE_BASE_URL;

export const authService = {
  async login(credentials) {
    try {
      const response = await fetch(`${baseURL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      console.log("Login response data:", data);

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.success && data.customer) {
        const authData = {
          success: data.success,
          message: data.message,
          customer: data.customer
        };

        localStorage.setItem("auth_payload", JSON.stringify(authData));
        return authData;
      } else {
        throw new Error("Invalid login response");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem("auth_payload");
  },

  isAuthenticated() {
    return localStorage.getItem("auth_payload") !== null;
  },

  getAuthData() {
    const authData = localStorage.getItem("auth_payload");
    return authData ? JSON.parse(authData) : null;
  },

  getCurrentUser() {
    const authData = this.getAuthData();
    return authData ? authData.customer : null;
  },

  getDeviceInfo() {
    const user = this.getCurrentUser();
    return user?.deviceInfo || null;
  }
};
