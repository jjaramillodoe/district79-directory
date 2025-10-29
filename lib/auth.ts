import jwt from 'jsonwebtoken';

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return false;

    jwt.verify(token, jwtSecret);
    return true;
  } catch (error) {
    return false;
  }
}

