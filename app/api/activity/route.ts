import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

// GET activity logs for authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const logs = await prisma.activityLog.findMany({
      where: {
        userId: user.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        task: {
          select: {
            title: true,
          },
        },
      },
    });

    return createSuccessResponse(logs);
  } catch (error) {
    console.error('Get activity logs error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
