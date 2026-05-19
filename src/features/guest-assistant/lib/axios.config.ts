'use client'

import axios from 'axios'

const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
const trimmed = base.replace(/\/$/, '')
const apiBaseUrl = trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`

const instance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

export default instance
