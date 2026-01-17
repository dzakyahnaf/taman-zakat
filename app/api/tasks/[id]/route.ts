import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createSuccessResponse, createErrorResponse } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-logger';

// GET single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });

    if (!task) {
      return createErrorResponse('Task not found', 404);
    }

    return createSuccessResponse(task);
  } catch (error) {
    console.error('Get task error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// PATCH update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, status, dueDate } = body;

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });

    if (!existingTask) {
      return createErrorResponse('Task not found', 404);
    }

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });

    // Log activity
    await logActivity({
      action: 'UPDATE',
      entity: 'Task',
      entityId: task.id,
      details: { changes: body },
      userId: user.userId,
      taskId: task.id,
    });

    return createSuccessResponse(task);
  } catch (error) {
    console.error('Update task error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { id } = await params;

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });

    if (!existingTask) {
      return createErrorResponse('Task not found', 404);
    }

    // Log activity before deletion
    await logActivity({
      action: 'DELETE',
      entity: 'Task',
      entityId: id,
      details: { title: existingTask.title },
      userId: user.userId,
      taskId: id,
    });

    // Delete task
    await prisma.task.delete({
      where: { id },
    });

    return createSuccessResponse({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
