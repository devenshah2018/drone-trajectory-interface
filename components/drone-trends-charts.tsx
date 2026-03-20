"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

const CHART_HEIGHT = 432;
const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/** Map Google Trends region names to world-atlas ISO 3166-1 numeric country IDs */
const REGION_TO_ID: Record<string, string> = {
  "United States": "840",
  "United States of America": "840",
  "United Kingdom": "826",
  Australia: "036",
  Canada: "124",
  Germany: "276",
  India: "356",
  Singapore: "702",
  "New Zealand": "554",
  "South Korea": "410",
  Korea: "410",
  Japan: "392",
  Philippines: "608",
  Brazil: "076",
  France: "250",
  Netherlands: "528",
  Spain: "724",
  Italy: "380",
  Pakistan: "586",
  Nigeria: "566",
  "South Africa": "710",
  Indonesia: "360",
  Malaysia: "458",
  Turkey: "792",
  "Hong Kong": "344",
  Taiwan: "158",
  Israel: "376",
  "United Arab Emirates": "784",
  "Saudi Arabia": "682",
  Mexico: "484",
  Argentina: "032",
  Chile: "152",
  Poland: "616",
  Sweden: "752",
  Portugal: "620",
  Belgium: "056",
  Austria: "040",
  Switzerland: "756",
  Ireland: "372",
  "Czech Republic": "203",
  Czechia: "203",
  Romania: "642",
  Greece: "300",
  Hungary: "348",
  Thailand: "764",
  Vietnam: "704",
  Egypt: "818",
  Bangladesh: "050",
  Colombia: "170",
  Peru: "604",
  Ukraine: "804",
  Russia: "643",
};

function getFillColor(value: number, maxValue: number) {
  if (value <= 0) return "#e5e7eb";
  const intensity = Math.min(1, value / Math.max(maxValue, 1));
  return `rgba(147, 197, 253, ${0.3 + intensity * 0.5})`;
}

function InterestByRegionMap({
  byRegion,
}: {
  byRegion: { region: string; value: number }[];
}) {
  const dataById = useMemo(() => {
    const map = new Map<string, number>();
    for (const { region, value } of byRegion) {
      const id = REGION_TO_ID[region];
      if (id) map.set(id, value);
    }
    return map;
  }, [byRegion]);

  const maxValue = useMemo(
    () => Math.max(...byRegion.map((r) => r.value), 1),
    [byRegion]
  );

  return (
    <div className="relative flex h-full min-h-0 w-full min-w-0 overflow-visible">
      <div className="absolute inset-0 overflow-visible">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 132,
            center: [0, 34],
          }}
          width={800}
          height={432}
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies
              .filter((geo) => {
                const id = String(geo.id ?? "");
                const name = String(
                  (geo.properties as { name?: string })?.name ?? ""
                ).toLowerCase();
                return id !== "010" && name !== "antarctica";
              })
              .map((geo) => {
              const id = String(geo.id ?? "");
              const value = dataById.get(id) ?? 0;
              const fill = getFillColor(value, maxValue);
              const region = byRegion.find((r) => REGION_TO_ID[r.region] === id);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke="#e2e8f0"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: "none", transition: "fill 0.15s ease" },
                    hover: { outline: "none", opacity: 0.95 },
                    pressed: { outline: "none" },
                  }}
                >
                  <title>
                    {region ? `${region.region}: ${region.value}` : geo.properties?.name ?? id}
                  </title>
                </Geography>
              );
            })
          }
        </Geographies>
      </ComposableMap>
      </div>
      {/* Legend overlay — bottom right */}
      <div className="pointer-events-none absolute bottom-1.5 right-1.5 z-10 flex items-center gap-1 rounded border border-border/40 bg-background/90 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
        <span className="text-[8px] font-medium leading-none text-muted-foreground whitespace-nowrap sm:text-[9px]">
          Search interest
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[8px] tabular-nums leading-none text-muted-foreground sm:text-[9px]">
            0
          </span>
          <div
            className="h-1 w-14 rounded-[2px] sm:h-1.5 sm:w-16"
            style={{
              background:
                "linear-gradient(to right, #e5e7eb, rgba(147, 197, 253, 0.5), rgba(147, 197, 253, 0.8))",
            }}
          />
          <span className="text-[8px] tabular-nums leading-none text-muted-foreground sm:text-[9px]">
            100
          </span>
        </div>
      </div>
    </div>
  );
}

export function DroneTrendsCharts() {
  const [overTime, setOverTime] = useState<{ date: string; value: number }[] | null>(null);
  const [byRegion, setByRegion] = useState<{ region: string; value: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trends")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setOverTime(
          (data.overTime ?? []).map(([date, value]: [string, number]) => ({
            date,
            value: Number(value) || 0,
          }))
        );
        setByRegion(
          (data.byRegion ?? []).map(([region, value]: [string, number]) => ({
            region,
            value: Number(value) || 0,
          }))
        );
      })
      .catch(() => setError("Could not load trends"));
  }, []);

  const yearTicks = useMemo(() => {
    if (!overTime) return [];
    const seen = new Set<number>();
    const ticks: string[] = [];
    const yearMatch = /\b(20\d{2})\b/;
    for (const { date } of overTime) {
      const m = date.match(yearMatch);
      const year = m ? parseInt(m[1], 10) : NaN;
      if (!isNaN(year) && !seen.has(year)) {
        seen.add(year);
        ticks.push(date);
      }
    }
    return ticks;
  }, [overTime]);

  if (error) {
    return (
      <a
        href="https://trends.google.com/trends/explore?q=drones"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 text-center block py-6 bg-transparent"
      >
        View &quot;drones&quot; on Google Trends →
      </a>
    );
  }

  if (!overTime || !byRegion) {
    return (
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        <div
          className="flex items-center justify-center bg-transparent"
          style={{ minHeight: CHART_HEIGHT }}
        >
          <p className="text-sm text-muted-foreground">Loading charts…</p>
        </div>
        <div
          className="flex items-center justify-center bg-transparent"
          style={{ minHeight: CHART_HEIGHT }}
        >
          <p className="text-sm text-muted-foreground">Loading charts…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 overflow-visible lg:grid-cols-2 lg:gap-14 items-stretch">
      <div className="bg-transparent overflow-visible min-h-0" style={{ height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={overTime} margin={{ top: 10, right: 12, left: 4, bottom: 36 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="date"
              ticks={yearTicks}
              tickFormatter={(value) => {
                const m = String(value).match(/\b(20\d{2})\b/);
                return m ? m[1] : value;
              }}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", angle: -40 }}
              tickMargin={4}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={{ stroke: "#e2e8f0" }}
              label={{
                value: "Year",
                position: "insideBottom",
                offset: 0,
                style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={{ stroke: "#e2e8f0" }}
              label={{
                value: "Search interest",
                angle: -90,
                position: "insideLeft",
                offset: 0,
                style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <Tooltip
              contentStyle={{
                fontSize: 13,
                borderRadius: "var(--radius)",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                padding: "10px 14px",
                backgroundColor: "hsl(var(--background))",
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              name="Interest"
              stroke="#93c5fd"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#93c5fd", strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div
        className="bg-transparent flex flex-col overflow-visible min-h-0 w-full"
        style={{ height: CHART_HEIGHT }}
      >
        <div className="w-full max-w-full flex-1 min-h-0 flex flex-col overflow-visible">
          <InterestByRegionMap byRegion={byRegion} />
        </div>
      </div>
    </div>
  );
}
