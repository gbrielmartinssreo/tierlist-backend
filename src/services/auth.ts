import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { createAccessToken, createRefreshToken, verifyToken } from '../utils/jwt';
import { UserPayload } from '../types';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerUser(
  email: string,
  name: string,
  password: string
): Promise<{ user: UserPayload; accessToken: string; refreshToken: string }> {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  const userPayload: UserPayload = { id: user.id, email: user.email, name: user.name };
  const accessToken = await createAccessToken(userPayload);
  const refreshToken = await createRefreshToken(userPayload, crypto.randomUUID());

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { user: userPayload, accessToken, refreshToken };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: UserPayload; accessToken: string; refreshToken: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const userPayload: UserPayload = { id: user.id, email: user.email, name: user.name };
  const accessToken = await createAccessToken(userPayload);
  const refreshToken = await createRefreshToken(userPayload, crypto.randomUUID());

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { user: userPayload, accessToken, refreshToken };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const payload = await verifyToken(refreshToken, 'refresh');
  if (!payload || !payload.tokenId) return null;

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    }
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return null;

  const userPayload: UserPayload = { id: user.id, email: user.email, name: user.name };
  const newAccessToken = await createAccessToken(userPayload);
  const newRefreshToken = await createRefreshToken(userPayload, crypto.randomUUID());

  await prisma.refreshToken.delete({ where: { id: storedToken.id } });
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(refreshToken: string): Promise<void> {
  const payload = await verifyToken(refreshToken, 'refresh');
  if (!payload || !payload.tokenId) return;

  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
}

export async function getUserById(id: string): Promise<UserPayload | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });
  return user ? { id: user.id, email: user.email, name: user.name } : null;
}

export async function updateUser(
  id: string,
  data: { name?: string; avatarUrl?: string | null }
): Promise<UserPayload | null> {
  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true },
  });
  return user ? { id: user.id, email: user.email, name: user.name } : null;
}