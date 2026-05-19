'use client'

import { create } from 'zustand'

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive';
  }>;
}

interface UIState {
  // Theme and appearance
  theme: 'light' | 'dark' | 'system';
  actualTheme: 'light' | 'dark'; // Computed theme after system detection
  reducedMotion: boolean;
  
  // Layout and navigation
  sidebarOpen: boolean;
  bottomSheetOpen: boolean;
  activeSheet: string | null;
  
  // Loading and feedback states
  isLoading: boolean;
  loadingMessage: string;
  notifications: Notification[];
  
  // Mobile-specific
  isMobile: boolean;
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline: boolean;
  
  // Accessibility
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  highContrast: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
  
  // Interactions
  isTyping: boolean;
  lastInteraction: number;
  hapticEnabled: boolean;
  soundEnabled: boolean;
  
  // Service request states
  showServiceHistory: boolean;
  activeServicePanel: string | null;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setActualTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Bottom sheet management
  openBottomSheet: (sheetId: string) => void;
  closeBottomSheet: () => void;
  
  // Loading states
  setLoading: (loading: boolean, message?: string) => void;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Device and screen
  setScreenSize: (size: 'sm' | 'md' | 'lg' | 'xl' | '2xl') => void;
  setIsMobile: (mobile: boolean) => void;
  setOnlineStatus: (online: boolean) => void;
  
  // Accessibility
  setFontSize: (size: 'sm' | 'base' | 'lg' | 'xl') => void;
  setHighContrast: (enabled: boolean) => void;
  enableKeyboardNavigation: () => void;
  setScreenReader: (enabled: boolean) => void;
  
  // Interactions
  updateLastInteraction: () => void;
  setHaptic: (enabled: boolean) => void;
  setSound: (enabled: boolean) => void;
  
  // Service panels
  setShowServiceHistory: (show: boolean) => void;
  setActiveServicePanel: (panelId: string | null) => void;
  
  // Computed
  isDarkMode: () => boolean;
  isTouchDevice: () => boolean;
  shouldReduceMotion: () => boolean;
  getNotificationCount: () => number;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useUIState = create<UIState>((set, get) => ({
  // Initial state
  theme: 'system',
  actualTheme: 'light',
  reducedMotion: false,
  sidebarOpen: false,
  bottomSheetOpen: false,
  activeSheet: null,
  isLoading: false,
  loadingMessage: '',
  notifications: [],
  isMobile: typeof window !== 'undefined' && window.innerWidth < 768,
  screenSize: 'md',
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  fontSize: 'base',
  highContrast: false,
  keyboardNavigation: false,
  screenReader: false,
  isTyping: false,
  lastInteraction: Date.now(),
  hapticEnabled: true,
  soundEnabled: true,
  showServiceHistory: false,
  activeServicePanel: null,

  setTheme: (theme) => {
    set({ theme });
    
    // Immediately compute actual theme
    if (theme === 'system') {
      const prefersDark = typeof window !== 'undefined' && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      get().setActualTheme(prefersDark ? 'dark' : 'light');
    } else {
      get().setActualTheme(theme);
    }
    
    // Store preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  },

  setActualTheme: (theme) => {
    set({ actualTheme: theme });
    
    // Apply theme to document
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },

  openBottomSheet: (sheetId) => {
    set({ 
      bottomSheetOpen: true,
      activeSheet: sheetId,
    });
    get().updateLastInteraction();
  },

  closeBottomSheet: () => {
    set({ 
      bottomSheetOpen: false,
      activeSheet: null,
    });
  },

  setLoading: (loading, message = '') => {
    set({ 
      isLoading: loading,
      loadingMessage: message,
    });
  },

  addNotification: (notification) => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
    
    // Auto-remove notification after duration
    const duration = newNotification.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  setScreenSize: (size) => {
    set({ 
      screenSize: size,
      isMobile: size === 'sm',
    });
  },

  setIsMobile: (mobile) => {
    set({ isMobile: mobile });
  },

  setOnlineStatus: (online) => {
    set({ isOnline: online });
    
    if (!online) {
      get().addNotification({
        title: 'Connection Lost',
        message: 'You are currently offline. Some features may not be available.',
        type: 'warning',
        duration: 0, // Don't auto-dismiss
      });
    } else {
      // Remove offline notification when back online
      const offlineNotification = get().notifications.find(n => 
        n.title === 'Connection Lost'
      );
      if (offlineNotification) {
        get().removeNotification(offlineNotification.id);
      }
    }
  },

  setFontSize: (size) => {
    set({ fontSize: size });
    
    // Apply font size to document
    if (typeof document !== 'undefined') {
      const sizes = {
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
      };
      document.documentElement.style.fontSize = sizes[size];
    }
  },

  setHighContrast: (enabled) => {
    set({ highContrast: enabled });
    
    // Apply high contrast to document
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('high-contrast', enabled);
    }
  },

  enableKeyboardNavigation: () => {
    set({ keyboardNavigation: true });
  },

  setScreenReader: (enabled) => {
    set({ screenReader: enabled });
  },

  updateLastInteraction: () => {
    set({ lastInteraction: Date.now() });
  },

  setHaptic: (enabled) => {
    set({ hapticEnabled: enabled });
  },

  setSound: (enabled) => {
    set({ soundEnabled: enabled });
  },

  setShowServiceHistory: (show) => {
    set({ showServiceHistory: show });
  },

  setActiveServicePanel: (panelId) => {
    set({ activeServicePanel: panelId });
  },

  // Computed methods
  isDarkMode: () => {
    return get().actualTheme === 'dark';
  },

  isTouchDevice: () => {
    return typeof window !== 'undefined' && 
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  },

  shouldReduceMotion: () => {
    const state = get();
    return state.reducedMotion || 
      (typeof window !== 'undefined' && 
       window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  },

  getNotificationCount: () => {
    return get().notifications.length;
  },
}));

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
  if (stored) {
    useUIState.getState().setTheme(stored);
  }
  
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    const state = useUIState.getState();
    if (state.theme === 'system') {
      state.setActualTheme(e.matches ? 'dark' : 'light');
    }
  });
  
  // Listen for online/offline
  window.addEventListener('online', () => useUIState.getState().setOnlineStatus(true));
  window.addEventListener('offline', () => useUIState.getState().setOnlineStatus(false));
}