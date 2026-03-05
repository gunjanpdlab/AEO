import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const users = await User.find({})
    .select("name email role createdAt")
    .sort({ createdAt: -1 });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role || "user",
      createdAt: u.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || "user",
  });

  return NextResponse.json({ message: "User created" });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id, name, email, password, role } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const update: Record<string, string> = {};
  if (name) update.name = name;
  if (email) update.email = email;
  if (role) update.role = role;
  if (password) update.password = await bcrypt.hash(password, 12);

  await User.findByIdAndUpdate(id, { $set: update });
  return NextResponse.json({ message: "User updated" });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await req.json();
  if (id === admin._id.toString()) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await User.findByIdAndDelete(id);
  return NextResponse.json({ message: "User deleted" });
}
