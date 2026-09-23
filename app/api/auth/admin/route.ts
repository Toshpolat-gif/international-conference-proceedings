import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    const doc = await getAdminDb().collection("users").doc(user.uid).get();
    return NextResponse.json({ uid: user.uid, email: user.email, role: doc.data()?.role || "admin" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}
