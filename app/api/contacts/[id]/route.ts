import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

type ChecklistPayload = {
  id?: string
  title?: string
  completed?: boolean
}

// GET - Retrieve single contact
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const contact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update contact
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const { id } = params
    const body = await request.json()

    // Verify the contact belongs to the user
    const contact = await prisma.contact.findUnique({
      where: { id },
    })

    if (!contact || contact.userId !== user.id) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Build update data - only include fields that are provided
    const updateData: any = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email || null
    if (body.phone !== undefined) updateData.phone = body.phone || null
    if (body.company !== undefined) updateData.company = body.company || null
    if (body.type !== undefined) updateData.type = body.type
    if (body.status !== undefined) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.lastContact !== undefined) updateData.lastContact = body.lastContact ? new Date(body.lastContact) : null
    if (body.scheduledDate !== undefined) updateData.scheduledDate = body.scheduledDate ? new Date(body.scheduledDate) : null
    if (body.actionType !== undefined) updateData.actionType = body.actionType || null
    if (body.checklist !== undefined) {
      if (Array.isArray(body.checklist)) {
        const sanitized = (body.checklist as ChecklistPayload[])
          .filter((item): item is ChecklistPayload => Boolean(item) && typeof item.title === 'string')
          .map(item => ({
            id: typeof item.id === 'string' && item.id.length > 0 ? item.id : randomUUID(),
            title: String(item.title).trim(),
            completed: Boolean(item.completed),
          }))
          .filter(item => item.title.length > 0)

        updateData.checklist = sanitized.length ? (sanitized as Prisma.InputJsonValue) : null
      } else {
        updateData.checklist = null
      }
    }

    const updatedContact = await prisma.contact.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE contact
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const { id } = params

    // Verify the contact belongs to the user
    const contact = await prisma.contact.findUnique({
      where: { id },
    })

    if (!contact || contact.userId !== user.id) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    await prisma.contact.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
