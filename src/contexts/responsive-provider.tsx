'use client';

import { useMediaQuery } from '@chakra-ui/react';
import { createContext, useContext } from 'react';

type ResponsiveContextType = {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
};

const ResponsiveContext = createContext<ResponsiveContextType>({
  isMobile: false,
  isTablet: false,
  isDesktop: false,
});

export const ResponsiveProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isMobile, isTablet, isDesktop] = useMediaQuery(
    [
      '(max-width: 768px)',
      '(min-width: 769px) and (max-width: 1024px)',
      '(min-width: 1025px)',
    ],
    {
      // Return false on the server, and re-evaluate on the client side
      fallback: [false, false, false],
    }
  );

  return (
    <ResponsiveContext.Provider value={{ isMobile, isTablet, isDesktop }}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsive = () => useContext(ResponsiveContext);
