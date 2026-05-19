'use client'

import { create } from 'zustand'

import { guestStorage } from '@/features/guest-assistant/lib/guestStorage'
import { formatGuestName } from '@/features/guest-assistant/lib/guestName'

interface GuestProfile {
  // Basic guest info
  guestName?: string;
  phoneNumber?: string;
  roomNumber?: string;
  checkInDate?: string;
  checkOutDate?: string;

  // Preferences
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  reducedMotion: boolean;

  // Service preferences
  housekeepingTime?: 'morning' | 'afternoon' | 'evening';
  roomTemperature?: number;
  dietaryRestrictions: string[];
  specialRequests: string[];

  // Behavioral data (for learning)
  favoriteServices: string[];
  requestHistory: Array<{
    type: string;
    timestamp: number;
    completed: boolean;
    status?: string;
    dueAt?: number;
  }>;

  // Session data
  lastActive: number;
  visitCount: number;
  sessionStart: number;
}

interface GuestProfileState extends GuestProfile {
  // Actions
  updateProfile: (updates: Partial<GuestProfile>) => void;
  setPreference: <K extends keyof GuestProfile>(key: K, value: GuestProfile[K]) => void;
  addServiceToHistory: (serviceType: string, completed: boolean, meta?: { status?: string; dueAt?: number }) => void;
  addToFavorites: (serviceType: string) => void;
  removeFromFavorites: (serviceType: string) => void;
  updateSession: () => void;
  loadProfile: () => void;
  clearProfile: () => void;

  // Computed
  isReturningGuest: boolean;
  getContextualGreeting: () => string;
  getRecommendedServices: () => string[];
  getOptimalServiceTime: (serviceType: string) => string;
}

const defaultProfile: GuestProfile = {
  theme: 'system',
  language: 'en',
  notifications: true,
  soundEffects: true,
  hapticFeedback: true,
  reducedMotion: false,
  dietaryRestrictions: [],
  specialRequests: [],
  favoriteServices: [],
  requestHistory: [],
  lastActive: Date.now(),
  visitCount: 1,
  sessionStart: Date.now(),
};

export const useGuestProfile = create<GuestProfileState>((set, get) => ({
  ...defaultProfile,
  isReturningGuest: false,

  updateProfile: (updates) => {
    set((state) => {
      const newState = { ...state, ...updates };
      guestStorage.setProfile(newState);
      return newState;
    });
  },

  setPreference: (key, value) => {
    set((state) => {
      const newState = { ...state, [key]: value };
      guestStorage.setProfile(newState);
      return newState;
    });
  },

  addServiceToHistory: (serviceType, completed, meta) => {
    set((state) => {
      const entry = {
        type: serviceType,
        timestamp: Date.now(),
        completed,
        ...(meta?.status != null && { status: meta.status }),
        ...(meta?.dueAt != null && { dueAt: meta.dueAt }),
      };
      const newHistory = [...state.requestHistory, entry].slice(-50);
      const newState = { ...state, requestHistory: newHistory };
      guestStorage.setProfile(newState);
      return newState;
    });
  },

  addToFavorites: (serviceType) => {
    set((state) => {
      if (state.favoriteServices.includes(serviceType)) return state;

      const newFavorites = [...state.favoriteServices, serviceType];
      const newState = { ...state, favoriteServices: newFavorites };
      guestStorage.setProfile(newState);
      return newState;
    });
  },

  removeFromFavorites: (serviceType) => {
    set((state) => {
      const newFavorites = state.favoriteServices.filter(s => s !== serviceType);
      const newState = { ...state, favoriteServices: newFavorites };
      guestStorage.setProfile(newState);
      return newState;
    });
  },

  updateSession: () => {
    set((state) => {
      const newState = {
        ...state,
        lastActive: Date.now(),
        visitCount: state.visitCount + 1
      };
      guestStorage.setProfile(newState);
      return newState;
    });
  },

  loadProfile: () => {
    const stored = guestStorage.getProfile() as Partial<GuestProfile> & { visitCount?: number } | undefined;
    if (stored) {
      set({
        ...stored,
        isReturningGuest: (stored.visitCount ?? 0) > 1,
        sessionStart: Date.now(),
      });
    }
  },

  clearProfile: () => {
    set(defaultProfile);
    guestStorage.clearAll();
  },

  getContextualGreeting: () => {
    const state = get();
    const hour = new Date().getHours();
    const isReturning = state.isReturningGuest;
    const guestName = formatGuestName(state.guestName);

    let timeGreeting = '';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    if (isReturning && guestName) {
      return `${timeGreeting}, ${guestName}! Welcome back to your room.`;
    } else if (guestName) {
      return `${timeGreeting}, ${guestName}! Welcome to your room.`;
    } else if (isReturning) {
      return `${timeGreeting}! Welcome back. How can I help you today?`;
    } else {
      return `${timeGreeting}! Welcome to Zenvana guest services. How can I help you?`;
    }
  },

  getRecommendedServices: () => {
    const state = get();
    const { favoriteServices, requestHistory } = state;
    const hour = new Date().getHours();

    // Time-based recommendations
    let timeBasedServices: string[] = [];
    if (hour >= 7 && hour < 11) {
      timeBasedServices = ['TOWELS', 'CLEANING'];
    } else if (hour >= 11 && hour < 14) {
      timeBasedServices = ['WATER', 'FOOD_CLEARANCE'];
    } else if (hour >= 18 && hour < 22) {
      timeBasedServices = ['TOWELS', 'WATER'];
    }

    // Frequency-based recommendations
    const serviceFrequency = requestHistory.reduce((acc, req) => {
      acc[req.type] = (acc[req.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const frequentServices = Object.entries(serviceFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([service]) => service);

    // Combine favorites, time-based, and frequent services
    const recommended = [...new Set([
      ...favoriteServices,
      ...timeBasedServices,
      ...frequentServices
    ])];

    return recommended.slice(0, 5);
  },

  getOptimalServiceTime: (serviceType: string) => {
    const state = get();
    const history = state.requestHistory.filter(req => req.type === serviceType);

    if (history.length === 0) {
      // Default optimal times
      const defaultTimes: Record<string, string> = {
        'CLEANING': '10:00 AM',
        'TOWELS': '2:00 PM',
        'WATER': '6:00 PM',
        'MAINTENANCE': '11:00 AM',
      };
      return defaultTimes[serviceType] || 'Anytime';
    }

    // Find most common hour from history
    const hours = history.map(req => new Date(req.timestamp).getHours());
    const hourCount = hours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const mostCommonHour = Object.entries(hourCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    if (mostCommonHour) {
      const hour = parseInt(mostCommonHour);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:00 ${ampm}`;
    }

    return 'Anytime';
  },
}));