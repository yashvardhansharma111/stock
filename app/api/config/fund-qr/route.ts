import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const settings = db.collection("settings");

    const imgDoc = await settings.findOne<{ value?: { data?: unknown } }>({
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
    console.error("Config fund QR error:", error);
    return NextResponse.json(
      { message: "Failed to load config" },
      { status: 500 },
    );
  }
}

