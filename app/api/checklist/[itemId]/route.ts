import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { z } from 'zod'

const updateChecklistItemSchema = z.object({
  completed: z.boolean().optional(),
  content: z.string().min(1).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const user = await requireAuth()
    const { itemId } = params
    const body = await request.json()

    const validatedData = updateChecklistItemSchema.parse(body)

    // Verificar propiedad a través del followup
    const item = await prisma.checklistItem.findUnique({
      where: { id: itemId },
      include: { followup: true },
    })

    if (!item || item.followup.userId !== user.id) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    const updatedItem = await prisma.checklistItem.update({
      where: { id: itemId },
      data: validatedData,
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating checklist item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const user = await requireAuth()
    const { itemId } = params

    const item = await prisma.checklistItem.findUnique({
      where: { id: itemId },
      include: { followup: true },
    })

    if (!item || item.followup.userId !== user.id) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    await prisma.checklistItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting checklist item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
