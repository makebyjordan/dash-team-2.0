import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const subscriptionSchema = z.object({
    category: z.enum(['AI', 'TECH']),
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    frequency: z.enum(['MONTHLY', 'ANNUAL']).optional(),
    paymentDay: z.number().min(1).max(31).optional(),
});

// GET all subscriptions
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        const subscriptions = await prisma.subscription.findMany({
            where: {
                userId: user.id,
                ...(category && { category: category as any }),
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(subscriptions);
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        return new NextResponse('Internal error', { status: 500 });
    }
}

// POST new subscription
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
        const body = subscriptionSchema.parse(json);

        // Calculate base amount and VAT (21%) if price is provided
        let baseAmount = null;
        let vatAmount = null;
        if (body.price !== undefined) {
            baseAmount = body.price / 1.21;
            vatAmount = body.price - baseAmount;
        }

        const subscription = await prisma.subscription.create({
            data: {
                userId: user.id,
                category: body.category,
                title: body.title,
                description: body.description,
                price: body.price,
                frequency: body.frequency,
                baseAmount,
                vatAmount,
                paymentDay: body.paymentDay,
            },
        });

        return NextResponse.json(subscription);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 });
        }
        console.error('Error creating subscription:', error);
        return new NextResponse('Internal error', { status: 500 });
    }
}
