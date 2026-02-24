import { getDb } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fullName = formData.get("fullName")?.toString() ?? "";
    const email = formData.get("email")?.toString() ?? "";
    const phone = formData.get("phone")?.toString() ?? "";
    const panNumber = formData.get("panNumber")?.toString() ?? "";
    const aadhaarNumber = formData.get("aadhaarNumber")?.toString() ?? "";
    const signatureNote = formData.get("signatureNote")?.toString() ?? "";

    const photo = formData.get("photo");
    const panImage = formData.get("panImage");
    const aadhaarImage = formData.get("aadhaarImage");
    const signatureImage = formData.get("signatureImage");

    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { message: "Full name, email and phone are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const users = db.collection("users");

    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 },
      );
    }

    const documents: Record<
      string,
      { data: Buffer; contentType: string } | null
    > = {
      photo: null,
      panImage: null,
      aadhaarImage: null,
      signatureImage: null,
    };

    async function fileToDoc(
      fileEntry: FormDataEntryValue | null,
    ): Promise<{ data: Buffer; contentType: string } | null> {
      if (!fileEntry || !(fileEntry instanceof File)) return null;
      const arrayBuffer = await fileEntry.arrayBuffer();
      return {
        data: Buffer.from(arrayBuffer),
        contentType: fileEntry.type || "application/octet-stream",
      };
    }

    documents.photo = await fileToDoc(photo);
    documents.panImage = await fileToDoc(panImage);
    documents.aadhaarImage = await fileToDoc(aadhaarImage);
    documents.signatureImage = await fileToDoc(signatureImage);

    await users.insertOne({
      fullName,
      email,
      phone,
      panNumber: panNumber || null,
      aadhaarNumber: aadhaarNumber || null,
      signatureNote: signatureNote || null,
      status: "pending",
      createdAt: new Date(),
      passwordHash: null,
      tradingBalance: 0,
      margin: 0,
      documents,
    });

    return NextResponse.json(
      {
        message:
          "Registration submitted. Admin will verify your details and share a password.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Something went wrong while registering" },
      { status: 500 },
    );
  }
}

