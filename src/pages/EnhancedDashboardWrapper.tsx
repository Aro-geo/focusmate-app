import React from 'react';
import AnimatedPage from '../components/AnimatedPage';
import MobileDashboard from '../components/MobileDashboard';
import useResponsive from '../hooks/useResponsive';

// Import the actual EnhancedDashboard content
import EnhancedDashboardDesktop from './EnhancedDashboard';

const EnhancedDashboard: React.FC = () => {
  const { isMobile } = useResponsive();

  // Use mobile-optimized dashboard for mobile devices
  if (isMobile) {
    return (
      <AnimatedPage>
        <MobileDashboard />
      </AnimatedPage>
    );
  }

  // Use desktop dashboard for larger screens
  return <EnhancedDashboardDesktop />;
};

export default EnhancedDashboard;
