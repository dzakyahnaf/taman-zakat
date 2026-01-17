import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return createErrorResponse('Invalid credentials', 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return createErrorResponse('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    // Log activity
    await logActivity({
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
    });

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
