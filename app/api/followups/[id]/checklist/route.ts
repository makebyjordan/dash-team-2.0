import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { z } from 'zod'

const checklistItemSchema = z.object({
  content: z.string().min(1),
})

const updateChecklistItemSchema = z.object({
  completed: z.boolean(),
})

// GET - Obtener items de checklist de un followup
export async function GET(
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

    const checklist = await prisma.checklistItem.findMany({
      where: { followupId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(checklist)
  } catch (error) {
    console.error('Error fetching checklist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Crear item de checklist
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const { id } = params
    const body = await request.json()

    const validatedData = checklistItemSchema.parse(body)

    const followup = await prisma.followup.findUnique({
      where: { id },
    })

    if (!followup || followup.userId !== user.id) {
      return NextResponse.json(
        { error: 'Followup not found' },
        { status: 404 }
      )
    }

    const newItem = await prisma.checklistItem.create({
      data: {
        followupId: id,
        content: validatedData.content,
      },
    })

    // Lógica automática: Si el contacto no está en "checks", crearlo.
    // Pero primero verificamos si este followup YA ES de la sección checks.
    if (followup.section !== 'checks') {
      // Verificar si ya existe un followup para este contacto en la sección checks
      const existingCheckFollowup = await prisma.followup.findFirst({
        where: {
          userId: user.id,
          contactId: followup.contactId,
          section: 'checks',
        },
      })

      // Si no existe, lo creamos (copiamos)
      if (!existingCheckFollowup) {
        await prisma.followup.create({
          data: {
            userId: user.id,
            contactId: followup.contactId,
            contactName: followup.contactName,
            contactEmail: followup.contactEmail,
            contactPhone: followup.contactPhone,
            contactCompany: followup.contactCompany,
            section: 'checks',
            notes: followup.notes,
          },
        })
      }
    }

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating checklist item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
