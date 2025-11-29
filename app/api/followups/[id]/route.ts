import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

// DELETE a followup
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    // Verify ownership
    const followup = await prisma.followup.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!followup) {
      return NextResponse.json(
        { error: 'Followup not found' },
        { status: 404 }
      )
    }

    await prisma.followup.delete({
      where: { id: params.id },
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

// PATCH update a followup
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Verify ownership
    const existingFollowup = await prisma.followup.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingFollowup) {
      return NextResponse.json(
        { error: 'Followup not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}
    
    if (body.contactName !== undefined) updateData.contactName = body.contactName
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail || null
    if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone || null
    if (body.contactCompany !== undefined) updateData.contactCompany = body.contactCompany || null
    if (body.section !== undefined) updateData.section = body.section
    if (body.notes !== undefined) updateData.notes = body.notes || null
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.completed !== undefined) updateData.completed = body.completed
    if (body.scheduledDate !== undefined) updateData.scheduledDate = body.scheduledDate ? new Date(body.scheduledDate) : null
    if (body.actionType !== undefined) updateData.actionType = body.actionType || null

    const followup = await prisma.followup.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(followup)
  } catch (error) {
    console.error('Error updating followup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
