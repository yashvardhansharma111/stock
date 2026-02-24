import { cookies } from "next/headers";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";

const SESSION_COOKIE_NAME = "ajx_session";
const SESSION_TTL_MS = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createUserSession(userId: ObjectId) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const now = Date.now();

  const db = await getDb();
  const sessions = db.collection("sessions");

  await sessions.insertOne({
    userId,
    tokenHash,
    createdAt: new Date(now),
    expiresAt: new Date(now + SESSION_TTL_MS),
  });

  const response = new Response(null, { status: 204 });
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(
      SESSION_TTL_MS / 1000,
    )}`,
  );

  return { token, response };
}

export async function getUserFromSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) {
    return null;
  }

  const tokenHash = hashToken(sessionCookie.value);

  const db = await getDb();
  const sessions = db.collection("sessions");

  const session = await sessions.findOne<{
    userId: ObjectId;
    expiresAt: Date;
  }>({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    return null;
  }

  const users = db.collection("users");
  const user = await users.findOne({ _id: new ObjectId(session.userId) });

  return user;
}

