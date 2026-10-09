import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { currentAdmin } from "@/lib/auth";
import { Certificate } from "@/lib/models";
import { certificateInput } from "@/lib/validation";
import { fail, sameOrigin } from "@/lib/http";
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(req)) return fail("Request origin is not allowed.", 403);
  try {
    const admin = await currentAdmin();
    if (!admin) return fail("Sign in to continue.", 401);
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return fail("Invalid record ID.");
    const parsed = certificateInput.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    const record = await Certificate.findByIdAndUpdate(
      id,
      { $set: { ...parsed.data, updatedBy: admin.id } },
      { new: true, runValidators: true },
    );
    if (!record) return fail("Record not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      return fail("That certificate number already exists.", 409);
    return fail("Unable to update record.", 503);
  }
}
