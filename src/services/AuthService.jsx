const baseURL = import.meta.env.VITE_BASE_URL;

export const authService = {

  async login(credentials) {
    try {
      const response = await fetch(`${baseURL}/api/appSphere/customer-login`, {
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

      if (data.success && data.customer && data.token) {
        const authData = {
          success: data.success,
          message: data.message,
          token: data.token, // Store the JWT token
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
    const authData = localStorage.getItem("auth_payload");
    if (!authData) return false;
    
    try {
      const parsedData = JSON.parse(authData);
      return parsedData.token ? true : false;
    } catch {
      return false;
    }
  },

  getAuthData() {
    const authData = localStorage.getItem("auth_payload");
    return authData ? JSON.parse(authData) : null;
  },

  getToken() {
    const authData = this.getAuthData();
    return authData ? authData.token : null;
  },

  getCurrentUser() {
    const authData = this.getAuthData();
    return authData ? authData.customer : null;
  },

  getDeviceInfo() {
    const user = this.getCurrentUser();
    return user?.deviceInfo || null;
  },

  // Generic API request method with automatic token inclusion
  async apiRequest(endpoint, options = {}) {
    const token = this.getToken();
    
    const defaultHeaders = {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` })
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${baseURL}${endpoint}`, config);
      
      // If token is invalid/expired, logout and redirect to login
      if (response.status === 401) {
        this.logout();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  },

  // Convenience methods for different HTTP methods
  async get(endpoint) {
    return this.apiRequest(endpoint, { method: 'GET' });
  },

  async post(endpoint, data) {
    return this.apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async put(endpoint, data) {
    return this.apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(endpoint) {
    return this.apiRequest(endpoint, { method: 'DELETE' });
  }

};
