import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import { loadConfig } from '../utils/configLoader';

const Layout = () => {
  const [config, setConfig] = useState(null);
  const [isOpen, setIsOpen] = useState(false); 
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configData = await loadConfig();
        setConfig(configData);
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };

    fetchConfig();
  }, []);

  const colors = config?.theme?.colours || {
    bgColour: "#FFFFFF",
    primaryColour: "#1D4ED8"
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <main 
        style={{ 
          flex: 1, 
          overflowY: 'auto',
          backgroundColor: colors.bgColour
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
