"use client"

import type { MissionStats, Waypoint } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Clock, MapPin, Camera, Navigation } from "lucide-react"

interface CompactMissionStatsProps {
  stats: MissionStats | null
  waypoints: Waypoint[]
}

export function CompactMissionStats({ stats, waypoints }: CompactMissionStatsProps) {
  if (!stats) {
    return (
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold text-foreground">Mission Statistics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm font-medium mb-1">No Mission Data</p>
            <p className="text-xs">Generate a flight plan to see statistics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m ${secs}s`
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold text-foreground">Mission Statistics</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">Waypoints</p>
            </div>
            <p className="text-lg font-bold text-foreground">{stats.totalWaypoints}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">Duration</p>
            </div>
            <p className="text-lg font-bold text-foreground">{formatTime(stats.estimatedTime)}</p>
          </div>
        </div>

        {/* Distance & Coverage */}
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Flight Distance</span>
            <span className="font-medium text-foreground">{(stats.totalDistance / 1000).toFixed(1)} km</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Coverage Area</span>
            <span className="font-medium text-foreground">{(stats.coverageArea / 10000).toFixed(2)} ha</span>
          </div>
        </div>
        
        {/* Camera & Quality Metrics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <Camera className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Image Quality</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ground Sampling</span>
              <span className="font-medium text-foreground">{(stats.gsd * 100).toFixed(1)} cm/px</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Image Footprint</span>
              <span className="font-medium text-foreground">
                {stats.imageFootprint[0].toFixed(0)} × {stats.imageFootprint[1].toFixed(0)}m
              </span>
            </div>
          </div>
        </div>

        {/* Waypoints Table */}
        {waypoints && waypoints.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Navigation className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Waypoint Positions</h3>
            </div>
            <div className="max-h-48 overflow-y-auto border border-border/50 rounded-lg">
              <div className="sticky top-0 bg-muted/50 border-b border-border/50">
                <div className="grid grid-cols-4 gap-2 p-3 text-xs font-medium text-muted-foreground">
                  <div>Point</div>
                  <div>X (m)</div>
                  <div>Y (m)</div>
                  <div>Speed (m/s)</div>
                </div>
              </div>
              <div className="divide-y divide-border/30">
                {waypoints.map((waypoint, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 p-3 text-xs font-mono hover:bg-muted/30 transition-colors">
                    <div className="text-muted-foreground">#{index + 1}</div>
                    <div className="text-foreground">{waypoint.x.toFixed(1)}</div>
                    <div className="text-foreground">{waypoint.y.toFixed(1)}</div>
                    <div className="text-foreground">{waypoint.speed.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
