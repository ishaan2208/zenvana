'use client'

import React from 'react'
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { format } from 'date-fns'

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, textAlign: 'center' },
  logo: { width: 120, height: 120, marginBottom: 10, alignSelf: 'center' },
  section: {
    marginBottom: 15,
    padding: 10,
    border: '1px solid #E4E4E4',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  text: { fontSize: 10, marginBottom: 6, color: '#555' },
  bulletPoint: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' },
  bulletPointText: { marginLeft: 5, fontSize: 10, color: '#555' },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  column: { width: '45%' },
  table: { width: 'auto', borderStyle: 'solid', borderWidth: 1, border: '1px solid #E4E4E4' },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: {
    width: '15.00%',
    borderStyle: 'solid',
    padding: 2,
    borderRightWidth: 1,
    borderColor: '#E4E4E4',
    backgroundColor: '#f2f2f2',
    fontSize: 10,
  },
  tableColHeaderBig: {
    width: '25.00%',
    borderStyle: 'solid',
    padding: 2,
    borderRightWidth: 1,
    borderColor: '#E4E4E4',
    backgroundColor: '#f2f2f2',
    fontSize: 10,
  },
  tableCol: {
    width: '15.00%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    padding: 2,
    borderColor: '#E4E4E4',
    fontSize: 10,
  },
  tableColBig: {
    width: '25.00%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    padding: 2,
    borderColor: '#E4E4E4',
    fontSize: 10,
  },
  tableCell: { fontSize: 10, color: '#555' },
  tableCellBig: { fontSize: 10, textAlign: 'center', padding: 5 },
  tableHeader: { backgroundColor: '#f2f2f2' },
})

type VoucherRoom = {
  id: number
  occupancy: number
  tariff: number
  totalNight: number
  checkIn: string
  checkOut: string
  checkInDate?: string | null
  checkOutDate?: string | null
  room_type: { name: string }
}

type VoucherProperty = {
  name: string
  address: string | null
  city: string | null
  pincode: string | null
  phone: string | null
  email: string | null
}

export type VoucherBooking = {
  id: number
  guestName: string
  company: string | null
  guestPhoneNumber: string | null
  email: string | null
  address: string | null
  gstNumber: string | null
  totalRooms: number
  remarks: string | null
  source: string
  totalAmount: number
  totalPaid: number
  createdAt: string
  BookingRoom: VoucherRoom[]
  property: VoucherProperty
}

export default function ConfirmationVoucher({
  booking,
  logoUrl,
}: {
  booking: VoucherBooking
  logoUrl: string | null
}) {
  const getRoomCheckInDate = (room: VoucherRoom) => room.checkInDate ?? room.checkIn
  const getRoomCheckOutDate = (room: VoucherRoom) => room.checkOutDate ?? room.checkOut

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {logoUrl && logoUrl !== 'N/A' && (
            <Image style={styles.logo} src={logoUrl} alt="Hotel logo" />
          )}
          <Text style={styles.sectionTitle}>{booking.property.name}</Text>
          <Text style={styles.text}>{booking.property.address || '-'}</Text>
          <Text style={styles.text}>
            {booking.property.city || '-'} {booking.property.pincode || ''}
          </Text>
          <Text style={styles.text}>
            Phone: {booking.property.phone || '-'} Email: {booking.property.email || '-'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guest Information</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.text}>Guest Name: {booking.guestName}</Text>
              <Text style={styles.text}>Guest Number: {booking.guestPhoneNumber || '-'}</Text>
              <Text style={styles.text}>Company: {booking.company || 'Not Available'}</Text>
              <Text style={styles.text}>GST Number: {booking.gstNumber || 'Not Available'}</Text>
              <Text style={styles.text}>
                Booking Date and Time: {format(new Date(booking.createdAt), 'do MMMM yyyy hh:mm a')}
              </Text>
              <Text style={styles.text}>Booking ID: {booking.id}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.text}>Source: {booking.source}</Text>
              <Text style={styles.text}>Total Rooms: {booking.totalRooms}</Text>
              <Text style={styles.text}>Total Amount: {booking.totalAmount}</Text>
              <Text style={styles.text}>Total Paid: {booking.totalPaid}</Text>
              <Text style={styles.text}>Remarks: {booking.remarks || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={[styles.table, styles.tableHeader]}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeaderBig}>Room Category</Text>
              <Text style={styles.tableColHeader}>Check In</Text>
              <Text style={styles.tableColHeader}>Check Out</Text>
              <Text style={styles.tableColHeader}>Total Nights</Text>
              <Text style={styles.tableColHeader}>Tariff</Text>
              <Text style={styles.tableColHeader}>Amount</Text>
            </View>
          </View>

          {booking.BookingRoom.map((room) => (
            <View style={styles.tableRow} key={room.id}>
              <View style={styles.tableColBig}>
                <Text style={styles.tableCellBig}>
                  {room.room_type.name} ({room.occupancy} occupancy)
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {format(new Date(getRoomCheckInDate(room)), 'do MMM yy')}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {format(new Date(getRoomCheckOutDate(room)), 'do MMM yy')}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{room.totalNight}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{room.tariff}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{room.tariff * room.totalNight}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms and Conditions</Text>
          <View style={styles.bulletPoint}>
            <Text>{'\u2022'}</Text>
            <Text style={styles.bulletPointText}>
              Check-in time is from 12:00 PM and checkout time is until 11:00 AM.
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text>{'\u2022'}</Text>
            <Text style={styles.bulletPointText}>
              The guest is responsible for all charges incurred during their stay and agrees to settle
              the bill upon departure.
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text>{'\u2022'}</Text>
            <Text style={styles.bulletPointText}>
              Guests will be held liable for any damage caused to the hotel property by themselves,
              their friends, or any person for whom they are responsible.
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text>{'\u2022'}</Text>
            <Text style={styles.bulletPointText}>
              The hotel is not responsible for personal belongings and valuables such as money,
              jewelry, or other valuables left in the guest rooms.
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text>{'\u2022'}</Text>
            <Text style={styles.bulletPointText}>
              Guests must follow all hotel policies and guidelines during their stay.
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text>{'\u2022'}</Text>
            <Text style={styles.bulletPointText}>
              The hotel reserves the right to charge guests for any damages or missing items
              discovered after checkout.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>We look forward to welcoming you to our hotel and hope you have a pleasant stay.</Text>
        </View>
      </Page>
    </Document>
  )
}
