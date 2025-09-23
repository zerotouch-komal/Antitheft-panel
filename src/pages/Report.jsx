import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getCurrentStoredConfig } from '../utils/configLoader';
import { authService } from '../services/AuthService';
import { ChevronLeft, X, MapPin, Clock, Wifi, Shield, Smartphone } from 'lucide-react';

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
  const navigate = useNavigate();
  const mapRef = useRef(null);

const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If the path already includes the full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Remove leading slash if present and construct full URL
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `${baseURL}/${cleanPath}`;
  };

  // Your existing functions remain the same...
  const getCustomerId = () => {
    const authData = authService.getAuthData();
    const currentUser = authService.getCurrentUser();
    
    if (currentUser?.id) {
      return currentUser.id;
    }
    
    const urlCustomerId = searchParams.get('customerId');
    if (urlCustomerId) {
      return urlCustomerId;
    }
    
  };


  const customerId = getCustomerId();

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
    if (customerId) {
      fetchReports();
    }
  }, [customerId]);


  const fetchReports = async () => {
  setLoading(true);
  setError(null);
  
  try {
    console.log('Fetching reports for customer ID:', customerId);
    
    const result = await authService.post('/report-list', { 
      customerId: customerId 
    });
    
    console.log('Reports response:', result);
    
    if (result.success && result.data) {
      setReports(result.data);
      
      if (result.data.length > 0 && !selectedReport) {
        console.log('Auto-selecting first report:', result.data[0]._id);
        fetchReportDetails(result.data[0]._id);
      }
    } else {
      setError(result.message || 'Failed to fetch reports');
      setReports([]);
    }
  } catch (err) {
    console.error('Error fetching reports:', err);
    setError('Network error occurred while fetching reports');
    setReports([]);
  } finally {
    setLoading(false);
  }
};

  const fetchReportDetails = async (reportId) => {
  if (!reportId) {
    console.error('reportId is required');
    setError('Report ID is missing');
    return;
  }

  setReportLoading(true);
  setError(null);
  
  try {
    console.log('Fetching report details for ID:', reportId);
    
    const result = await authService.post('/particular-report', { 
      reportId: reportId
    });
    
    console.log('Report details response:', result);
    
    if (result.success) {
      setSelectedReport(result.data);
    } else {
      setError(result.message || 'Failed to fetch report details');
    }
  } catch (err) {
    console.error('Error fetching report details:', err);
    setError('Network error occurred while fetching report details');
  } finally {
    setReportLoading(false);
  }
};

const formatTriggerSource = (triggerSource) => {
  switch (triggerSource) {
    case 'pocket_detection':
      return 'Pocket Detection';
    case 'report_capture':
      return 'Report Capture';
    default:
      return triggerSource.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  const getTriggerSourceColor = (source) => {
    const colors = config?.theme?.colours || {};
    switch (source) {
      case 'report_capture':
        return colors.primaryColour || '#1D4ED8';
      case 'pocket_detection':
        return colors.secondaryColour || '#3B82F6';
      case 'missing_device':
        return colors.warningColour || '#DC2626';
      default:
        return colors.tertiaryColour || '#1E3A8A';
    }
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

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: config?.theme?.colours?.bgColour || '#f9fafb' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: config?.theme?.colours?.primaryColour || '#1D4ED8' }}></div>
      </div>
    );
  }

  const colours = config?.theme?.colours || {};

  const SidebarContent = ({ isMobile = false }) => (
    <>
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colours.primaryCard }}>
          <h3 className="text-lg font-semibold" style={{ color: colours.textPrimary }}>
            Reports
          </h3>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ backgroundColor: colours.primaryCard }}
          >
            <X className="w-5 h-5" style={{ color: colours.textSecondary }} />
          </button>
        </div>
      )}
      
      <div className="p-4 border-b" style={{ borderColor: colours.primaryCard }}>
        <h3 className="font-semibold" style={{ color: colours.textPrimary }}>
          {selectedReport?.report?.customerId ? selectedReport.customer?.name || selectedReport.customer?.deviceInfo?.brand : 'Device Reports'}
        </h3>
        {/* <p className="text-sm mt-1" style={{ color: colours.textSecondary }}>
          {reports.length} of {reports.length} - {Math.max(18 - reports.length, 0)} slots available
        </p> */}
      </div>
      
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: colours.primaryColour }}></div>
            <p className="mt-2 text-sm" style={{ color: colours.textSecondary }}>Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-4 text-center" style={{ color: colours.textSecondary }}>
            <p>No reports available</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: colours.secondaryCard }}>
            {reports.map((report, index) => (
  <div
    key={report._id}
    className="p-4 cursor-pointer transition-all duration-200 border-b border-gray-700 hover:bg-gray-800"
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
      <div>
        <div className="text-sm font-medium text-white">
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
        <div className="text-xs text-gray-300 mt-1">
          Source: {report.triggerSource.replace('_', ' ').toUpperCase()}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div 
          className={`w-3 h-3 rounded-full ${
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
      {isMobile && (
        <div className="p-4 border-t" style={{ borderColor: colours.primaryCard }}>
          <button 
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: colours.primaryCard }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: colours.textSecondary }} />
            <span style={{ color: colours.textSecondary }}>Back</span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colours.bgColour || '#f9fafb' }}>
      <div className="flex-1 lg:pr-80">
        <div className="p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <button 
                  onClick={() => navigate(-1)}
                  className="hidden lg:block p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" style={{ color: colours.textSecondary }} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: colours.textPrimary }}>
                    {selectedReport?.customer?.deviceInfo?.model || selectedReport?.customer?.deviceInfo?.brand || 'Device Reports'}
                  </h1>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-600">
                <p>{error}</p>
              </div>
            )}

            {reportLoading ? (
              <div className="rounded-xl shadow-sm p-8 text-center" style={{ backgroundColor: colours.sideBg }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: colours.primaryColour }}></div>
                <p className="mt-4" style={{ color: colours.textSecondary }}>Loading report details...</p>
              </div>
            ) : selectedReport ? (
              <div className="space-y-6">
                <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: colours.primaryCard }}>
                  <div className="px-6 py-4" style={{ background: `linear-gradient(135deg, ${colours.primaryColour} 0%, ${colours.secondaryColour} 100%)` }}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div style={{ color: colours.bgColour }}>
                        <h2 className="text-xl font-semibold">
                          Security Report {generateReportNumber(selectedReport.report._id)}
                        </h2>
                        <p className="text-sm opacity-90 mt-1">
                          {selectedReport.customer?.name} • {selectedReport.customer?.deviceInfo?.brand} {selectedReport.customer?.deviceInfo?.model}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handlePrint}
                          className="cursor-pointer px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                          style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: colours.bgColour }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print Report
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-b flex flex-col sm:flex-row gap-4 justify-between" style={{ backgroundColor: colours.primaryCard, borderColor: colours.secondaryCard }}>
                    <div className="flex gap-2 flex-wrap">
                      <button className="px-4 py-2 rounded-lg font-medium text-sm transition-colors" style={{ backgroundColor: colours.primaryColour, color: colours.bgColour }}>
                        View details
                      </button>
                      <button 
                        onClick={() => navigateToGoogleMaps(selectedReport.report.latitude, selectedReport.report.longitude)}
                        className="px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                        style={{ backgroundColor: colours.secondaryCard, color: colours.textPrimary }}
                      >
                        <MapPin className="w-4 h-4" />
                        View on Map
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: colours.textSecondary }}>
                      <Clock className="w-4 h-4" />
                      Generated on {formatDate(selectedReport.report.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: colours.primaryCard }}>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5" style={{ color: colours.primaryColour }} />
                      <h3 className="text-lg font-semibold" style={{ color: colours.textPrimary }}>Location Information</h3>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className="relative">
                        {selectedReport.report.latitude && selectedReport.report.longitude ? (
                          <div className="rounded-lg overflow-hidden h-64 lg:h-80 shadow-sm">
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
                            className="rounded-lg h-64 lg:h-80 flex items-center justify-center cursor-pointer transition-colors"
                            style={{ backgroundColor: colours.secondaryCard }}
                          >
                            <div className="text-center">
                              <MapPin className="w-12 h-12 mx-auto mb-2" style={{ color: colours.textSecondary }} />
                              <p className="font-medium" style={{ color: colours.textSecondary }}>Location not available</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4" style={{ color: colours.textSecondary }} />
                              <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Latitude</label>
                            </div>
                            <p className="text-lg font-semibold" style={{ color: colours.textPrimary }}>
                              {selectedReport.report.latitude?.toFixed(6) || 'N/A'}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4" style={{ color: colours.textSecondary }} />
                              <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Longitude</label>
                            </div>
                            <p className="text-lg font-semibold" style={{ color: colours.textPrimary }}>
                              {selectedReport.report.longitude?.toFixed(6) || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="w-4 h-4" style={{ color: colours.textSecondary }} />
                              <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Accuracy</label>
                            </div>
                            <p className="text-lg font-semibold" style={{ color: colours.textPrimary }}>
                              {selectedReport.report.accuracy ? `${selectedReport.report.accuracy}m` : 'N/A'}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                            <label className="text-sm font-medium flex items-center gap-2 mb-2" style={{ color: colours.textSecondary }}>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                              </svg>
                              Public IP
                            </label>
                            <p className="text-lg font-semibold" style={{ color: colours.textPrimary }}>
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
                        {/* Front Photo */}
                        {selectedReport.report.frontPhoto && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Front Photo</label>
                            <div className="rounded-lg overflow-hidden shadow-sm">
                              <img 
                                src={getImageUrl(selectedReport.report.frontPhoto)} 
                                alt="Front Photo" 
                                className="w-full h-64 object-cover"
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

                        {/* Back Photo */}
                        {selectedReport.report.backPhoto && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Back Photo</label>
                            <div className="rounded-lg overflow-hidden shadow-sm">
                              <img 
                                src={getImageUrl(selectedReport.report.backPhoto)} 
                                alt="Back Photo" 
                                className="w-full h-64 object-cover"
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

                <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: colours.primaryCard }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Smartphone className="w-5 h-5" style={{ color: colours.primaryColour }} />
                    <h3 className="text-lg font-semibold" style={{ color: colours.textPrimary }}>Device Information</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Owner</label>
                      <p className="text-lg font-semibold mt-1" style={{ color: colours.textPrimary }}>
                        {selectedReport.customer?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Device Model</label>
                      <p className="text-lg font-semibold mt-1" style={{ color: colours.textPrimary }}>
                        {selectedReport.customer?.deviceInfo?.model || 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Brand</label>
                      <p className="text-lg font-semibold mt-1" style={{ color: colours.textPrimary }}>
                        {selectedReport.customer?.deviceInfo?.brand || selectedReport.customer?.deviceInfo?.manufacturer || 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Android Version</label>
                      <p className="text-lg font-semibold mt-1" style={{ color: colours.textPrimary }}>
                        {selectedReport.customer?.deviceInfo?.androidVersion || 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Total RAM</label>
                      <p className="text-lg font-semibold mt-1" style={{ color: colours.textPrimary }}>
                        {selectedReport.customer?.deviceInfo?.totalRAM || 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Storage</label>
                      <p className="text-lg font-semibold mt-1" style={{ color: colours.textPrimary }}>
                        {selectedReport.customer?.deviceInfo?.availableStorage || selectedReport.customer?.deviceInfo?.totalStorage || 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Report Type</label>
                      <p className="text-lg font-semibold mt-1" style={{ color: colours.textPrimary }}>
                        {getTriggerSourceLabel(selectedReport.report.triggerSource)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Report ID</label>
                      <p className="text-lg font-semibold mt-1" style={{ color: colours.textPrimary }}>
                        {generateReportNumber(selectedReport.report._id)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Created At</label>
                      <p className="text-lg font-semibold mt-1" style={{ color: colours.textPrimary }}>
                        {formatDate(selectedReport.report.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>


                {/* Network Information Card */}
                <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: colours.primaryCard }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Wifi className="w-5 h-5" style={{ color: colours.primaryColour }} />
                    <h3 className="text-lg font-semibold" style={{ color: colours.textPrimary }}>Network Information</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>Connected WiFi</label>
                      <p className="text-lg font-semibold mt-1" style={{ color: colours.textPrimary }}>
                        {selectedReport.report.connectedWifi || 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                      <label className="text-sm font-medium" style={{ color: colours.textSecondary }}>SIM Provider</label>
                      <p className="text-lg font-semibold mt-1" style={{ color: colours.textPrimary }}>
                        {selectedReport.report.simProvider || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>


                {/* Nearby WiFi Networks Card - Modified to filter out hidden networks */}
                {(() => {
                  const visibleNetworks = filterVisibleNetworks(selectedReport.report.nearbyWifiNetworks);
                  return visibleNetworks.length > 0 ? (
                    <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: colours.primaryCard }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Wifi className="w-5 h-5" style={{ color: colours.primaryColour }} />
                          <h3 className="text-lg font-semibold" style={{ color: colours.textPrimary }}>
                            Nearby WiFi Networks
                          </h3>
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: colours.secondaryCard, color: colours.textPrimary }}>
                          {visibleNetworks.length} networks
                        </span>
                      </div>
                      
                      {/* Mobile view - Cards */}
                      <div className="block md:hidden space-y-3">
                        {visibleNetworks.slice(0, 10).map((network, index) => (
                          <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: colours.secondaryCard }}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium" style={{ color: colours.textPrimary }}>
                                  {network.ssid}
                                </h4>
                              </div>
                              <div className="flex">
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
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-xs" style={{ color: colours.textSecondary }}>Signal:</span>
                                <p className="font-medium" style={{ color: colours.textPrimary }}>{network.level} dBm</p>
                              </div>
                              <div>
                                <span className="text-xs" style={{ color: colours.textSecondary }}>Frequency:</span>
                                <p className="font-medium" style={{ color: colours.textPrimary }}>{network.frequency} MHz</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <span className="text-xs" style={{ color: colours.textSecondary }}>Security:</span>
                              <p className="text-xs mt-1 truncate" style={{ color: colours.textPrimary }} title={network.capabilities}>
                                {network.capabilities}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>


                      {/* Desktop view - Scrollable Table */}
                      <div className="hidden md:block">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b" style={{ borderColor: colours.secondaryCard }}>
                                <th className="text-left py-3 px-2 font-medium" style={{ color: colours.textPrimary }}>SSID</th>
                                <th className="text-left py-3 px-2 font-medium" style={{ color: colours.textPrimary }}>Signal</th>
                                <th className="text-left py-3 px-2 font-medium" style={{ color: colours.textPrimary }}>Frequency</th>
                                <th className="text-left py-3 px-2 font-medium" style={{ color: colours.textPrimary }}>Security</th>
                              </tr>
                            </thead>
                            <tbody>
                              {visibleNetworks.slice(0, 20).map((network, index) => (
                                <tr key={index} className="border-b" style={{ borderColor: colours.secondaryCard }}>
                                  <td className="py-3 px-2" style={{ color: colours.textPrimary }}>
                                    {network.ssid}
                                  </td>
                                  <td className="py-3 px-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        network.level > -50 ? 'bg-green-100 text-green-800' :
                                        network.level > -70 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {network.level} dBm
                                      </span>
                                      <div className="flex">
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
                                  </td>
                                  <td className="py-3 px-2" style={{ color: colours.textPrimary }}>{network.frequency} MHz</td>
                                  <td className="py-3 px-2 text-xs" style={{ color: colours.textSecondary }}>
                                    <div className="max-w-32 truncate" title={network.capabilities}>
                                      {network.capabilities}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            ) : (
              <div className="rounded-xl shadow-sm p-8 text-center" style={{ backgroundColor: colours.primaryCard }}>
                <svg className="w-16 h-16 mx-auto mb-4" style={{ color: colours.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p style={{ color: colours.textSecondary }}>Select a report from the sidebar to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-30 w-12 h-12 rounded-lg flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
        style={{ backgroundColor: colours.primaryColour }}
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>


      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}


      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed top-0 right-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out shadow-xl ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`} style={{ backgroundColor: colours.sideBg }}>
        <SidebarContent isMobile={true} />
      </div>


      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed top-0 right-0 w-80 h-screen z-20 flex flex-col shadow-xl" style={{ backgroundColor: colours.sideBg }}>
        <SidebarContent isMobile={false} />
      </div>
    </div>
  );
};


export default Reports;
