'use client'

import { formatGuestName } from '@/features/guest-assistant/lib/guestName'
import { useStayStore } from '@/features/guest-assistant/stores/stayStore'
import { useUIState } from '@/features/guest-assistant/stores/ui'
import type { Booking } from '@/features/guest-assistant/types/booking.types'

export function useGuestServiceMenu() {
  const booking = useStayStore((s) => s.booking) as Booking | null

  if (!booking?.BookingRoom?.length) {
    return [] as GuestServiceCategory[]
  }

  // lightweight personalization
  const firstName =
    formatGuestName(booking?.guestName, {
      useFirstName: true,
    }) ?? "Guest";
  let roomNo =
    (typeof window !== "undefined" &&
      booking?.BookingRoom.find(
        (room) => String(room.id) === localStorage.getItem("roomNumberId")
      )?.roomNumber) ||
    booking?.BookingRoom?.[0]?.roomNumber ||
    "your room";
  roomNo = roomNo === "N/A" ? "your room" : roomNo;
  const wifiPass = booking?.property?.wifiPassword ?? "Not available";
  const bookingRoomId =
    (typeof window !== 'undefined' && localStorage.getItem('roomNumberId')) ||
    String(booking?.BookingRoom?.[0]?.id ?? '')

  return [
    {
      category: "Housekeeping & Essentials",
      description: "Towels, water, toiletries, cleaning",
      items: [
        {
          type: "WIFI_PASSWORD",
          label: "Wi-Fi password",
          kind: "FUNCTION",
          featured: true,
          isChargeable: false,
          reply: `📶 Hey ${firstName}, Wi-Fi pass: ${wifiPass}`,
          action: (_details?: string) => {
            console.log();
            console.log("g", localStorage.getItem("roomNumberId"));
            return null;
          }, // reply handles content
        },
        {
          type: "EXTRA_TOWELS",
          label: "More towels",
          tileTitle: "Fresh Towels",
          description: "Delivered to your room shortly",
          etaMinutes: 15,
          handledBy: "Housekeeping",
          kind: "FUNCTION",
          featured: true,
          isChargeable: false,
          reply: `Certainly. Fresh towels have been requested for ${roomNo}. They should arrive shortly. Would you also like water bottles?`,
          action: async () => {
            setTimeout(() => {
              console.log("Requesting extra towels for:", roomNo);
            }, 5000);
            const action = await actionableAction(
              bookingRoomId,
              booking as Booking,
              "TOWELS"
            );
            console.log(
              "Actionable action for towels:",
              localStorage.getItem("roomNumberId")
            );
            if (action.existed) {
              return "Certainly. We already have a request for towels to " + roomNo + ". They should arrive shortly.";
            } else {
              return;
            }
          },
        },
        {
          type: "WATER_REFILL",
          label: "Water top-up",
          tileTitle: "Water Bottles",
          description: "Delivered to your room shortly",
          etaMinutes: 10,
          kind: "FUNCTION",
          featured: true,
          isChargeable: false,
          secondaryOptions: [
            { label: "1 bottle", value: "1" },
            { label: "2 bottles", value: "2" },
            { label: "4 bottles", value: "4" },
          ],
          reply: `Certainly. Water has been requested for ${roomNo}. It should arrive shortly. Anything else?`,
          action: (details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "WATER", false, details),
        },
        {
          type: "ROOM_CLEANING",
          label: "Clean my room",
          tileTitle: "Housekeeping",
          description: "Schedule a room refresh",
          etaMinutes: 30,
          handledBy: "Housekeeping",
          kind: "FUNCTION",
          featured: true,
          isChargeable: false,
          secondaryOptions: [
            { label: "Now", value: "now" },
            { label: "In 30 minutes", value: "in_30_min" },
            { label: "This evening", value: "evening" },
          ],
          reply: "Certainly. Housekeeping has been notified and will attend to your room shortly.",
          action: (details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "CLEANING", false, details),
        },
        {
          type: "SOAP_REQUEST",
          label: "Soap Refill",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          etaMinutes: 15,
          reply: "Certainly. Soap refill has been requested. It will be delivered shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "SOAP"),
        },
        {
          type: "BODY_WASH",
          label: "Body wash",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          etaMinutes: 15,
          reply: "Certainly. Body wash has been requested. It will be delivered shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "BODY_WASH"),
        },
        {
          type: "SLIPPER",
          label: "Slippers (₹)",
          kind: "CHARGEABLE",
          featured: false,
          isChargeable: true,
          reply: `Certainly. This will be added to your room bill. Slippers will be sent to ${roomNo} shortly.`,
          action: (_details?: string) =>
            actionableAction(
              bookingRoomId,
              booking as Booking,
              "SLIPPER",
              true
            ),
        },
        {
          type: "DENTAL_KIT",
          label: "Dental kit (₹)",
          kind: "CHARGEABLE",
          featured: false,
          isChargeable: true,
          reply: `Certainly. This will be added to your room bill. Dental kit will be sent to ${roomNo} shortly.`,
          action: (_details?: string) =>
            actionableAction(
              bookingRoomId,
              booking as Booking,
              "DENTAL_KIT",
              true
            ),
        },
        {
          type: "SHAVING_KIT",
          label: "Shaving kit (₹)",
          kind: "CHARGEABLE",
          featured: false,
          isChargeable: true,
          reply: `Certainly. This will be added to your room bill. Shaving kit will be sent to ${roomNo} shortly.`,
          action: (_details?: string) =>
            actionableAction(
              bookingRoomId,
              booking as Booking,
              "SHAVING_KIT",
              true
            ),
        },
        {
          type: "SANITARY_PADS",
          label: "Sanitary pads (₹)",
          kind: "CHARGEABLE",
          featured: false,
          isChargeable: true,
          reply: `Certainly. This will be added to your room bill. Sanitary pads will be sent to ${roomNo} shortly.`,
          action: (_details?: string) =>
            actionableAction(
              bookingRoomId,
              booking as Booking,
              "SANITARY_PADS",
              true
            ),
        },
        {
          type: "IRON_REQUEST",
          label: "Iron / board",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          etaMinutes: 20,
          reply: "🧺 We’ll send an iron + board.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "IRON"),
        },
        {
          type: "EXTRA_BLANKET",
          label: "Extra pillow / blanket",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          etaMinutes: 15,
          reply: "Certainly. Extra pillow and blanket have been requested. They should arrive shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "BLANKET"),
        },
      ],
    },
    {
      category: "Maintenance",
      description: "Fix anything in the room",
      items: [
        {
          type: "TV_NOT_WORKING",
          label: "TV not working",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          etaMinutes: 30,
          reply: "📺 Certainly. We've notified maintenance. They will check the TV shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "TV"),
        },
        {
          type: "FLUSH_NOT_WORKING",
          label: "Flush issue",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          etaMinutes: 45,
          reply: "🚽 Certainly. We've reported the flush issue. Maintenance will attend to it shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "FLUSH"),
        },
        {
          type: "AC_NOT_WORKING",
          label: "AC not cooling",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          etaMinutes: 30,
          reply: "Certainly. We've notified maintenance. They will check the AC shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "AC"),
        },
        {
          type: "LIGHT_ISSUE",
          label: "Lights issue",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          etaMinutes: 25,
          reply: "💡 Certainly. We've reported the lights issue. Maintenance will attend shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "LIGHTS"),
        },
        {
          type: "GEYSER_ISSUE",
          label: "Geyser issue",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          reply: "Certainly. We've reported the geyser issue. Maintenance will attend shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "GEYSER"),
        },
        {
          type: "SOCKET_ISSUE",
          label: "Power socket issue",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          reply: "🔌 Certainly. We've reported the socket issue. Maintenance will attend shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "SOCKET"),
        },
        {
          type: "FRIDGE_ISSUE",
          label: "Fridge / minibar issue",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          reply: "🧊 Certainly. We've reported the fridge issue. Maintenance will attend shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "FRIDGE"),
        },
        {
          type: "FAN_ISSUE",
          label: "Fan not working",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          reply: "Certainly. We've reported the fan issue. Maintenance will attend shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "FAN"),
        },
      ],
    },
    {
      category: "Food & Room Service",
      description: "Order food or get clearance",
      items: [
        {
          type: "ORDER_FOOD",
          label: "Order food",
          tileTitle: "In-Room Dining",
          description: "Browse available dining options",
          kind: "REDIRECT",
          featured: true,
          isChargeable: false,
          reply: "Certainly. Opening the menu.",
          action: async (_details?: string) => {
            if (!booking) {
              window.open(
                new URL("/menu?src=chatbot", FOOD_APP_BASE_URL).toString(),
                "_blank"
              );
              return "Opening food ordering.";
            }
            await openFoodOrderFromChatbot({
              booking: booking as Booking,
              bookingRoomId,
              kind: "ROOM_SERVICE",
            });
            return "Opening food ordering.";
          },
        },
        {
          type: "FOOD_CLEARANCE",
          label: "Clear the plates",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          reply: "🧹 We’ll clear it now.",
          action: (_details?: string) =>
            actionableAction(
              bookingRoomId,
              booking as Booking,
              "FOOD_CLEARANCE"
            ),
        },
        {
          type: "KIDS_MEAL",
          label: "Kids meal",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          reply: "Certainly. Kids meal has been noted. We'll arrange it shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "KIDS_MEAL"),
        },
        {
          type: "JAIN_MEAL",
          label: "Jain / custom meal",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          reply: "Certainly. Jain or custom meal has been noted. We'll arrange it shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "JAIN_MEAL"),
        },
        {
          type: "TABLE_BOOKING",
          label: "Book a table",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          reply: "📅 Certainly. We've noted your table booking request. We'll confirm shortly.",
          action: (_details?: string) =>
            actionableAction(
              bookingRoomId,
              booking as Booking,
              "TABLE_BOOKING"
            ),
        },
      ],
    },
    {
      category: "Reception & Communication",
      description: "Call, checkout, help",
      items: [
        {
          type: "CALL_RECEPTION",
          label: "Call reception",
          tileTitle: "Front Desk",
          description: "Call or request assistance",
          handledBy: "Front Desk",
          kind: "FUNCTION",
          featured: true,
          isChargeable: false,
          reply: "Certainly. Connecting you to reception.",
          action: (_details?: string) => {
            const phoneNumber = booking?.property?.receptionNo || "100";

            window.open(`tel:${phoneNumber}`, "_self");
          },
        },
        {
          type: "EMERGENCY_NUMBER",
          label: "Emergency help",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          reply: "🚨 Emergency: 100 (hotel protocol applies).",
          action: (_details?: string) => {
            useUIState.getState().addNotification({
              title: "Emergency",
              message: "Dial 100 for emergency. Hotel protocol applies.",
              type: "warning",
              duration: 8000,
            });
            return "🚨 Emergency: 100 (hotel protocol applies). Please call if you need immediate help.";
          },
        },
        {
          type: "CHECKOUT_REQUEST",
          label: "Checkout request",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          reply: "🧳 Certainly. We've started your checkout. Our team will assist you shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "CHECKOUT"),
        },
        {
          type: "LOST_KEYCARD",
          label: "Lost key card",
          kind: "FUNCTION",
          featured: false,
          isChargeable: false,
          reply: "Certainly. We've requested a replacement key. It will be with you shortly.",
          action: (_details?: string) =>
            actionableAction(bookingRoomId, booking as Booking, "KEYCARD"),
        },
        {
          type: "BOOK_TAXI",
          label: "Book a taxi",
          kind: "REDIRECT",
          featured: false,
          isChargeable: false,
          reply: "🚕 Opening taxi booking…",
          action: (_details?: string) => window.open("https://taxi.example.com", "_blank"),
        },
      ],
    },
  ] as const;
}

// Define ServiceKey as a union of all possible type strings
export type ServiceKey =
  | "WIFI_PASSWORD"
  | "EXTRA_TOWELS"
  | "WATER_REFILL"
  | "ROOM_CLEANING"
  | "SOAP_REQUEST"
  | "BODY_WASH"
  | "SLIPPER"
  | "DENTAL_KIT"
  | "SHAVING_KIT"
  | "SANITARY_PADS"
  | "IRON_REQUEST"
  | "EXTRA_BLANKET"
  | "TV_NOT_WORKING"
  | "FLUSH_NOT_WORKING"
  | "AC_NOT_WORKING"
  | "LIGHT_ISSUE"
  | "GEYSER_ISSUE"
  | "SOCKET_ISSUE"
  | "FRIDGE_ISSUE"
  | "FAN_ISSUE"
  | "ORDER_FOOD"
  | "FOOD_CLEARANCE"
  | "KIDS_MEAL"
  | "JAIN_MEAL"
  | "TABLE_BOOKING"
  | "CALL_RECEPTION"
  | "EMERGENCY_NUMBER"
  | "CHECKOUT_REQUEST"
  | "LOST_KEYCARD"
  | "BOOK_TAXI";

export interface GuestServiceItem {
  type: ServiceKey;
  label: string;
  kind: "FUNCTION" | "CHARGEABLE" | "REDIRECT";
  featured: boolean;
  isChargeable: boolean;
  action: (details?: string) => void | Promise<void> | unknown;
  reply?: string;
  /** Optional second-step choices (e.g. timing or quantity); when set, UI shows chips before calling action(details) */
  secondaryOptions?: ReadonlyArray<{ label: string; value: string }>;
  /** For service tiles on Home: short title when different from label */
  tileTitle?: string;
  /** One-line description for tiles */
  description?: string;
  /** Typical delivery/response time in minutes */
  etaMinutes?: number;
  /** e.g. "Added to room bill" */
  chargeableNote?: string;
  /** e.g. "11:00 PM" */
  availableUntil?: string;
  /** e.g. "Housekeeping", "Front Desk" */
  handledBy?: string;
}

export interface GuestServiceCategory {
  category: string;
  description: string;
  items: GuestServiceItem[];
}

import {
  createTicketFromItem,
  FOOD_APP_BASE_URL,
  openFoodOrderFromChatbot,
} from '@/features/guest-assistant/lib/api'

function ctxFromBooking(booking: Booking, bookingRoomId: string) {
  const selectedRoom = booking?.BookingRoom?.find((room) => String(room.id) === bookingRoomId);
  const roomNumber =
    selectedRoom?.roomNumber ||
    booking?.BookingRoom?.[0]?.roomNumber ||
    "N/A";

  // API requires propertyId as number; derive from booking or selected room
  const rawPropertyId =
    booking?.propertyId ??
    (booking as { property?: { id?: number } })?.property?.id ??
    selectedRoom?.propertyId ??
    booking?.BookingRoom?.[0]?.propertyId;
  const propertyId = rawPropertyId != null ? Number(rawPropertyId) : undefined;
  if (propertyId == null || Number.isNaN(propertyId)) {
    throw new Error("Missing propertyId for ticket context. Ensure booking data is loaded.");
  }

  const bookingId =
    booking?.id != null ? Number(booking.id) : undefined;
  const roomId =
    selectedRoom?.roomId != null
      ? Number(selectedRoom.roomId)
      : booking?.BookingRoom?.[0]?.roomId != null
        ? Number(booking.BookingRoom[0].roomId)
        : undefined;
  const guestId =
    booking?.guestId != null ? Number(booking.guestId) : undefined;

  return {
    propertyId,
    bookingId: bookingId ?? null,
    roomId: roomId ?? null,
    guestId: guestId ?? null,
    bookingRoomId,
    roomNumber,
  };
}

async function actionableAction(
  bookingRoomId: string,
  booking: Booking,
  type: string,

  isPaid = false,
  details?: string
) {
  try {
    const ctx = ctxFromBooking(booking, bookingRoomId);
    const result = await createTicketFromItem(
      { type, isChargeable: isPaid, details },
      ctx
    );
    console.log("Ticket:", result);
    return result;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// function actionableAction(bookingRoomId,booking as Booking,type: string, isPaid: boolean = false) {
//   console.log(`Request sent: ${type}, Paid: ${isPaid}`);
//   // example API call
//   fetch("/api/service", {
//     method: "POST",
//     body: JSON.stringify({ type, isPaid }),
//     headers: { "Content-Type": "application/json" },
//   });
// }

// function actionableAction(bookingRoomId,booking as Booking,issue: string) {
//   console.log(`Issue reported: ${issue}`);
//   fetch("/api/maintenance", {
//     method: "POST",
//     body: JSON.stringify({ issue }),
//     headers: { "Content-Type": "application/json" },
//   });
// }
