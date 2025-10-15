"use client"

import type { MissionStats } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MissionStatsProps {
  stats: MissionStats
}

export function MissionStatsDisplay({ stats }: MissionStatsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Waypoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">{stats.totalWaypoints}</div>
          <p className="text-xs text-muted-foreground mt-1">Photo capture points</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Mission Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">{formatTime(stats.estimatedTime)}</div>
          <p className="text-xs text-muted-foreground mt-1">{stats.totalDistance.toFixed(1)}m total distance</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Coverage Area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">{(stats.coverageArea / 10000).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">hectares surveyed</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ground Sampling Distance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">{(stats.gsd * 100).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">cm/pixel resolution</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Image Footprint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            {stats.imageFootprint[0].toFixed(1)} × {stats.imageFootprint[1].toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">meters per image</p>
        </CardContent>
      </Card>
    </div>
  )
}
