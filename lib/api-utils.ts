import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from './auth';

export async function getUserFromRequest(
  request: NextRequest
): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function createSuccessResponse(data: unknown, status = 200) {
  return Response.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function createErrorResponse(message: string, status = 400) {
  return Response.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}
