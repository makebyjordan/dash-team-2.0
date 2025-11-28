import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
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

        await prisma.transaction.delete({
            where: {
                id: params.id,
                userId: user.id,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return new NextResponse('Internal error', { status: 500 });
    }
}
