import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

// GET all scheduled events (contacts and followups with scheduledDate)
export async function GET() {
  try {
    const user = await requireAuth()

    // Get all contacts with scheduledDate
    const contacts = await prisma.contact.findMany({
      where: {
        userId: user.id,
        scheduledDate: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        type: true,
        scheduledDate: true,
        actionType: true,
      },
      orderBy: { scheduledDate: 'asc' },
    })

    // Get all followups with scheduledDate
    const followups = await prisma.followup.findMany({
      where: {
        userId: user.id,
        scheduledDate: { not: null },
      },
      select: {
        id: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        contactCompany: true,
        section: true,
        scheduledDate: true,
        actionType: true,
        completed: true,
      },
      orderBy: { scheduledDate: 'asc' },
    })

    // Combine and format events
    const events = [
      ...contacts.map(c => ({
        id: c.id,
        type: 'contact' as const,
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        category: c.type,
        scheduledDate: c.scheduledDate,
        actionType: c.actionType,
        completed: false,
      })),
      ...followups.map(f => ({
        id: f.id,
        type: 'followup' as const,
        name: f.contactName,
        email: f.contactEmail,
        phone: f.contactPhone,
        company: f.contactCompany,
        category: f.section,
        scheduledDate: f.scheduledDate,
        actionType: f.actionType,
        completed: f.completed,
      })),
    ].sort((a, b) => {
      const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0
      const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0
      return dateA - dateB
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
}
