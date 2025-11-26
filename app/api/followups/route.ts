import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { z } from 'zod'

const followupSchema = z.object({
  contactId: z.string(),
  contactName: z.string(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactCompany: z.string().nullable().optional(),
  section: z.enum(['urgent', 'list', 'calendar', 'checks']),
  notes: z.string().nullable().optional(),
  dueDate: z.string().datetime().optional(),
})

// GET - Obtener seguimientos
export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    const where: any = {
      userId: user.id,
    }

    if (section) {
      where.section = section
    }

    const followups = await prisma.followup.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(followups)
  } catch (error) {
    console.error('Error fetching followups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Crear seguimiento
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const validatedData = followupSchema.parse(body)

    const followup = await prisma.followup.create({
      data: {
        userId: user.id,
        contactId: validatedData.contactId,
        contactName: validatedData.contactName,
        contactEmail: validatedData.contactEmail,
        contactPhone: validatedData.contactPhone,
        contactCompany: validatedData.contactCompany,
        section: validatedData.section,
        notes: validatedData.notes,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      },
    })

    return NextResponse.json(followup, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating followup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
