import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

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
    const settings = db.collection("settings");

    const imgDoc = await settings.findOne<{ value?: { data?: any } }>({
      key: "fund_qr_image",
    });

    if (imgDoc?.value?.data) {
      return NextResponse.json({ qrUrl: "/api/config/fund-qr-image" });
    }

    const doc = await settings.findOne<{ value?: string }>({
      key: "fund_qr_url",
    });

    return NextResponse.json({ qrUrl: doc?.value || null });
  } catch (error) {
    console.error("Admin QR get error:", error);
    return NextResponse.json(
      { message: "Failed to fetch QR" },
      { status: 500 },
    );
  }
}

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
    const { qrUrl } = body || {};

    const db = await getDb();
    const settings = db.collection("settings");

    await settings.updateOne(
      { key: "fund_qr_url" },
      { $set: { value: qrUrl || null, updatedAt: new Date() } },
      { upsert: true },
    );

    return NextResponse.json({ message: "QR updated" });
  } catch (error) {
    console.error("Admin QR save error:", error);
    return NextResponse.json(
      { message: "Failed to save QR" },
      { status: 500 },
    );
  }
}

