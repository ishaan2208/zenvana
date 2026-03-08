import Razorpay from 'razorpay'
import { NextRequest, NextResponse } from 'next/server'

const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
const keySecret = process.env.RAZORPAY_KEY_SECRET

export async function POST(request: NextRequest) {
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: 'Razorpay is not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const amount = Number(body?.amount ?? 0)
    const currency = (body?.currency ?? 'INR') as string

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Razorpay expects amount in smallest currency unit (paise for INR)
    const amountInPaise = currency === 'INR' ? Math.round(amount * 100) : Math.round(amount)

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `zenvana-${Date.now()}`,
    })

    return NextResponse.json({ orderId: order.id })
  } catch (err) {
    console.error('[razorpay/order]', err)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
