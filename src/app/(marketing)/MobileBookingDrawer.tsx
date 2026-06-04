'use client'

import { CalendarCheck } from 'lucide-react'

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { HeroBookBar, type HeroBookBarProperty } from './HeroBookBar'

/**
 * Mobile booking sheet — Vaul (Emil Kowalski). The sticky-CTA "Book your stay"
 * opens a momentum-based, drag-to-dismiss bottom sheet containing the same
 * HeroBookBar widget (no duplicated booking logic). Submitting navigates away,
 * which unmounts and closes the sheet naturally.
 */
export function MobileBookingDrawer({
  properties,
}: {
  properties: HeroBookBarProperty[]
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="pressable inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background"
        >
          <CalendarCheck className="h-4 w-4" />
          Book your stay
        </button>
      </DrawerTrigger>
      <DrawerContent className="px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <DrawerHeader className="px-1 text-left">
          <DrawerTitle className="font-serif text-2xl tracking-tight">
            Book your stay
          </DrawerTitle>
          <DrawerDescription>
            Choose a hotel and your dates — best rate when you book direct.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-1">
          <HeroBookBar properties={properties} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
