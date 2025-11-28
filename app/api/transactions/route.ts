import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const transactionSchema = z.object({
    type: z.enum(['INCOME', 'EXPENSE']),
    title: z.string().optional(),
    invoiceNumber: z.string().optional(),
    description: z.string().optional(),
    baseAmount: z.number().optional(),
    vatRate: z.number().optional(),
    date: z.string().optional(),
});

// GET all transactions
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: user.id,
                ...(type && { type: type as any }),
            },
            orderBy: { date: 'desc' },
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return new NextResponse('Internal error', { status: 500 });
    }
}

// POST new transaction
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        const json = await req.json();
        const body = transactionSchema.parse(json);

        // Calculate VAT and total if baseAmount and vatRate are provided
        let vatAmount = null;
        let totalAmount = null;
        if (body.baseAmount !== undefined && body.vatRate !== undefined) {
            vatAmount = (body.baseAmount * body.vatRate) / 100;
            totalAmount = body.baseAmount + vatAmount;
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId: user.id,
                type: body.type,
                title: body.title,
                invoiceNumber: body.invoiceNumber,
                description: body.description,
                baseAmount: body.baseAmount,
                vatRate: body.vatRate,
                vatAmount,
                totalAmount,
                date: body.date ? new Date(body.date) : new Date(),
            },
        });

        return NextResponse.json(transaction);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 });
        }
        console.error('Error creating transaction:', error);
        return new NextResponse('Internal error', { status: 500 });
    }
}
