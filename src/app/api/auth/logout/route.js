import { NextResponse } from "next/server";
import { verifyToken } from "@/firebase/verifyToken";
import { deleteCachedToken } from "@/lib/tokenCache";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 }
      );
    }

    const decodedToken = await verifyToken(request);

    const deleted = await deleteCachedToken(token);

    return NextResponse.json({
      success: true,
      message: "Token cache invalidated",
      invalidated: deleted,
      tokenValid: decodedToken !== null,
    });
  } catch (error) {
    console.error("Error invalidating token cache:", error);
    return NextResponse.json({
      success: true,
      message: "Logout processed (cache invalidation may have failed)",
      error: error.message,
    });
  }
}
