import jwt from 'jsonwebtoken';
import { authConfig } from './config';

export interface TokenPayload {
  userId: string;
  tokenVersion: number;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.accessTokenExpiry / 1000, // Converti in secondi
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.refreshTokenExpiry / 1000, // Converti in secondi
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, authConfig.jwtSecret) as TokenPayload;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return null;
  }
}