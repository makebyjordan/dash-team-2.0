import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { z } from 'zod'
import { ContactType, ContactStatus, Prisma } from '@prisma/client'

const checklistItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(255),
  completed: z.boolean(),
})

const contactSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  type: z.nativeEnum(ContactType),
  status: z.nativeEnum(ContactStatus).optional(),
  notes: z.string().optional(),
  lastContact: z.string().datetime().optional(),
  sourceSheetId: z.string().optional(),
  checklist: z.array(checklistItemSchema).optional(),
})

// GET all contacts for current user
export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ContactType | null
    const hasChecklist = searchParams.get('hasChecklist') === '1'

    const contacts = await prisma.contact.findMany({
      where: {
        userId: user.id,
        ...(type && { type }),
        ...(hasChecklist && { checklist: { not: null } }),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(contacts)
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
}

// POST create new contact
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const validatedData = contactSchema.parse(body)
    
    const checklistData = (validatedData.checklist || [])
      .map(item => ({
        id: item.id,
        title: item.title.trim(),
        completed: item.completed,
      }))
      .filter(item => item.title.length > 0)

    const contact = await prisma.contact.create({
      data: {
        ...validatedData,
        email: validatedData.email || null,
        lastContact: validatedData.lastContact ? new Date(validatedData.lastContact) : null,
        checklist: checklistData.length ? (checklistData as Prisma.InputJsonValue) : null,
        userId: user.id,
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
