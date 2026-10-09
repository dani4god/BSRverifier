import { NextRequest, NextResponse } from "next/server";
import { Certificate } from "@/lib/models";
import { numberSchema, publicFields } from "@/lib/validation";
import { fail, limited, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return fail("Request origin is not allowed.", 403);
  try {
    if (await limited(req, "verify", 30, 10))
      return fail("Too many lookups. Please try again later.", 429);
    const body = await req.json();
    const parsed = numberSchema.safeParse(body.certificateNumber);
    if (!parsed.success)
      return fail("Enter a valid certificate number (6–64 characters).");
    const result = await Certificate.findOne({ certificateNumber: parsed.data })
      .select(publicFields)
      .lean();
    if (!result)
      return fail("No record found for this certificate number.", 404);
    return NextResponse.json(
      { result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return fail(
      "Verification is temporarily unavailable. Please try again.",
      503,
    );
  }
}
