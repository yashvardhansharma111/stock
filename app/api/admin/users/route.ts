import { getDb } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get("ajx_admin");
    if (!adminCookie || adminCookie.value !== "ok") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    const db = await getDb();
    const users = db.collection("users");

    const docs = await users
      .find(
        {},
        {
          projection: {
            fullName: 1,
            email: 1,
            phone: 1,
            panNumber: 1,
            aadhaarNumber: 1,
            status: 1,
            adminPlainPassword: 1,
            tradingBalance: 1,
            margin: 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ users: docs });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get("ajx_admin");
    if (!adminCookie || adminCookie.value !== "ok") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, tradingBalance, margin } = body || {};

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof tradingBalance === "number" && Number.isFinite(tradingBalance)) {
      updates.tradingBalance = tradingBalance;
    }
    if (typeof margin === "number" && Number.isFinite(margin)) {
      updates.margin = margin;
    }

    const db = await getDb();
    const users = db.collection("users");
    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: updates,
      },
    );

    return NextResponse.json({ message: "User updated" });
  } catch (error) {
    console.error("Admin users update error:", error);
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 },
    );
  }
}

