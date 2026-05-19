export type ServiceKey =
  | 'WIFI_PASSWORD'
  | 'EXTRA_TOWELS'
  | 'WATER_REFILL'
  | 'ROOM_CLEANING'
  | 'SOAP_REQUEST'
  | 'BODY_WASH'
  | 'SLIPPER'
  | 'DENTAL_KIT'
  | 'SHAVING_KIT'
  | 'SANITARY_PADS'
  | 'IRON_REQUEST'
  | 'EXTRA_BLANKET'
  | 'TV_NOT_WORKING'
  | 'FLUSH_NOT_WORKING'
  | 'AC_NOT_WORKING'
  | 'LIGHT_ISSUE'
  | 'GEYSER_ISSUE'
  | 'SOCKET_ISSUE'
  | 'FRIDGE_ISSUE'
  | 'FAN_ISSUE'
  | 'ORDER_FOOD'
  | 'FOOD_CLEARANCE'
  | 'KIDS_MEAL'
  | 'JAIN_MEAL'
  | 'TABLE_BOOKING'
  | 'CALL_RECEPTION'
  | 'EMERGENCY_NUMBER'
  | 'CHECKOUT_REQUEST'
  | 'LOST_KEYCARD'
  | 'BOOK_TAXI'
  | 'EARLY_CHECKIN'
  | 'AIRPORT_PICKUP'
  | 'PRE_ARRIVAL_NOTE'
  | 'INVOICE_DETAILS'
  | 'INVOICE_COPY'
  | 'LOST_AND_FOUND'
  | 'POST_STAY_FEEDBACK'
  | 'DEPARTURE_TRANSFER'
  | 'PROPERTY_CONTACT'

export interface GuestServiceItem {
  type: ServiceKey
  label: string
  kind: 'FUNCTION' | 'CHARGEABLE' | 'REDIRECT'
  featured: boolean
  isChargeable: boolean
  action: (details?: string) => void | Promise<void> | unknown
  reply?: string
  secondaryOptions?: ReadonlyArray<{ label: string; value: string }>
  tileTitle?: string
  description?: string
  etaMinutes?: number
  chargeableNote?: string
  availableUntil?: string
  handledBy?: string
}

export interface GuestServiceCategory {
  category: string
  description: string
  items: GuestServiceItem[]
}
