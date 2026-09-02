import type React from 'react';

// Mock react-native for Node test environment
const mockRN = {
  Platform: {
    OS: 'ios',
    select: (objs: { ios?: unknown; android?: unknown; default?: unknown }) =>
      objs.ios ?? objs.default ?? {},
  },
  StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T): T => styles,
    flatten: <T>(style: T): T => style,
  },
  useWindowDimensions: jest.fn(() => ({
    width: 375,
    height: 812,
    scale: 2,
    fontScale: 1,
  })),
  View: (props: { children?: React.ReactNode }) => {
    const ReactModule = require('react');
    return ReactModule.createElement('View', props, props.children);
  },
  Text: (props: { children?: React.ReactNode }) => {
    const ReactModule = require('react');
    return ReactModule.createElement('Text', props, props.children);
  },
  TouchableOpacity: (props: { children?: React.ReactNode }) => {
    const ReactModule = require('react');
    return ReactModule.createElement('TouchableOpacity', props, props.children);
  },
  ScrollView: (props: { children?: React.ReactNode }) => {
    const ReactModule = require('react');
    return ReactModule.createElement('ScrollView', props, props.children);
  },
  TextInput: (props: { children?: React.ReactNode }) => {
    const ReactModule = require('react');
    return ReactModule.createElement('TextInput', props, props.children);
  },
  ActivityIndicator: (props: { children?: React.ReactNode }) => {
    const ReactModule = require('react');
    return ReactModule.createElement('ActivityIndicator', props, props.children);
  },
};

jest.mock('react-native', () => mockRN);

// Mock expo-router
jest.mock('expo-router', () => {
  const ReactModule = require('react');

  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    usePathname: () => '/(tabs)',
    Stack: Object.assign(
      (props: { children?: React.ReactNode }) =>
        ReactModule.createElement('Stack', props, props.children),
      {
        Screen: (props: Record<string, unknown>) =>
          ReactModule.createElement('Stack.Screen', props),
      },
    ),
    Tabs: Object.assign(
      (props: { children?: React.ReactNode }) =>
        ReactModule.createElement('Tabs', props, props.children),
      {
        Screen: (props: Record<string, unknown>) => ReactModule.createElement('Tabs.Screen', props),
      },
    ),
    Redirect: (props: Record<string, unknown>) => ReactModule.createElement('Redirect', props),
  };
});

// Mock expo-status-bar
jest.mock('expo-status-bar', () => {
  const ReactModule = require('react');
  return {
    StatusBar: (props: Record<string, unknown>) => ReactModule.createElement('StatusBar', props),
  };
});
