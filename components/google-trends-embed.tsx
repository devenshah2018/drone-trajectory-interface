"use client";

// Google Trends embed URLs - req param is encoded JSON config for "drones" 2004-2026
const TIMESERIES_URL =
  "https://trends.google.com/trends/embed/explore/TIMESERIES?req=%7B%22comparisonItem%22%3A%5B%7B%22keyword%22%3A%22drones%22%2C%22geo%22%3A%22%22%2C%22time%22%3A%222004-01-01%202026-03-20%22%7D%5D%2C%22category%22%3A0%2C%22property%22%3A%22%22%7D&tz=-480&embedType=widget";
const GEOMAP_URL =
  "https://trends.google.com/trends/embed/explore/GEO_MAP?req=%7B%22comparisonItem%22%3A%5B%7B%22keyword%22%3A%22drones%22%2C%22geo%22%3A%22%22%2C%22time%22%3A%222004-01-01%202026-03-20%22%7D%5D%2C%22category%22%3A0%2C%22property%22%3A%22%22%7D&tz=-480&embedType=widget";

export function GoogleTrendsEmbed() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="overflow-hidden rounded-lg border border-border/60 bg-card/50">
        <div className="border-b border-border/40 bg-muted/30 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">
            Interest over time
          </p>
        </div>
        <div className="relative min-h-[320px] w-full overflow-hidden">
          <iframe
            src={TIMESERIES_URL}
            className="absolute inset-0 h-full w-full border-0"
            title="Google Trends - Interest over time for drones"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-border/60 bg-card/50">
        <div className="border-b border-border/40 bg-muted/30 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">
            Interest by region
          </p>
        </div>
        <div className="relative min-h-[320px] w-full overflow-hidden">
          <iframe
            src={GEOMAP_URL}
            className="absolute inset-0 h-full w-full border-0"
            title="Google Trends - Interest by region for drones"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
