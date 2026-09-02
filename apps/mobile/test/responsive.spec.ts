import * as ReactNative from 'react-native';
import { useResponsive } from '../src/hooks/useResponsive';

describe('Responsive Layout Hook', () => {
  afterEach(() => {
    (ReactNative.useWindowDimensions as jest.Mock).mockReturnValue({
      width: 375,
      height: 812,
      scale: 2,
      fontScale: 1,
    });
  });

  it('should detect mobile viewport correctly for width < 768', () => {
    (ReactNative.useWindowDimensions as jest.Mock).mockReturnValue({
      width: 375,
      height: 812,
      scale: 2,
      fontScale: 1,
    });
    const res = useResponsive();

    expect(res.isMobile).toBe(true);
    expect(res.isTablet).toBe(false);
    expect(res.isDesktop).toBe(false);
    expect(res.breakpoint).toBe('mobile');
    expect(res.columns).toBe(1);
    expect(res.containerMaxWidth).toBe(375);
  });

  it('should detect tablet viewport correctly for 768 <= width < 1024', () => {
    (ReactNative.useWindowDimensions as jest.Mock).mockReturnValue({
      width: 800,
      height: 1024,
      scale: 2,
      fontScale: 1,
    });
    const res = useResponsive();

    expect(res.isMobile).toBe(false);
    expect(res.isTablet).toBe(true);
    expect(res.isDesktop).toBe(false);
    expect(res.breakpoint).toBe('tablet');
    expect(res.columns).toBe(2);
    expect(res.containerMaxWidth).toBe(840);
  });

  it('should detect desktop viewport correctly for width >= 1024', () => {
    (ReactNative.useWindowDimensions as jest.Mock).mockReturnValue({
      width: 1440,
      height: 900,
      scale: 2,
      fontScale: 1,
    });
    const res = useResponsive();

    expect(res.isMobile).toBe(false);
    expect(res.isTablet).toBe(false);
    expect(res.isDesktop).toBe(true);
    expect(res.breakpoint).toBe('desktop');
    expect(res.columns).toBe(3);
    expect(res.containerMaxWidth).toBe(1200);
  });
});
