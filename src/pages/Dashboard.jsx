import React, { useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/AuthService';
import { useNavigate } from 'react-router-dom';
import { getCurrentStoredConfig } from '../utils/configLoader';
import { Lock, MapPin, RefreshCw, Volume2Icon, AlertCircle, ChevronLeft, ChevronRight, X, VolumeX, Move } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const authData = authService.getAuthData();
  const currentUser = authService.getCurrentUser();
  
  const [config] = useState(getCurrentStoredConfig());
  
  const colours = config?.theme?.colours || {};
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRemoteAlarmActive, setIsRemoteAlarmActive] = useState(false);
  const [isProcessingAlarm, setIsProcessingAlarm] = useState(false);
  const [isProcessingScreenLock, setIsProcessingScreenLock] = useState(false);
  
  const [dialogPosition, setDialogPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dialogRef = useRef(null);
  
  const baseURL = import.meta.env.VITE_BASE_URL;

  const getDeviceToken = useCallback(() => {
    const deviceToken = currentUser?.token || currentUser?.deviceToken || currentUser?.fcmToken;
    if (!deviceToken) {
      throw new Error('Device token not available');
    }
    return deviceToken;
  }, [currentUser]);

  const sendDeviceCommand = useCallback(async (action) => {
    try {
      const deviceToken = getDeviceToken();
      
      console.log(`[Route Call] POST api/antitheft/send-device-command`);
      console.log(`[Request Data] Action: ${action}, Token: ${deviceToken.substring(0, 10)}...`);
      
      const commandResponse = await authService.post('/api/antitheft/send-device-command', {
        token: deviceToken,
        action: action
      });
      
      console.log(`[Response] ${action} command response:`, commandResponse);
      return commandResponse;
    } catch (error) {
      console.error(`[Error] sending ${action} command:`, error);
      throw error;
    }
  }, [getDeviceToken]);

  const fetchUserLocation = useCallback(async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);
      
      console.log(`[Route Call] POST api/antitheft/dashboard`);
      console.log(`[Request Data] Customer ID: ${currentUser?.antitheftKey}`);
      
      const responseData = await authService.post('/api/antitheft/dashboard', {
        antitheftKey: currentUser?.antitheftKey
      });
      
      console.log('[Response] Dashboard response:', responseData);
      
      if (responseData.success && responseData.data?.location) {
        const location = responseData.data.location;
        console.log('[Location Data] Latitude:', location.latitude, 'Longitude:', location.longitude);
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
      console.error('[Error] fetching location:', error);
      setLocationError(error.message);
      setUserLocation(null);
    } finally {
      setIsLoadingLocation(false);
    }
  }, [currentUser?.antitheftKey]);

  const updateLocation = async () => {
    try {
      setIsUpdatingLocation(true);
      console.log('[Action] Updating location - sending UPDATE_LOCATION command');
      await sendDeviceCommand("UPDATE_LOCATION");
      
      console.log('[Action] Waiting 2 seconds before fetching updated location...');
      setTimeout(async () => {
        await fetchUserLocation();
      }, 2000);
      
    } catch (error) {
      console.error('[Error] updating location:', error);
      setLocationError(error.message);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleRemoteAlarm = async () => {
    try {
      setIsProcessingAlarm(true);
      const action = isRemoteAlarmActive ? "STOP_SIREN" : "POCKET_DETECTION_TRIGGER";
      await sendDeviceCommand(action);
      setIsRemoteAlarmActive(!isRemoteAlarmActive);
      
    } catch (error) {
      setLocationError(error.message);
    } finally {
      setIsProcessingAlarm(false);
    }
  };

  const handleScreenLock = async () => {
    try {
      setIsProcessingScreenLock(true);
      await sendDeviceCommand("LOCK_SCREEN");
      
    } catch (error) {
      setLocationError(error.message);
    } finally {
      setIsProcessingScreenLock(false);
    }
  };

  const adjustDialogPosition = useCallback(() => {
    if (dialogRef.current) {
      const dialogWidth = dialogRef.current.offsetWidth;
      const dialogHeight = dialogRef.current.offsetHeight;
      const isDesktop = window.innerWidth >= 1024;
      const rightSidebarWidth = (isDesktop || isSidebarOpen) ? 320 : 0;
      const padding = 16;
      
      const maxX = window.innerWidth - rightSidebarWidth - dialogWidth - padding;
      const maxY = window.innerHeight - dialogHeight - padding;
      
      setDialogPosition(prev => ({
        x: Math.max(padding, Math.min(prev.x, maxX)),
        y: Math.max(padding, Math.min(prev.y, maxY))
      }));
    }
  }, [isSidebarOpen]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - dialogPosition.x,
        y: e.clientY - dialogPosition.y
      });
    }
  };

  useEffect(() => {
    adjustDialogPosition();
  }, [isSidebarOpen, adjustDialogPosition]);


  useEffect(() => {
    const handleResize = () => {
      adjustDialogPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustDialogPosition]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && dialogRef.current) {
        const dialogWidth = dialogRef.current.offsetWidth;
        const dialogHeight = dialogRef.current.offsetHeight;
        
        const isDesktop = window.innerWidth >= 1024;
        const isMobile = window.innerWidth < 1024;
        
        const rightSidebarWidth = (isDesktop || isSidebarOpen) ? 320 : 0;
        
        const mobileButtonArea = (isMobile && !isSidebarOpen) 
          ? { width: 80, height: 80 } 
          : { width: 0, height: 0 };
        
        const padding = 16;
        
        const maxX = window.innerWidth - rightSidebarWidth - dialogWidth - padding;
        const maxY = window.innerHeight - dialogHeight - padding;
        
        let newX = e.clientX - dragOffset.x;
        let newY = e.clientY - dragOffset.y;
        
        newX = Math.max(padding, Math.min(newX, maxX));
        newY = Math.max(padding, Math.min(newY, maxY));
        
        if (isMobile && !isSidebarOpen) {
          const dialogRight = newX + dialogWidth;
          const buttonLeft = window.innerWidth - mobileButtonArea.width;
          const buttonBottom = mobileButtonArea.height;
          
          if (dialogRight > buttonLeft && newY < buttonBottom) {
            newX = Math.min(newX, buttonLeft - dialogWidth - padding);
          }
        }
        
        setDialogPosition({
          x: newX,
          y: newY
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isSidebarOpen]);

  useEffect(() => {
    if (currentUser?.antitheftKey) {
      fetchUserLocation();
    }
  }, [currentUser?.antitheftKey, fetchUserLocation]);

  const hasValidLocation = userLocation && userLocation.lat && userLocation.lng;

  const getGoogleMapUrl = () => {
    if (!hasValidLocation) return '';
    const { lat, lng } = userLocation;
    return `https://maps.google.com/maps?q=${lat},${lng}&t=m&z=15&output=embed&iwloc=addr&language=en`;
  };

  const ActionButton = ({ onClick, disabled, isActive, processing, activeText, inactiveText, processingText, icon: Icon, activeIcon: ActiveIcon }) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer w-full flex items-center justify-between p-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      style={{ 
        backgroundColor: isActive 
          ? (colours.dangerColour || '#EF4444') 
          : (colours.secondaryCard || '#34495E') 
      }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: colours.textSecondary || 'white' }}>
          {processing ? processingText : (isActive ? activeText : inactiveText)}
        </span>
      </div>
      {processing ? (
        <RefreshCw className="w-5 h-5 animate-spin" style={{ color: colours.textSecondary || 'white' }} />
      ) : (isActive && ActiveIcon) ? (
        <ActiveIcon className="w-5 h-5" style={{ color: colours.textSecondary || 'white' }} />
      ) : (
        <Icon className="w-5 h-5" style={{ color: colours.textSecondary || 'white' }} />
      )}
    </button>
  );

  const StatusInfo = () => (
    <div className="mt-8 pt-6 border-t" style={{ borderColor: colours.tertiaryColour || '#34495E' }}>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span style={{ color: colours.textSecondary || 'white' }}>Status:</span>
          <span className={hasValidLocation ? "text-green-400" : "text-red-400"}>
            {hasValidLocation ? "Online" : "Offline"}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: colours.textSecondary || 'white' }}>Alarm Status:</span>
          <span className={isRemoteAlarmActive ? "text-red-400" : "text-gray-400"}>
            {isRemoteAlarmActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: colours.textSecondary || 'white' }}>Last Sync:</span>
          <span style={{ color: colours.textSecondary || 'white' }}>{lastUpdated || 'Never'}</span>
        </div>
        {hasValidLocation && (
          <>
            <div className="flex justify-between">
              <span style={{ color: colours.textSecondary || 'white' }}>Latitude:</span>
              <span style={{ color: colours.textSecondary || 'white' }}>{userLocation.lat.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: colours.textSecondary || 'white' }}>Longitude:</span>
              <span style={{ color: colours.textSecondary || 'white' }}>{userLocation.lng.toFixed(6)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const ActionButtons = () => (
    <div className="space-y-4">
      <ActionButton
        onClick={handleRemoteAlarm}
        disabled={isProcessingAlarm}
        isActive={isRemoteAlarmActive}
        processing={isProcessingAlarm}
        activeText="Stop alarm"
        inactiveText="Remote alarm"
        processingText={isRemoteAlarmActive ? 'Stopping alarm...' : 'Starting alarm...'}
        icon={Volume2Icon}
        activeIcon={VolumeX}
      />
      <ActionButton
        onClick={handleScreenLock}
        disabled={isProcessingScreenLock}
        isActive={false}
        processing={isProcessingScreenLock}
        activeText=""
        inactiveText="Screen lock"
        processingText="Locking screen..."
        icon={Lock}
      />
    </div>
  );

  const SidebarContent = ({ isMobile = false }) => (
    <>
      {isMobile && (
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: colours.tertiaryColour || '#34495E' }}>
          <h3 className="text-lg font-semibold" style={{ color: colours.textSecondary || 'white' }}>
            Actions
          </h3>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ backgroundColor: colours.secondaryCard || '#34495E' }}
          >
            <X className="w-5 h-5" style={{ color: colours.textSecondary || 'white' }} />
          </button>
        </div>
      )}
      <div className="p-6 flex-1">
        {!isMobile && (
          <h3 className="text-lg font-semibold mb-6" style={{ color: colours.textSecondary || 'white' }}>
            Actions
          </h3>
        )}
        
        <ActionButtons />
        <StatusInfo />
      </div>
    </>
  );

  if (isLoadingLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colours.bgColour || '#f5f5f5' }}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: colours.primaryColour }} />
          <p style={{ color: colours.textPrimary }}>Loading location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colours.bgColour || '#f5f5f5' }}>
      <div className="flex-1 relative">
        {locationError ? (
          <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: colours.bgColour }}>
            <div className="text-center">
              <div className="mb-4">
                <MapPin className="w-12 h-12 mx-auto mb-2" style={{ color: colours.primaryColour }} />
                <p className="text-lg font-semibold mb-2" style={{ color: colours.textPrimary }}>
                  Location Not Available
                </p>
                <p className="text-sm mb-4" style={{ color: colours.textPrimary }}>
                  {locationError}
                </p>
                <div className="space-y-2">
                  <button
                    onClick={fetchUserLocation}
                    className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: colours.primaryColour || '#3B82F6' }}
                  >
                    Retry
                  </button>
                  <button
                    onClick={updateLocation}
                    disabled={isUpdatingLocation}
                    className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mx-auto"
                    style={{ backgroundColor: colours.primaryColour || '#3B82F6' }}
                  >
                    {isUpdatingLocation ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    {isUpdatingLocation ? 'Requesting update...' : 'Update location'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : hasValidLocation ? (
          <>
            <iframe
              src={getGoogleMapUrl()}
              style={{ 
                height: '100vh', 
                width: '100%',
                border: 'none'
              }}
              title="Location Map"
              loading="lazy"
              allowFullScreen
              key={`${userLocation.lat}-${userLocation.lng}-${lastUpdated}`}
            />
            
            <div 
              ref={dialogRef}
              className="absolute z-30 rounded-lg shadow-lg max-w-sm select-none"
              style={{ 
                backgroundColor: colours.primaryCard || 'white',
                left: `${dialogPosition.x}px`,
                top: `${dialogPosition.y}px`,
                cursor: isDragging ? 'grabbing' : 'default'
              }}
              onMouseDown={handleMouseDown}
            >
              <div 
                className="drag-handle flex items-center justify-between p-3 border-b rounded-t-lg"
                style={{ 
                  borderColor: colours.tertiaryColour || '#e5e7eb',
                  cursor: 'grab',
                  backgroundColor: colours.secondaryCard || '#f9fafb'
                }}
              >
                <h3 className="font-semibold flex items-center gap-2" style={{ color: colours.textPrimary }}>
                  <Move className="w-4 h-4" />
                  Approximate location
                </h3>
              </div>
              
              <div className="p-4">
                <p className="text-sm mb-1" style={{ color: colours.textPrimary }}>
                  Latitude: {userLocation.lat.toFixed(6)}
                </p>
                <p className="text-sm mb-1" style={{ color: colours.textPrimary }}>
                  Longitude: {userLocation.lng.toFixed(6)}
                </p>
                <p className="text-xs mb-4" style={{ color: colours.textPrimary }}>
                  Obtained on {lastUpdated}
                </p>
                
                <button
                  onClick={updateLocation}
                  disabled={isUpdatingLocation}
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: colours.primaryColour || '#3B82F6' }}
                >
                  {isUpdatingLocation ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  {isUpdatingLocation ? 'Requesting update...' : 'Update location'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: colours.bgColour }}>
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4" style={{ color: colours.primaryColour }} />
              <p style={{ color: colours.textPrimary }}>No location data available</p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed top-4 right-4 z-30 w-12 h-12 rounded-lg flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: colours.primaryColour || '#3B82F6' }}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      </div>

      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div 
        className={`lg:hidden fixed top-0 right-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out shadow-xl ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: colours.sideBg || '#2C3E50' }}
      >
        <SidebarContent isMobile={true} />
      </div>

      <div 
        className="hidden lg:block w-80 min-h-screen sticky top-0 right-0 z-20 flex flex-col shadow-xl"
        style={{ backgroundColor: colours.sideBg || '#2C3E50' }}
      >
        <SidebarContent isMobile={false} />
      </div>
    </div>
  );
}