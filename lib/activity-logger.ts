import { prisma } from './prisma';

interface LogActivityParams {
  action: string;
  entity: string;
  entityId?: string;
  details?: string | object;
  userId: string;
  taskId?: string;
}

export async function logActivity({
  action,
  entity,
  entityId,
  details,
  userId,
  taskId,
}: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entity,
        entityId,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        userId,
        taskId,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error - logging failure shouldn't break the main operation
  }
}
