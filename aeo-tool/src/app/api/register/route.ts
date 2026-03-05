import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Registration is disabled. Contact an admin to create your account." },
    { status: 403 }
  );
}
