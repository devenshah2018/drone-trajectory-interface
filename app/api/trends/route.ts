import { NextResponse } from "next/server";
import googleTrends from "google-trends-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseTrendsResponse(res: unknown) {
  if (typeof res === "string") {
    try {
      return JSON.parse(res);
    } catch {
      return null;
    }
  }
  return res;
}

export async function GET() {
  try {
    const [overTimeRes, byRegionRes] = await Promise.all([
      googleTrends.interestOverTime({
        keyword: "drones",
        endTime: new Date(),
      }),
      googleTrends.interestByRegion({
        keyword: "drones",
        startTime: new Date("2004-01-01"),
        endTime: new Date(),
        resolution: "COUNTRY",
      }),
    ]);

    const overTime = parseTrendsResponse(overTimeRes);
    const byRegion = parseTrendsResponse(byRegionRes);

    const timelineData = overTime?.default?.timelineData ?? overTime?.timelineData ?? [];
    const geoMapData = byRegion?.default?.geoMapData ?? byRegion?.geoMapData ?? [];

    return NextResponse.json({
      overTime: timelineData.map((d: { formattedTime?: string; value?: number[] }) => [
        d.formattedTime ?? "",
        Array.isArray(d.value) ? (d.value[0] ?? 0) : 0,
      ]),
      byRegion: geoMapData
        .map((d: { geoName?: string; value?: number[] }) => [
          d.geoName ?? "",
          Array.isArray(d.value) ? (d.value[0] ?? 0) : 0,
        ]),
    });
  } catch (err) {
    console.error("Trends API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch trends data" },
      { status: 500 }
    );
  }
}
