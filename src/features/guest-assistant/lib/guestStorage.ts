/**
 * Advanced Storage Service
 * Replaces raw localStorage with encrypted, structured storage with sync capabilities
 */

interface StorageOptions {
  encrypt?: boolean
  syncAcrossTabs?: boolean
  expiry?: number // milliseconds
}

interface StorageItem<T = unknown> {
  data: T
  timestamp: number
  expiry?: number
  encrypted?: boolean
}

class AdvancedStorage {
  private prefix = 'zenvana_guest_'
  private syncCallbacks: Map<string, Set<(value: unknown) => void>> = new Map()

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this))
    }
  }

  set<T>(key: string, value: T, options: StorageOptions = {}): void {
    const fullKey = this.prefix + key
    const now = Date.now()

    const item: StorageItem<T> = {
      data: (options.encrypt ? this.encrypt(value) : value) as T,
      timestamp: now,
      expiry: options.expiry ? now + options.expiry : undefined,
      encrypted: options.encrypt,
    }

    try {
      localStorage.setItem(fullKey, JSON.stringify(item))

      if (options.syncAcrossTabs) {
        this.triggerSyncCallbacks(key, value)
      }
    } catch (error) {
      console.error('Storage write error:', error)
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    const fullKey = this.prefix + key

    try {
      const stored = localStorage.getItem(fullKey)
      if (!stored) return defaultValue

      const item: StorageItem<T> = JSON.parse(stored)

      if (item.expiry && Date.now() > item.expiry) {
        this.remove(key)
        return defaultValue
      }

      const data = item.encrypted
        ? this.decrypt(item.data as unknown as string)
        : item.data
      return (data !== undefined ? data : defaultValue) as T | undefined
    } catch (error) {
      console.error('Storage read error:', error)
      return defaultValue
    }
  }

  remove(key: string): void {
    const fullKey = this.prefix + key
    localStorage.removeItem(fullKey)
  }

  clear(): void {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith(this.prefix),
    )
    keys.forEach((key) => localStorage.removeItem(key))
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  keys(): string[] {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(this.prefix))
      .map((key) => key.replace(this.prefix, ''))
  }

  subscribe<T>(key: string, callback: (value: T | undefined) => void): () => void {
    if (!this.syncCallbacks.has(key)) {
      this.syncCallbacks.set(key, new Set())
    }

    this.syncCallbacks.get(key)!.add(callback as (value: unknown) => void)

    return () => {
      const callbacks = this.syncCallbacks.get(key)
      if (callbacks) {
        callbacks.delete(callback as (value: unknown) => void)
        if (callbacks.size === 0) {
          this.syncCallbacks.delete(key)
        }
      }
    }
  }

  private encrypt(data: unknown): string {
    try {
      const jsonStr = JSON.stringify(data)
      const base64 = btoa(jsonStr)
      return base64
        .split('')
        .map((char) => String.fromCharCode(char.charCodeAt(0) + 3))
        .join('')
    } catch {
      return ''
    }
  }

  private decrypt(encrypted: string): unknown {
    try {
      const base64 = encrypted
        .split('')
        .map((char) => String.fromCharCode(char.charCodeAt(0) - 3))
        .join('')
      const jsonStr = atob(base64)
      return JSON.parse(jsonStr)
    } catch {
      return undefined
    }
  }

  private handleStorageChange(event: StorageEvent): void {
    if (!event.key?.startsWith(this.prefix)) return

    const key = event.key.replace(this.prefix, '')
    const value = event.newValue
      ? this.parseStorageValue(event.newValue)
      : undefined

    this.triggerSyncCallbacks(key, value)
  }

  private triggerSyncCallbacks(key: string, value: unknown): void {
    const callbacks = this.syncCallbacks.get(key)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(value)
        } catch (error) {
          console.error('Storage callback error:', error)
        }
      })
    }
  }

  private parseStorageValue(rawValue: string): unknown {
    try {
      const item: StorageItem = JSON.parse(rawValue)
      return item.encrypted ? this.decrypt(item.data as string) : item.data
    } catch {
      return undefined
    }
  }
}

export const storage = new AdvancedStorage()

export const guestStorage = {
  setSession(data: unknown) {
    storage.set('session', data, { expiry: 24 * 60 * 60 * 1000 })
  },

  getSession() {
    return storage.get('session')
  },

  setPreferences(prefs: unknown) {
    storage.set('preferences', prefs, { encrypt: true, syncAcrossTabs: true })
  },

  getPreferences(defaults = {}) {
    return storage.get('preferences', defaults)
  },

  setConversation(conversationId: string, messages: unknown[]) {
    storage.set(`conversation_${conversationId}`, messages, {
      expiry: 7 * 24 * 60 * 60 * 1000,
    })
  },

  getConversation(conversationId: string): unknown[] {
    return (storage.get(`conversation_${conversationId}`, []) as unknown[]) ?? []
  },

  setServiceRequests(requests: unknown[]) {
    storage.set('service_requests', requests, {
      expiry: 3 * 60 * 60 * 1000,
    })
  },

  getServiceRequests() {
    return storage.get('service_requests', [])
  },

  setProfile(profile: unknown) {
    storage.set('guest_profile', profile, {
      encrypt: true,
      syncAcrossTabs: true,
      expiry: 30 * 24 * 60 * 60 * 1000,
    })
  },

  getProfile() {
    return storage.get('guest_profile')
  },

  clearAll() {
    storage.clear()
  },

  subscribe: storage.subscribe.bind(storage),
}
