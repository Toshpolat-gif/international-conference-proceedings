import { NextRequest } from "next/server";
import { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export async function getVerifiedUser(request: NextRequest): Promise<DecodedIdToken> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) throw new Error("Missing authorization token.");
  return getAdminAuth().verifyIdToken(token);
}

export async function requireAdmin(request: NextRequest): Promise<DecodedIdToken> {
  const user = await getVerifiedUser(request);
  if (user.admin === true) return user;
  const userDoc = await getAdminDb().collection("users").doc(user.uid).get();
  if (userDoc.data()?.role !== "admin") throw new Error("Administrator access required.");
  return user;
}
