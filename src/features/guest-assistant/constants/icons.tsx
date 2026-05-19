'use client'

import type { ReactNode } from 'react'
import {
  Wifi,
  Layers,
  Droplet,
  Droplets,
  Sparkles,
  Shirt,
  BedDouble,
  Tv,
  Snowflake,
  LightbulbOff,
  Flame,
  Plug,
  Package,
  Fan,
  UtensilsCrossed,
  Leaf,
  CalendarCheck2,
  Phone,
  Siren,
  LogOut,
  KeyRound,
  Car,
  FolderOpen,
  Home,
  HelpCircle,
  ArrowLeft,
  Wrench,
  Apple,
  Scissors,
  Shield,
} from "lucide-react";

/** tiny helper to render any lucide with consistent sizing */
const i = (C: React.ComponentType<{ className?: string }>): ReactNode => {
  return <C className="h-4 w-4" />;
};

export const ITEM_ICON: Record<string, ReactNode> = {
  // 🧹 Housekeeping & Essentials
  WIFI_PASSWORD: i(Wifi),
  EXTRA_TOWELS: i(Layers),
  WATER_REFILL: i(Droplet),
  ROOM_CLEANING: i(Sparkles),
  SOAP_REQUEST: i(Sparkles), // swap if you add a dedicated soap icon later
  BODY_WASH: i(Droplets),
  SLIPPER: i(Shirt), // closest fit; can replace with a shoe icon if you add one
  SHAVING_KIT: i(Scissors), // or Razor if available in your version
  SANITARY_PADS: i(Shield),
  IRON_REQUEST: i(Shirt),
  EXTRA_BLANKET: i(BedDouble),

  // 🛠️ Maintenance
  TV_NOT_WORKING: i(Tv),
  FLUSH_NOT_WORKING: i(Droplets),
  AC_NOT_WORKING: i(Snowflake),
  LIGHT_ISSUE: i(LightbulbOff),
  GEYSER_ISSUE: i(Flame),
  SOCKET_ISSUE: i(Plug),
  FRIDGE_ISSUE: i(Package), // generic fallback; swap if you prefer a fridge/minibar glyph
  FAN_ISSUE: i(Fan),

  // 🍽️ Food & Room Service
  ORDER_FOOD: i(UtensilsCrossed),
  FOOD_CLEARANCE: i(Sparkles),
  KIDS_MEAL: i(Apple), // easy-to-read child/kids hint
  JAIN_MEAL: i(Leaf),
  TABLE_BOOKING: i(CalendarCheck2),

  // 📞 Reception & Communication
  CALL_RECEPTION: i(Phone),
  EMERGENCY_NUMBER: i(Siren),
  CHECKOUT_REQUEST: i(LogOut),
  LOST_KEYCARD: i(KeyRound),
  BOOK_TAXI: i(Car),
};

export const CATEGORY_ICON: Record<string, ReactNode> = {
  "Housekeeping & Essentials": i(Sparkles),
  Maintenance: i(Wrench),
  "Food & Room Service": i(UtensilsCrossed),
  "Reception & Communication": i(Phone),
};

export const UI_ICON = {
  browse: i(FolderOpen),
  home: i(Home),
  help: i(HelpCircle),
  back: i(ArrowLeft),
};
