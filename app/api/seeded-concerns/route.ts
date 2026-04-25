import { getConcerns } from "@/lib/data/concerns";

export const runtime = "nodejs";

export async function GET() {
  const concerns = await getConcerns();
  return Response.json(concerns);
}
