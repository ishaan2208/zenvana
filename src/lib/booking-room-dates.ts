export type BookingRoomDateLike = {
  checkInDate?: string | Date | null;
  checkOutDate?: string | Date | null;
  /** @deprecated API no longer returns these; kept for backward compatibility */
  checkIn?: string | Date | null;
  /** @deprecated API no longer returns these; kept for backward compatibility */
  checkOut?: string | Date | null;
};

export function stayCheckIn(room: BookingRoomDateLike | null | undefined): string | Date {
  return room?.checkInDate ?? room?.checkIn ?? "";
}

export function stayCheckOut(room: BookingRoomDateLike | null | undefined): string | Date {
  return room?.checkOutDate ?? room?.checkOut ?? "";
}
