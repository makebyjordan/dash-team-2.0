import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { z } from 'zod'

const updateFollowupSchema = z.object({
  section: z.enum(['urgent', 'list', 'calendar', 'checks']).optional(),
  notes: z.string().optional(),
  completed: z.boolean().optional(),
  dueDate: z.string().datetime().optional().nullable(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const { id } = params
    const body = await request.json()

    const validatedData = updateFollowupSchema.parse(body)

    const followup = await prisma.followup.findUnique({
      where: { id },
    })

    if (!followup || followup.userId !== user.id) {
      return NextResponse.json(
        { error: 'Followup not found' },
        { status: 404 }
      )
    }

    const updatedFollowup = await prisma.followup.update({
      where: { id },
      data: {
        section: validatedData.section,
        notes: validatedData.notes,
        completed: validatedData.completed,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : validatedData.dueDate,
      },
    })

    return NextResponse.json(updatedFollowup)
  } catch (error) {
    console.error('Error updating followup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const { id } = params

    const followup = await prisma.followup.findUnique({
      where: { id },
    })

    if (!followup || followup.userId !== user.id) {
      return NextResponse.json(
        { error: 'Followup not found' },
        { status: 404 }
      )
    }

    await prisma.followup.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting followup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
