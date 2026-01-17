import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password || !name) {
      return createErrorResponse('Email, password, and name are required', 400);
    }

    if (password.length < 6) {
      return createErrorResponse('Password must be at least 6 characters', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return createErrorResponse('User already exists', 409);
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    // Log activity
    await logActivity({
      action: 'REGISTER',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
    });

    return createSuccessResponse({ user, token }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
