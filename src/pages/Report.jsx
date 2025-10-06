import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getCurrentStoredConfig } from '../utils/configLoader';
import { authService } from '../services/AuthService';
import { ChevronLeft, X, MapPin, Clock, Wifi, Shield, Smartphone, Menu } from 'lucide-react';

const baseURL = import.meta.env.VITE_BASE_URL;

const Reports = () => {
  const [config, setConfig] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `${baseURL}/${cleanPath}`;
  };

  const getantitheftKey = () => {
    const authData = authService.getAuthData();
    const currentUser = authService.getCurrentUser();

    if (currentUser?.antitheftKey) {
      return currentUser.antitheftKey;
    }

    const urlantitheftKey = searchParams.get('antitheftKey');
    if (urlantitheftKey) {
      return urlantitheftKey;
    }

  };

  const antitheftKey = getantitheftKey();

  useEffect(() => {
    const initConfig = () => {
      try {
        const loadedConfig = getCurrentStoredConfig();
        setConfig(loadedConfig);
      } catch (error) {
        console.error('Failed to load config:', error);
        setConfig({
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
              textSecondary: "#666",
            },
          },
        });
      }
    };
    initConfig();
  }, []);

  useEffect(() => {
    console.log("hxzfjklbdrs jm,gbdrtf ",antitheftKey);
    
    if (antitheftKey) {
      fetchReports();
    }
  }, [antitheftKey]);

  const fetchReports = async () => {
  setLoading(true);
  setError(null);

  try {
    console.log('=== API CALL START: /api/antitheft/report-list ===');
    console.log('Request payload:', { antitheftKey: antitheftKey });
    console.log('Fetching reports for customer ID:', antitheftKey);

    const result = await authService.post('/api/antitheft/report-list', { 
      antitheftKey: antitheftKey 
    });

    console.log('=== API CALL COMPLETE: /api/antitheft/report-list ===');
    console.log('Response status:', result.success);
    console.log('Resjkjkponse data:', result.data);
    console.log('Reports response:', result);

    if (result.success && result.data) {
      console.log(`✓ Successfully fetched ${result.data.length} reports`);
      setReports(result.data);

      if (result.data.length > 0 && !selectedReport) {
        console.log('Auto-selecting first report:', result.data[0]._id);
        fetchReportDetails(result.data[0]._id);
      }
    } else {
      console.error('✗ Failed to fetch reports:', result.message);
      setError(result.message || 'Failed to fetch reports');
      setReports([]);
    }
  } catch (err) {
    console.error('=== API CALL ERROR: /api/antitheft/report-list ===');
    console.error('Error details:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    setError('Network error occurred while fetching reports');
    setReports([]);
  } finally {
    setLoading(false);
    console.log('=== API CALL END: /api/antitheft/report-list ===\n');
  }
};

const fetchReportDetails = async (reportId) => {
  if (!reportId) {
    console.error('✗ reportId is required but not provided');
    setError('Report ID is missing');
    return;
  }
  setReportLoading(true);
  setError(null);

  try {
    console.log('=== API CALL START: /api/antitheft/particular-report ===');
    console.log('Request payload:', { reportId: reportId });
    console.log('Fetching report details for ID:', reportId);

    const result = await authService.post('/api/antitheft/particular-report', { 
      reportId: reportId
    });

    console.log('=== API CALL COMPLETE: /api/antitheft/particular-report ===');
    console.log('Response status:', result.success);
    console.log('Response data:', result.data);
    console.log('Report details response:', result);

    if (result.success) {
      console.log('✓ Successfully fetched report details');
      console.log('Selected report ID:', result.data._id);
      setSelectedReport(result.data);
      if (window.innerWidth < 1024) {
        console.log('Mobile view detected - closing sidebar');
        setIsSidebarOpen(false);
      }
    } else {
      console.error('✗ Failed to fetch report details:', result.message);
      setError(result.message || 'Failed to fetch report details');
    }
  } catch (err) {
    console.error('=== API CALL ERROR: /api/antitheft/particular-report ===');
    console.error('Error details:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    setError('Network error occurred while fetching report details');
  } finally {
    setReportLoading(false);
    console.log('=== API CALL END: /api/antitheft/particular-report ===\n');
  }
};

  const handlePrint = () => {
    window.print();
  };

  const navigateToGoogleMaps = (lat, lng) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const getGoogleMapEmbedUrl = (lat, lng) => {
    if (!lat || !lng) return '';
    return `https://maps.google.com/maps?q=${lat},${lng}&t=m&z=15&output=embed&iwloc=addr&language=en`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options).replace(',', ' -');
  };

  const getTriggerSourceLabel = (source) => {
    switch (source) {
      case 'report_capture':
        return 'Report Capture';
      case 'pocket_detection':
        return 'Pocket Detection';
      case 'missing_device':
        return 'Missing Device';
      default:
        return source?.replace('_', ' ').toUpperCase() || 'Unknown';
    }
  };

  const generateReportNumber = (id) => {
    return `#${id.slice(-8).toUpperCase()}`;
  };

  const filterVisibleNetworks = (networks) => {
    if (!networks || !Array.isArray(networks)) return [];
    return networks.filter(network => 
      network.ssid && 
      network.ssid.trim() !== '' && 
      network.ssid !== '<unknown ssid>' &&
      network.ssid !== 'UNKNOWN'
    );
  };

  const openImageModal = (imageSrc, title) => {
    setSelectedImage({ src: imageSrc, title: title });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const ImageModal = ({ image, onClose }) => {
    if (!image) return null;

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-2 sm:p-4"
        onClick={onClose}
      >
        <div className="relative w-full h-full max-w-4xl max-h-full flex items-center justify-center">
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all duration-200 flex items-center justify-center"
          >
            <X className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
          <img 
            src={image.src}
            alt={image.title}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {image.title && (
            <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 bg-black bg-opacity-50 text-white p-2 sm:p-3 rounded-lg">
              <p className="text-center font-medium text-sm sm:text-base">{image.title}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!config) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4" style={{ backgroundColor: config?.theme?.colours?.bgColour || '#f9fafb' }}>
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2" style={{ borderColor: config?.theme?.colours?.primaryColour || '#1D4ED8' }}></div>
      </div>
    );
  }

  const colours = config?.theme?.colours || {};

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: colours.primaryCard }}>
          <h3 className="text-base sm:text-lg font-semibold truncate" style={{ color: colours.textPrimary }}>
            Reports
          </h3>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
            style={{ backgroundColor: colours.primaryCard }}
          >
            <X className="w-5 h-5" style={{ color: colours.textSecondary }} />
          </button>
        </div>
      )}

      <div className="p-4 border-b flex-shrink-0" style={{ borderColor: colours.primaryCard }}>
        <h3 className="font-semibold text-sm sm:text-base truncate" style={{ color: colours.textPrimary }}>
          {selectedReport?.report?.antitheftKey ? selectedReport.customer?.name || selectedReport.customer?.deviceInfo?.brand : 'Device Reports'}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 mx-auto" style={{ borderColor: colours.primaryColour }}></div>
            <p className="mt-2 text-xs sm:text-sm" style={{ color: colours.textSecondary }}>Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-4 text-center" style={{ color: colours.textSecondary }}>
            <p className="text-sm">No reports available</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: colours.secondaryCard }}>
            {reports.map((report, index) => (
              <div
                key={report._id}
                className="p-3 sm:p-4 cursor-pointer transition-all duration-200 border-b border-gray-700 hover:bg-gray-800 active:bg-gray-700"
                style={{
                  backgroundColor: selectedReport?._id === report._id ? colours?.primary : 'transparent'
                }}
                onClick={() => {
                  console.log('Selected report ID:', report._id);
                  if (report._id) {
                    fetchReportDetails(report._id);
                  } else {
                    console.error('Report ID is missing:', report);
                    setError('Invalid report selected');
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-black truncate">
                      Report #{index + 1}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(report.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 truncate">
                      Source: {report.triggerSource.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                    <div 
                      className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                        report.triggerSource === 'pocket_detection' 
                          ? 'bg-yellow-500' 
                          : 'bg-blue-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* {isMobile && (
        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: colours.primaryCard }}>
          <button 
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: colours.primaryCard }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: colours.textSecondary }} />
            <span style={{ color: colours.textSecondary }}>Back</span>
          </button>
        </div>
      )} */}
    </div>
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex" style={{ backgroundColor: colours.bgColour || '#f9fafb' }}>

      <ImageModal image={selectedImage} onClose={closeImageModal} />

      <div className="flex-1 w-full lg:pr-80 min-w-0">
        <div className="w-full p-3 sm:p-4 lg:p-6">
          <div className="w-full max-w-6xl mx-auto">
            
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-2">
                <button 
                  onClick={() => navigate(-1)}
                  className="hidden lg:block p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" style={{ color: colours.textSecondary }} />
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate" style={{ color: colours.textPrimary }}>
                    {selectedReport?.customer?.deviceInfo?.model || selectedReport?.customer?.deviceInfo?.brand || 'Device Reports'}
                  </h1>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 sm:p-4 rounded-lg border border-red-200 bg-red-50 text-red-600">
                <p className="text-sm sm:text-base break-words">{error}</p>
              </div>
            )}

            {reportLoading ? (
              <div className="w-full rounded-xl shadow-sm p-6 sm:p-8 text-center" style={{ backgroundColor: colours.sideBg }}>
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 mx-auto" style={{ borderColor: colours.primaryColour }}></div>
                <p className="mt-4 text-sm sm:text-base" style={{ color: colours.textSecondary }}>Loading report details...</p>
              </div>
            ) : selectedReport ? (
              <div className="w-full space-y-4 sm:space-y-6">
                
                <div className="w-full rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: colours.primaryCard }}>
                  <div className="w-full px-3 py-4 sm:px-4 sm:py-4 lg:px-6" style={{ background: `linear-gradient(135deg, ${colours.primaryColour} 0%, ${colours.secondaryColour} 100%)` }}>
                    <div className="w-full flex flex-col gap-3 sm:gap-4">
                      <div className="w-full" style={{ color: colours.bgColour }}>
                        <h2 className="text-base sm:text-lg lg:text-xl font-semibold truncate">
                          Security Report {generateReportNumber(selectedReport.report._id)}
                        </h2>
                        <p className="text-xs sm:text-sm opacity-90 mt-1 truncate">
                          {selectedReport.customer?.name} {selectedReport.customer?.deviceInfo?.brand} {selectedReport.customer?.deviceInfo?.model}
                        </p>
                      </div>
                      <div className="w-full flex flex-col sm:flex-row gap-2">
                        <button 
                          onClick={handlePrint}
                          className="cursor-pointer px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                          style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: colours.bgColour }}
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          <span className="truncate">Print Report</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="w-full px-3 py-3 sm:px-4 sm:py-4 lg:px-6 border-b flex flex-col gap-3 sm:gap-4" style={{ backgroundColor: colours.primaryCard, borderColor: colours.secondaryCard }}>
                    <div className="w-full flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => navigateToGoogleMaps(selectedReport.report.latitude, selectedReport.report.longitude)}
                          className="px-3 py-2 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-colors flex items-center gap-2"
                          style={{ backgroundColor: colours.secondaryCard, color: colours.textPrimary }}
                        >
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">View on Map</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: colours.textSecondary }}>
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">Generated on {formatDate(selectedReport.report.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: colours.primaryCard }}>
                  <div className="w-full p-3 sm:p-4 lg:p-6">
                    <div className="w-full flex items-center gap-2 mb-4">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: colours.primaryColour }} />
                      <h3 className="text-base sm:text-lg font-semibold" style={{ color: colours.textPrimary }}>Location Information</h3>
                    </div>
                    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="w-full">
                        {selectedReport.report.latitude && selectedReport.report.longitude ? (
                          <div className="w-full rounded-lg overflow-hidden h-48 sm:h-64 lg:h-80 shadow-sm">
                            <iframe
                              src={getGoogleMapEmbedUrl(selectedReport.report.latitude, selectedReport.report.longitude)}
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              allowFullScreen=""
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Device Location"
                            ></iframe>
                          </div>
                        ) : (
                          <div 
                            className="w-full rounded-lg h-48 sm:h-64 lg:h-80 flex items-center justify-center cursor-pointer transition-colors"
                            style={{ backgroundColor: colours.secondaryCard }}
                          >
                            <div className="text-center">
                              <MapPin className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2" style={{ color: colours.textSecondary }} />
                              <p className="font-medium text-sm sm:text-base" style={{ color: colours.textSecondary }}>Location not available</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="w-full space-y-3 sm:space-y-4">
                        <div className="w-full grid grid-cols-1 gap-3 sm:gap-4">
                          <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: colours.textSecondary }} />
                              <label className="text-xs sm:text-sm font-medium" style={{ color: colours.textSecondary }}>Latitude</label>
                            </div>
                            <p className="text-sm sm:text-lg font-semibold break-all" style={{ color: colours.textPrimary }}>
                              {selectedReport.report.latitude?.toFixed(6) || 'N/A'}
                            </p>
                          </div>
                          <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: colours.textSecondary }} />
                              <label className="text-xs sm:text-sm font-medium" style={{ color: colours.textSecondary }}>Longitude</label>
                            </div>
                            <p className="text-sm sm:text-lg font-semibold break-all" style={{ color: colours.textPrimary }}>
                              {selectedReport.report.longitude?.toFixed(6) || 'N/A'}
                            </p>
                          </div>
                          <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: colours.textSecondary }} />
                              <label className="text-xs sm:text-sm font-medium" style={{ color: colours.textSecondary }}>Accuracy</label>
                            </div>
                            <p className="text-sm sm:text-lg font-semibold" style={{ color: colours.textPrimary }}>
                              {selectedReport.report.accuracy ? `${selectedReport.report.accuracy}m` : 'N/A'}
                            </p>
                          </div>
                          <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                            <label className="text-xs sm:text-sm font-medium flex items-center gap-2 mb-2" style={{ color: colours.textSecondary }}>
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                              </svg>
                              Public IP
                            </label>
                            <p className="text-sm sm:text-lg font-semibold break-all" style={{ color: colours.textPrimary }}>
                              {selectedReport.report.publicIpAddress || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {(selectedReport.report.frontPhoto || selectedReport.report.backPhoto) && (
                  <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: colours.primaryCard }}>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5" style={{ color: colours.primaryColour }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-lg font-semibold" style={{ color: colours.textPrimary }}>
                          Captured Photos
                        </h3>
                      </div>
        
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedReport.report.frontPhoto && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Front Photo</label>
                            <div className="rounded-lg overflow-hidden shadow-sm">
                              <img 
                                src={getImageUrl(selectedReport.report.frontPhoto)} 
                                alt="Front Photo" 
                                className="w-full h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => openImageModal(getImageUrl(selectedReport.report.frontPhoto), 'Front Photo')}
                                onError={(e) => {
                                  console.error('Failed to load front photo:', getImageUrl(selectedReport.report.frontPhoto));
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div 
                                className="w-full h-64 flex items-center justify-center bg-gray-100 text-gray-500" 
                                style={{ display: 'none', backgroundColor: colours.secondaryCard }}
                              >
                                <div className="text-center">
                                  <svg className="w-12 h-12 mx-auto mb-2" style={{ color: colours.textSecondary }} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                  <p className="text-sm" style={{ color: colours.textSecondary }}>Image not available</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {selectedReport.report.backPhoto && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Back Photo</label>
                            <div className="rounded-lg overflow-hidden shadow-sm">
                              <img 
                                src={getImageUrl(selectedReport.report.backPhoto)} 
                                alt="Back Photo" 
                                className="w-full h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => openImageModal(getImageUrl(selectedReport.report.backPhoto), 'Back Photo')}
                                onError={(e) => {
                                  console.error('Failed to load back photo:', getImageUrl(selectedReport.report.backPhoto));
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div 
                                className="w-full h-64 flex items-center justify-center bg-gray-100 text-gray-500" 
                                style={{ display: 'none', backgroundColor: colours.secondaryCard }}
                              >
                                <div className="text-center">
                                  <svg className="w-12 h-12 mx-auto mb-2" style={{ color: colours.textSecondary }} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                  <p className="text-sm" style={{ color: colours.textSecondary }}>Image not available</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="w-full rounded-xl shadow-sm p-3 sm:p-4 lg:p-6" style={{ backgroundColor: colours.primaryCard }}>
                  <div className="w-full flex items-center gap-2 mb-4">
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: colours.primaryColour }} />
                    <h3 className="text-base sm:text-lg font-semibold" style={{ color: colours.textPrimary }}>Device Information</h3>
                  </div>
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-xs sm:text-sm font-medium" style={{ color: colours.textSecondary }}>Owner</label>
                      <p className="text-sm sm:text-lg font-semibold mt-1 break-words" style={{ color: colours.textPrimary }}>
                        {selectedReport.customer?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-xs sm:text-sm font-medium" style={{ color: colours.textSecondary }}>Device Model</label>
                      <p className="text-sm sm:text-lg font-semibold mt-1 break-words" style={{ color: colours.textPrimary }}>
                        {selectedReport.customer?.deviceInfo?.model || 'N/A'}
                      </p>
                    </div>
                    <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-xs sm:text-sm font-medium" style={{ color: colours.textSecondary }}>Brand</label>
                      <p className="text-sm sm:text-lg font-semibold mt-1 break-words" style={{ color: colours.textPrimary }}>
                        {selectedReport.customer?.deviceInfo?.brand || selectedReport.customer?.deviceInfo?.manufacturer || 'N/A'}
                      </p>
                    </div>
                    <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-xs sm:text-sm font-medium" style={{ color: colours.textSecondary }}>Android Version</label>
                      <p className="text-sm sm:text-lg font-semibold mt-1" style={{ color: colours.textPrimary }}>
                        {selectedReport.customer?.deviceInfo?.androidVersion || 'N/A'}
                      </p>
                    </div>
                    <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-xs sm:text-sm font-medium" style={{ color: colours.textSecondary }}>Total RAM</label>
                      <p className="text-sm sm:text-lg font-semibold mt-1" style={{ color: colours.textPrimary }}>
                        {selectedReport.customer?.deviceInfo?.totalRAM || 'N/A'}
                      </p>
                    </div>
                    <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-xs sm:text-sm font-medium" style={{ color: colours.textSecondary }}>Storage</label>
                      <p className="text-sm sm:text-lg font-semibold mt-1" style={{ color: colours.textPrimary }}>
                        {selectedReport.customer?.deviceInfo?.availableStorage || selectedReport.customer?.deviceInfo?.totalStorage || 'N/A'}
                      </p>
                    </div>
                    <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-xs sm:text-sm font-medium" style={{ color: colours.textSecondary }}>Report Type</label>
                      <p className="text-sm sm:text-lg font-semibold mt-1 break-words" style={{ color: colours.textPrimary }}>
                        {getTriggerSourceLabel(selectedReport.report.triggerSource)}
                      </p>
                    </div>
                    <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-xs sm:text-sm font-medium" style={{ color: colours.textSecondary }}>Report ID</label>
                      <p className="text-sm sm:text-lg font-semibold mt-1 break-all" style={{ color: colours.textPrimary }}>
                        {generateReportNumber(selectedReport.report._id)}
                      </p>
                    </div>
                    <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-xs sm:text-sm font-medium" style={{ color: colours.textSecondary }}>Created At</label>
                      <p className="text-sm sm:text-lg font-semibold mt-1 break-words" style={{ color: colours.textPrimary }}>
                        {formatDate(selectedReport.report.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full rounded-xl shadow-sm p-3 sm:p-4 lg:p-6" style={{ backgroundColor: colours.primaryCard }}>
                  <div className="w-full flex items-center gap-2 mb-4">
                    <Wifi className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: colours.primaryColour }} />
                    <h3 className="text-base sm:text-lg font-semibold" style={{ color: colours.textPrimary }}>Network Information</h3>
                  </div>
                  <div className="w-full grid grid-cols-1 gap-3 sm:gap-4">
                    <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-xs sm:text-sm font-medium" style={{ color: colours.textSecondary }}>Connected WiFi</label>
                      <p className="text-sm sm:text-lg font-semibold mt-1 break-all" style={{ color: colours.textPrimary }}>
                        {selectedReport.report.connectedWifi || 'N/A'}
                      </p>
                    </div>
                    <div className="w-full p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-xs sm:text-sm font-medium" style={{ color: colours.textSecondary }}>SIM Provider</label>
                      <p className="text-sm sm:text-lg font-semibold mt-1 break-words" style={{ color: colours.textPrimary }}>
                        {selectedReport.report.simProvider || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {(() => {
                  const visibleNetworks = filterVisibleNetworks(selectedReport.report.nearbyWifiNetworks);
                  return visibleNetworks.length > 0 ? (
                    <div className="w-full rounded-xl shadow-sm p-3 sm:p-4 lg:p-6" style={{ backgroundColor: colours.primaryCard }}>
                      <div className="w-full flex flex-col gap-2 sm:gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Wifi className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: colours.primaryColour }} />
                          <h3 className="text-base sm:text-lg font-semibold" style={{ color: colours.textPrimary }}>
                            Nearby WiFi Networks
                          </h3>
                        </div>
                        <span className="px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium w-fit" style={{ backgroundColor: colours.secondaryCard, color: colours.textPrimary }}>
                          {visibleNetworks.length} networks
                        </span>
                      </div>

                      <div className="w-full space-y-3">
                        {visibleNetworks.slice(0, 10).map((network, index) => (
                          <div key={index} className="w-full p-3 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                            <div className="w-full flex justify-between items-start mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate" style={{ color: colours.textPrimary }}>
                                  {network.ssid}
                                </h4>
                              </div>
                              <div className="flex ml-2 flex-shrink-0">
                                {[1, 2, 3, 4].map((bar) => (
                                  <div
                                    key={bar}
                                    className={`w-1 h-3 mx-px rounded ${
                                      network.level > -50 ? 'bg-green-500' :
                                      network.level > -70 && bar <= 2 ? 'bg-yellow-500' :
                                      network.level <= -70 && bar === 1 ? 'bg-red-500' :
                                      'bg-gray-300'
                                    }`}
                                    style={{ height: `${bar * 3 + 2}px` }}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="w-full grid grid-cols-2 gap-2 text-xs">
                              <div className="min-w-0">
                                <span className="text-xs" style={{ color: colours.textSecondary }}>Signal:</span>
                                <p className="font-medium truncate" style={{ color: colours.textPrimary }}>{network.level} dBm</p>
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs" style={{ color: colours.textSecondary }}>Frequency:</span>
                                <p className="font-medium truncate" style={{ color: colours.textPrimary }}>{network.frequency} MHz</p>
                              </div>
                            </div>
                            <div className="w-full mt-2">
                              <span className="text-xs" style={{ color: colours.textSecondary }}>Security:</span>
                              <p className="text-xs mt-1 truncate" style={{ color: colours.textPrimary }} title={network.capabilities}>
                                {network.capabilities}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            ) : (
              <div className="w-full rounded-xl shadow-sm p-6 sm:p-8 text-center" style={{ backgroundColor: colours.primaryCard }}>
                <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" style={{ color: colours.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm sm:text-base" style={{ color: colours.textSecondary }}>Select a report from the sidebar to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
        style={{ backgroundColor: colours.primaryColour }}
      >
        <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </button>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`lg:hidden fixed top-0 right-0 h-full w-72 sm:w-80 z-50 transform transition-transform duration-300 ease-in-out shadow-xl ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`} style={{ backgroundColor: colours.sideBg }}>
        <SidebarContent isMobile={true} />
      </div>

      <div className="hidden lg:block fixed top-0 right-0 w-80 h-screen z-20 flex flex-col shadow-xl overflow-hidden" style={{ backgroundColor: colours.sideBg }}>
        <SidebarContent isMobile={false} />
      </div>
    </div>
  );
};

export default Reports;
