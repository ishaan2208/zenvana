'use client'

import { useMemo, useState } from 'react'
import { pdf, Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { Download } from 'lucide-react'

import { Button } from '@/components/Button'

type VoucherData = {
  propertyName: string
  bookingReference: string
  checkIn: string
  checkOut: string
  roomTypeName: string
  totalAmount: number
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 20,
    color: '#4b5563',
  },
  section: {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  key: {
    color: '#6b7280',
  },
  value: {
    maxWidth: '60%',
    textAlign: 'right',
  },
  footer: {
    marginTop: 10,
    fontSize: 10,
    textAlign: 'center',
    color: '#6b7280',
  },
})

function ConfirmationVoucherDocument({ data }: { data: VoucherData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Booking Confirmation Voucher</Text>
        <Text style={styles.subtitle}>{data.propertyName}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.row}>
            <Text style={styles.key}>Booking Reference</Text>
            <Text style={styles.value}>{data.bookingReference}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.key}>Room Type</Text>
            <Text style={styles.value}>{data.roomTypeName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.key}>Check In</Text>
            <Text style={styles.value}>{data.checkIn}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.key}>Check Out</Text>
            <Text style={styles.value}>{data.checkOut}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.key}>Total Amount</Text>
            <Text style={styles.value}>INR {data.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Thank you for booking with Zenvana. Please present this voucher at check-in.
        </Text>
      </Page>
    </Document>
  )
}

export function DownloadConfirmationVoucherButton(props: VoucherData) {
  const [isDownloading, setIsDownloading] = useState(false)

  const safeFilenameRef = useMemo(
    () => props.bookingReference.replace(/[^a-zA-Z0-9-_]/g, ''),
    [props.bookingReference]
  )

  async function onDownload() {
    try {
      setIsDownloading(true)
      const blob = await pdf(<ConfirmationVoucherDocument data={props} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `confirmation-voucher-${safeFilenameRef || 'booking'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      type="button"
      color="blue"
      className="h-12 rounded-[1rem] gap-2"
      onClick={onDownload}
      disabled={isDownloading}
    >
      <Download className="h-4 w-4" />
      {isDownloading ? 'Preparing voucher...' : 'Download voucher'}
    </Button>
  )
}
