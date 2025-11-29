import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

// GET statistics for contacts and followups per sheet
export async function GET() {
  try {
    const user = await requireAuth()

    // Get all contacts with sourceSheetId
    const contacts = await prisma.contact.findMany({
      where: {
        userId: user.id,
      },
      select: {
        sourceSheetId: true,
      },
    })

    // Get all followups with sourceSheetId
    const followups = await prisma.followup.findMany({
      where: {
        userId: user.id,
      },
      select: {
        sourceSheetId: true,
      },
    })

    // Aggregate stats by sheetId
    const stats: Record<string, { contacts: number; followups: number }> = {}

    contacts.forEach((contact: { sourceSheetId: string | null }) => {
      if (contact.sourceSheetId) {
        if (!stats[contact.sourceSheetId]) {
          stats[contact.sourceSheetId] = { contacts: 0, followups: 0 }
        }
        stats[contact.sourceSheetId].contacts++
      }
    })

    followups.forEach((followup: { sourceSheetId: string | null }) => {
      if (followup.sourceSheetId) {
        if (!stats[followup.sourceSheetId]) {
          stats[followup.sourceSheetId] = { contacts: 0, followups: 0 }
        }
        stats[followup.sourceSheetId].followups++
      }
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching sheet stats:', error)
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
}
