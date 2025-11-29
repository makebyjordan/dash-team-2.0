'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { ActivityProvider } from '@/lib/ActivityContext'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ActivityProvider>
        {children}
      </ActivityProvider>
    </SessionProvider>
  )
}
