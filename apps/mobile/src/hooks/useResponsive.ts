import { useWindowDimensions } from 'react-native';
import type { Breakpoint } from '../types/ui';

export interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  columns: number;
  containerMaxWidth: number;
  spacingMultiplier: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const isWide = width >= 768;

  let breakpoint: Breakpoint = 'mobile';
  if (isDesktop) {
    breakpoint = 'desktop';
  } else if (isTablet) {
    breakpoint = 'tablet';
  }

  const columns = isDesktop ? 3 : isTablet ? 2 : 1;
  const containerMaxWidth = isDesktop ? 1200 : isTablet ? 840 : width;
  const spacingMultiplier = isDesktop ? 1.25 : isTablet ? 1.1 : 1;

  return {
    width,
    height,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    columns,
    containerMaxWidth,
    spacingMultiplier,
  };
}
