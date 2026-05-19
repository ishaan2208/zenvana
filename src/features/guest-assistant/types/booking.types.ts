export type BookingRoom = {
  bookingId: number
  checkIn: string
  checkOut: string
  id: number
  occupancy: number
  propertyId: number
  roomId: number | null
  status: string
  roomNumber: string
  roomPlan: string
  children?: number
}

export type Property = {
  id?: number
  name: string
  address: string
  receptionNo?: string
  wifiPassword?: string
}

export type Order = {
  restaurantId: number
}

export type Booking = {
  guestName: string
  guestPhoneNumber: string
  guestId: number
  id: number
  propertyId: number
  BookingRoom: BookingRoom[]
  property: Property
  orders?: Order[]
  subUser?: { restaurantId?: number }
}
