import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createSuccessResponse, createErrorResponse } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-logger';

// GET all tasks for authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.userId,
        ...(status && { status: status as any }),
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return createSuccessResponse(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// POST create new task
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { title, description, status, dueDate } = body;

    // Validation
    if (!title) {
      return createErrorResponse('Title is required', 400);
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: user.userId,
      },
    });

    // Log activity
    await logActivity({
      action: 'CREATE',
      entity: 'Task',
      entityId: task.id,
      details: { title: task.title },
      userId: user.userId,
      taskId: task.id,
    });

    return createSuccessResponse(task, 201);
  } catch (error) {
    console.error('Create task error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
