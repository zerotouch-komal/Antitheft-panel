import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { authService } from '../services/AuthService';
import { loadConfig, getCurrentStoredConfig } from '../utils/configLoader';
import { Smartphone, Shield, X, MapPin, FileText, Menu, AlertTriangle, ChevronRight, LogOut, RefreshCw} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const [config, setConfig] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMissingMode, setIsMissingMode] = useState(false);
  const [isProcessingMissing, setIsProcessingMissing] = useState(false);
  const [reportMinutes, setReportMinutes] = useState(15);
  const [errorMessage, setErrorMessage] = useState('');
  const [logoError, setLogoError] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const baseURL = import.meta.env.VITE_BASE_URL;

const getLogoUrl = () => {
  if (!config?.logo || logoError) return null;

  const baseURL = 'http://192.168.1.113:3000';
  
  const normalizedLogo = config.logo.replace(/\\/g, '/');
  
  console.log("Original logo path:", config.logo);
  console.log("Normalized logo path:", normalizedLogo);
  
  if (normalizedLogo.startsWith('http://') || normalizedLogo.startsWith('https://')) {
    return `${baseURL}/api/proxy/image?url=${encodeURIComponent(normalizedLogo)}`;
  }
  
  if (normalizedLogo.startsWith('public/')) {
    const logoPath = normalizedLogo.replace('public/', '');
    const finalUrl = `${baseURL}/public/${logoPath}`;
    console.log("Final logo URL:", finalUrl);
    return finalUrl;
  }
  
  if (normalizedLogo.startsWith('/')) {
    const finalUrl = `${baseURL}/public${normalizedLogo}`;
    console.log("Final logo URL:", finalUrl);
    return finalUrl;
  }
  
  const finalUrl = `${baseURL}/public/${normalizedLogo}`;
  console.log("Final logo URL:", finalUrl);
  return finalUrl;
};

  const handleLogoError = () => {
    console.warn("Logo failed to load, falling back to icon");
    console.warn("Attempted logo URL:", getLogoUrl());
    setLogoError(true);
  };

  useEffect(() => {
    const initConfig = async () => {
      try {
        const loadedConfig = await loadConfig();
        console.log("Config loaded:", loadedConfig);
        console.log("Logo URL:", loadedConfig?.logo);
        setConfig(loadedConfig);
      } catch (error) {
        console.error("Config loading error:", error);
        const storedConfig = getCurrentStoredConfig();
        console.log("Using stored config:", storedConfig);
        console.log("Stored logo URL:", storedConfig?.logo);
        setConfig(storedConfig);
      }
    };
    
    const loadUserData = () => {
      const currentUser = authService.getCurrentUser();
      const deviceData = authService.getDeviceInfo();
      
      setUserInfo(currentUser);
      setDeviceInfo(deviceData);
    };
    
    initConfig();
    loadUserData();
  }, []);

  const fetchUserLocation = async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);
      
      const authData = authService.getAuthData();
      const currentUser = authService.getCurrentUser();
      
      const response = await fetch(`${baseURL}/dashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData?.token}`
        },
        body: JSON.stringify({
          customerId: currentUser?.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch location');
      }
      
      const responseData = await response.json();
      console.log('Dashboard response:', responseData);
      
      if (responseData.success && responseData.data?.location) {
        const location = responseData.data.location;
        setUserLocation({
          lat: parseFloat(location.latitude),
          lng: parseFloat(location.longitude),
          lastUpdated: location.lastUpdated
        });
        setLastUpdated(new Date(location.lastUpdated).toLocaleString());
      } else {
        throw new Error('No location data available in response');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      setLocationError(error.message);
      setUserLocation(null);
      setLastUpdated(null);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser?.id) {
      fetchUserLocation();
    }
  }, []);

  const colors = config?.theme?.colours || {};
  const sidebarBg = colors.sideBg && colors.sideBg !== '#fff' ? colors.sideBg : '#0f172a';
  const sidebarBottomBg = colors.primaryCard || '#1e293b';
  const primaryColor = colors.primaryColour || '#3b82f6';
  const secondaryColor = colors.secondaryColour || '#1d4ed8';
  const textPrimary = colors.textPrimary === '#000' ? '#f8fafc' : colors.textPrimary || '#f8fafc';
  const textSecondary = colors.textSecondary === '#fff' ? '#94a3b8' : colors.textSecondary || '#94a3b8';
  const logoUrl = getLogoUrl();
  const displayName = config?.displayName || "101 Antitheft";

  console.log("Config logo:", config?.logo);
  console.log("Generated logo URL:", logoUrl);

  const handleMarkAsMissing = async () => {
    try {
      setIsProcessingMissing(true);
      setErrorMessage('');
      
      const authData = authService.getAuthData();
      const currentUser = authService.getCurrentUser();
      const deviceToken = currentUser?.token || currentUser?.deviceToken || currentUser?.fcmToken;
      
      if (!deviceToken) {
        console.error('No device token found in user data');
        throw new Error('Device token not available');
      }

      if (!isMissingMode) {
        const requestPayload = {
          token: deviceToken,
          action: "REPORT",
          minutes: reportMinutes.toString()
        };

        console.log('Sending request to:', `${baseURL}/send-device-command`);
        console.log('Request payload:', requestPayload);

        const response = await fetch(`${baseURL}/send-device-command`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData?.token}`
          },
          body: JSON.stringify(requestPayload)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          throw new Error(`Server error: ${response.status} - ${errorText || 'Failed to start missing report'}`);
        }

        const commandResponse = await response.json();
        console.log('Missing report started:', commandResponse);
        
        setIsMissingMode(true);
      } else {
        const requestPayload = {
          token: deviceToken,
          action: "STOP_REPORT"
        };

        console.log('Sending stop request:', requestPayload);

        const response = await fetch(`${baseURL}/send-device-command`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData?.token}`
          },
          body: JSON.stringify(requestPayload)
        });

        console.log('Stop report response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Stop report server response:', errorText);
          throw new Error(`Server error: ${response.status} - ${errorText || 'Failed to stop missing report'}`);
        }

        const commandResponse = await response.json();
        console.log('Missing report stopped:', commandResponse);
        
        setIsMissingMode(false);
      }
      
    } catch (error) {
      console.error('Error handling missing report:', error);
      setErrorMessage(error.message || 'An unexpected error occurred');
      
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    } finally {
      setIsProcessingMissing(false);
    }
  };

  const topMenuItems = [
  ];

  const deviceMenuItems = [
  ];

  const bottomMenuItems = [
    {
      name: 'Maps & Actions',
      path: '/dashboard',
      icon: <MapPin className="w-5 h-5" />
    },
    {
      name: 'Missing Reports',
      path: '/reports', 
      icon: <FileText className="w-5 h-5" />
    },
  ];

  const closeSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    closeSidebar();
  }, [location]);

  const getDeviceDisplayName = () => {
    if (!deviceInfo) return 'Unknown Device';
    const { brand, model } = deviceInfo;
    if (brand && model) return `${brand} ${model}`;
    return model || brand || 'Unknown Device';
  };

  const getDeviceStatus = () => {
    if (isLoadingLocation) {
      return {
        online: false,
        lastSeen: 'Loading...',
        lastTime: ''
      };
    }

    if (locationError || !lastUpdated) {
      return {
        online: false,
        lastSeen: 'No connection data',
        lastTime: ''
      };
    }

    const lastUpdateDate = new Date(lastUpdated);
    const today = new Date();
    const isToday = lastUpdateDate.toDateString() === today.toDateString();
    
    const dateOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    const timeOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    };

    return {
      online: userLocation ? true : false,
      lastSeen: isToday ? 'Today' : lastUpdateDate.toLocaleDateString('en-US', dateOptions),
      lastTime: lastUpdateDate.toLocaleTimeString('en-US', timeOptions)
    };
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const deviceStatus = getDeviceStatus();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 transition-all duration-200 hover:shadow-xl"
        style={{
          color: primaryColor
        }}
        aria-label="Toggle Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div 
        className={`
          lg:static lg:translate-x-0
          fixed top-0 left-0 h-full z-30 
          transform transition-all duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-2xl lg:shadow-none
          flex flex-col
        `}
        style={{ 
          backgroundColor: sidebarBg,
          width: '280px',
          minWidth: '280px'
        }}
      >
        <div className="flex-shrink-0 relative p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex justify-center w-full">
                {logoUrl && !logoError ? (
                  <div className="flex-shrink-0">
                    <img 
                      src={logoUrl} 
                      alt={displayName}
                      className="w-35 h-35 object-contain rounded-lg"
                      onLoad={() => {
                        console.log("✅ Logo loaded successfully:", logoUrl);
                      }}
                      onError={(e) => {
                        console.error("❌ Logo failed to load:", logoUrl);
                        console.error("Error details:", e);
                        handleLogoError();
                      }}
                      crossOrigin="anonymous"
                    />
                  </div>
                ) : (
                  <div 
                    className="p-2 rounded-xl shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                    }}
                  >
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden absolute right-0 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
              style={{ color: textSecondary }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <nav className="px-4 py-6">
            <ul className="space-y-2">
              {topMenuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                        isActive
                          ? 'shadow-lg transform scale-[1.02]'
                          : 'hover:bg-white/5 hover:transform hover:scale-[1.01]'
                      }`
                    }
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? primaryColor : 'transparent',
                      color: isActive ? 'white' : textSecondary
                    })}
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span 
                        className="px-2 py-1 text-xs font-bold rounded-full"
                        style={{ 
                          backgroundColor: secondaryColor,
                          color: 'white'
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="px-4 mb-6">
            <div 
              className="rounded-2xl p-5 backdrop-blur-sm border border-white/10 shadow-lg"
              style={{ backgroundColor: sidebarBottomBg }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  {/* Add online status indicator */}
                  <div 
                    className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 ${
                      deviceStatus.online ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ borderColor: sidebarBottomBg }}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm" style={{ color: textPrimary }}>
                    {getDeviceDisplayName()}
                  </div>
                  <div className="text-xs" style={{ color: deviceStatus.online ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)' }}>
                    {deviceStatus.online ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>

              {/* Updated connection info section */}
              <div className="space-y-1 mb-4">
                <div className="text-xs font-medium" style={{ color: textSecondary }}>
                  Last Connection
                </div>
                {isLoadingLocation ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 animate-spin" style={{ color: textSecondary }} />
                    <div className="text-sm" style={{ color: textSecondary }}>Loading...</div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-medium" style={{ color: textPrimary }}>
                      {deviceStatus.lastSeen}
                    </div>
                    {deviceStatus.lastTime && (
                      <div className="text-sm" style={{ color: textSecondary }}>
                        at {deviceStatus.lastTime}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Rest of the component remains the same */}
              {!isMissingMode && (
                <div className="mb-4">
                  <div className="text-xs font-medium mb-2" style={{ color: textSecondary }}>
                    Report Interval (minutes)
                  </div>
                  <select
                    value={reportMinutes}
                    onChange={(e) => setReportMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg text-sm font-medium border border-white/20 focus:outline-none focus:border-white/40 transition-colors"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: textPrimary
                    }}
                  >
                    <option value={15} style={{backgroundColor: sidebarBottomBg, color: textPrimary}}>15 minutes</option>
                    <option value={30} style={{backgroundColor: sidebarBottomBg, color: textPrimary}}>30 minutes</option>
                    <option value={45} style={{backgroundColor: sidebarBottomBg, color: textPrimary}}>45 minutes</option>
                  </select>
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 rounded-lg border border-red-500/30" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
                  <div className="text-xs font-medium text-red-400 break-words">
                    {errorMessage}
                  </div>
                </div>
              )}

              <button 
                onClick={handleMarkAsMissing}
                disabled={isProcessingMissing}
                className="cursor-pointer w-full py-3 px-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isMissingMode 
                    ? `linear-gradient(135deg, #059669, #047857)` 
                    : `linear-gradient(135deg, #dc2626, #b91c1c)`
                }}
              >
                <span className="inline-flex items-center gap-2">
                  {isProcessingMissing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {isMissingMode ? 'Stopping Report...' : 'Starting Report...'}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      {isMissingMode ? 'Device Found' : 'Mark as Missing'}
                    </>
                  )}
                </span>
              </button>

              {isMissingMode && (
                <div className="mb-4 p-3 rounded-lg border border-green-500/30" style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-400">Missing Report Active</span>
                  </div>
                  <div className="text-xs" style={{ color: textSecondary }}>
                    Reporting every {reportMinutes} minutes
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {deviceMenuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebar}
                    className="group flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-white/5"
                  >
                    <div className="flex items-center space-x-3">
                      <div style={{ color: textSecondary }} className="group-hover:text-white transition-colors">
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium" style={{ color: textSecondary }}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.badge && (
                        <span 
                          className="px-2 py-1 text-xs font-bold rounded-full"
                          style={{ backgroundColor: primaryColor, color: 'white' }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.hasArrow && (
                        <ChevronRight className="w-3 h-3" style={{ color: textSecondary }} />
                      )}
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 pb-4">
            <nav>
              <ul className="space-y-2">
                {bottomMenuItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={closeSidebar}
                      className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-white/5 hover:transform hover:scale-[1.01] font-medium"
                      style={{ color: textSecondary }}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-white/10" style={{ backgroundColor: sidebarBg }}>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="cursor-pointer w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group"
            style={{ color: textPrimary }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#ef444420';
              e.target.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = textPrimary;
            }}
          >
            <LogOut
              size={20}
              style={{ color: textSecondary }}
              className="group-hover:!text-red-500"
            />
            <span className="font-medium">
              {isLoggingOut ? 'Signing Out...' : 'Logout'}
            </span>
            <ChevronRight s ize={16} className="ml-auto" style={{ color: textSecondary }} />
          </button>
        </div>
      </div>

      <style jsx>{` 
        .flex-1::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
