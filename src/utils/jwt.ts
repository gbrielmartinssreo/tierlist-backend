import { JWTPayload, UserPayload } from "../types";
import { SignJWT, jwtVerify, JWTPayload as JosePayload } from "jose";

export type { JWTPayload };

const getSecretKey = (type: "access" | "refresh") => {
  const secret =
    type === "access"
      ? process.env.JWT_SECRET!
      : process.env.JWT_REFRESH_SECRET!;
  return new TextEncoder().encode(secret);
};

const getExpiry = (type: "access" | "refresh") => {
  return type === "access"
    ? process.env.JWT_ACCESS_EXPIRY || "15m"
    : process.env.JWT_REFRESH_EXPIRY || "7d";
};

export async function createAccessToken(user: UserPayload): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email, name: user.name, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(getExpiry("access"))
    .sign(getSecretKey("access"));
}

export async function createRefreshToken(
  user: UserPayload,
  tokenId: string,
): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email, name: user.name, type: "refresh", tokenId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(getExpiry("refresh"))
    .sign(getSecretKey("refresh"));
}

export async function verifyToken(
  token: string,
  type: "access" | "refresh",
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(type));
    if (payload.type !== type) return null;
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(
  authHeader: string | undefined,
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
