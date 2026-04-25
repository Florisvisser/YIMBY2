import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "data", "schapenweide.geojson");
  const geojson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return NextResponse.json(geojson);
}
