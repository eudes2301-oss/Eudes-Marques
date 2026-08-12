import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { User, UserRole } from "../types.js";

const JWT_SECRET = process.env.JWT_SECRET || "ifood_express_jwt_secret_2026_key";

export interface DecodedToken {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  courierId?: string;
  iat: number;
  exp: number;
}

export function generateAuthToken(user: User): string {
  const payload: DecodedToken = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    courierId: user.courierId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days validity
  };

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

export function verifyAuthToken(token: string): DecodedToken | null {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      const decoded: DecodedToken = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return null; // Expired
      }
      return decoded;
    }
  } catch (err) {
    return null;
  }
  return null;
}

export interface AuthenticatedRequest extends Request {
  user?: DecodedToken;
}

export function requireAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Acesso não autorizado: Token Bearer ausente." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyAuthToken(token);

  if (!decoded) {
    return res.status(401).json({ success: false, error: "Acesso negado: Token inválido ou expirado." });
  }

  req.user = decoded;
  next();
}
