import React from 'react';
import ResponsiveLayout from './ResponsiveLayout';
import MobileLayout from './MobileLayout';
import useResponsive from '../hooks/useResponsive';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isMobile } = useResponsive();

  // Use MobileLayout for mobile devices, ResponsiveLayout for desktop/tablet
  if (isMobile) {
    return (
      <MobileLayout>
        {children}
      </MobileLayout>
    );
  }

  return (
    <ResponsiveLayout>
      {children}
    </ResponsiveLayout>
  );
};

export default Layout;
