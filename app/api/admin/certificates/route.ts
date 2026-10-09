import { NextRequest, NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { Certificate } from "@/lib/models";
import { certificateInput } from "@/lib/validation";
import { fail, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    if (!(await currentAdmin())) return fail("Sign in to continue.", 401);
    const rawPage = Number(req.nextUrl.searchParams.get("page") || 1);
    const page = Number.isFinite(rawPage)
      ? Math.max(1, Math.min(100000, Math.floor(rawPage)))
      : 1;
    const q = (req.nextUrl.searchParams.get("q") || "")
      .trim()
      .slice(0, 64)
      .toUpperCase();
    const filter = q ? { certificateNumber: q } : {};
    const [records, total] = await Promise.all([
      Certificate.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * 20)
        .limit(20)
        .select("-__v -createdBy -updatedBy")
        .lean(),
      Certificate.countDocuments(filter),
    ]);
    return NextResponse.json(
      { records, total, page },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return fail("Unable to load records.", 503);
  }
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return fail("Request origin is not allowed.", 403);
  try {
    const admin = await currentAdmin();
    if (!admin) return fail("Sign in to continue.", 401);
    const parsed = certificateInput.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    await Certificate.init();
    const record = await Certificate.create({
      ...parsed.data,
      createdBy: admin.id,
      updatedBy: admin.id,
    });
    return NextResponse.json({ id: String(record._id) }, { status: 201 });
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      return fail("That certificate number already exists.", 409);
    return fail("Unable to save record.", 503);
  }
}
