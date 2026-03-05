import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST() {
  await dbConnect();

  const defaults = [
    { name: "Admin", email: "admin@aeo.com", password: "admin123", role: "admin" },
    { name: "Demo User", email: "user@aeo.com", password: "user123", role: "user" },
  ];

  const created: string[] = [];
  for (const u of defaults) {
    const existing = await User.findOne({ email: u.email });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(u.password, 12);
      await User.create({
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
      });
      created.push(u.email);
    }
  }

  return NextResponse.json({
    message: created.length > 0
      ? `Created accounts: ${created.join(", ")}`
      : "Default accounts already exist",
  });
}
