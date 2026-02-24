import { getDb } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get("ajx_admin");
    if (!adminCookie || adminCookie.value !== "ok") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { userId, password } = body || {};

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 },
      );
    }

    const plainPassword = (password ?? "").toString();
    if (!plainPassword) {
      return NextResponse.json(
        { message: "password is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const users = db.collection("users");

    const user = await users.findOne<{ email?: string; status?: string }>({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          passwordHash,
          adminPlainPassword: plainPassword,
          status: "active",
          activatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      message: "Password set",
      email: user.email,
      plainPassword,
    });
  } catch (error) {
    console.error("Generate password error:", error);
    return NextResponse.json(
      { message: "Failed to set password" },
      { status: 500 },
    );
  }
}

