const baseURL = import.meta.env.VITE_BASE_URL;

class ConfigPreferences {
  static PREFS_NAME = 'app_config_prefs';
  static CONFIG_KEY = 'stored_config';
  static TIMESTAMP_KEY = 'config_timestamp';
  static DOMAIN_KEY = 'config_domain';

  static setConfig(domain, config) {
    try {
      const configData = {
        data: config,
        timestamp: Date.now(),
        domain: domain
      };
      localStorage.setItem(`${this.PREFS_NAME}_${this.CONFIG_KEY}`, JSON.stringify(configData));
      console.log("Configuration stored for domain:", domain);
      return true;
    } catch (error) {
      console.error("Error storing config:", error);
      return false;
    }
  }

  static getConfig() {
    try {
      const stored = localStorage.getItem(`${this.PREFS_NAME}_${this.CONFIG_KEY}`);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        return parsedConfig;
      }
    } catch (error) {
      console.error("Error retrieving config:", error);
    }
    return null;
  }

  static clearConfig() {
    try {
      localStorage.removeItem(`${this.PREFS_NAME}_${this.CONFIG_KEY}`);
      return true;
    } catch (error) {
      console.error("Error clearing config:", error);
      return false;
    }
  }

  static hasConfig() {
    return localStorage.getItem(`${this.PREFS_NAME}_${this.CONFIG_KEY}`) !== null;
  }

  static getConfigAge() {
    const stored = this.getConfig();
    if (stored && stored.timestamp) {
      return Date.now() - stored.timestamp;
    }
    return null;
  }
}

export function getFallbackConfig() {
  const fallback = {
    theme: {
      colours: {
        primaryColour: "#1D4ED8",
        secondaryColour: "#3B82F6",
        tertiaryColour: "#1E3A8A",
        bgColour: "#FFFFFF",
        primaryCard: "#F0F9FF",
        secondaryCard: "#E0F2FE",
        sideBg: "#fff",
        textPrimary: "#000",
        textSecondary: "#fff",
      },
    },
    displayName: "Login",
    logo: "",
  };
  return fallback;
}

export async function fetchConfigFromAPI() {
  const domain = window.location.hostname;
  
  try {
    console.log("Fetching fresh config from API...");
    const apiUrl = `https://strong-finch-solely.ngrok-free.app/api/companies/config`;
    console.log("API URL:", apiUrl);
    
    const res = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error("Non-JSON response received:", text.substring(0, 200));
      throw new Error(`Expected JSON but received: ${contentType}`);
    }
    
    const json = await res.json();
    if (json.success && json.data) {
      ConfigPreferences.setConfig(domain, json.data);
      return json.data;
    } else {
      console.warn("API response indicates failure or no data:", json);
      throw new Error("Invalid API response");
    }
  } catch (err) {
    console.error("Error fetching config from API:", err);
    throw err;
  }
}

class ConfigManager {
  static instance = null;
  static config = null;
  static loading = false;
  static loadPromise = null;

  static async getInstance() {
    if (this.instance) {
      return this.instance;
    }

    if (this.loading && this.loadPromise) {
      console.log("Config already loading, waiting for existing promise...");
      return await this.loadPromise;
    }

    this.loading = true;
    this.loadPromise = this._loadConfigOnce();
    
    try {
      this.config = await this.loadPromise;
      this.instance = this.config;
      return this.config;
    } finally {
      this.loading = false;
      this.loadPromise = null;
    }
  }

  static async _loadConfigOnce() {
    try {
      const storedConfig = ConfigPreferences.getConfig();
      
      if (storedConfig && storedConfig.data) {
        console.log("Loading config from storage");
        return storedConfig.data;
      }
      
      console.log("No stored config found, fetching from API...");
      return await fetchConfigFromAPI();
      
    } catch (err) {
      console.error("Error in loadConfig:", err);
      console.log("Using fallback configuration");
      return getFallbackConfig();
    }
  }

  static reset() {
    this.instance = null;
    this.config = null;
    this.loading = false;
    this.loadPromise = null;
  }
}

export async function loadConfig() {
  return await ConfigManager.getInstance();
}

export async function refreshConfig() {
  try {
    console.log("Refreshing config from API...");
    ConfigPreferences.clearConfig();
    ConfigManager.reset();
    
    return await fetchConfigFromAPI();
  } catch (error) {
    console.error("Error refreshing config:", error);
    return getFallbackConfig();
  }
}

export function getCurrentStoredConfig() {
  const stored = ConfigPreferences.getConfig();
  return stored ? stored.data : getFallbackConfig();
}

export function hasStoredConfig() {
  return ConfigPreferences.hasConfig();
}

export function clearStoredConfig() {
  ConfigManager.reset();
  return ConfigPreferences.clearConfig();
}

export function getConfigAge() {
  return ConfigPreferences.getConfigAge();
}

export { ConfigPreferences };
