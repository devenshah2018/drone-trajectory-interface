"use client"

import { Button } from "@/components/ui/button"
import { Plane, RotateCcw } from "lucide-react"

interface FloatingGenerateButtonProps {
  onGenerate: () => void
  onReset: () => void
  isGenerating: boolean
}

export function FloatingGenerateButton({ onGenerate, onReset, isGenerating }: FloatingGenerateButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Reset Button */}
      <Button
        onClick={onReset}
        disabled={isGenerating}
        size="lg"
        variant="outline"
        className="h-12 w-12 p-0 bg-card/90 backdrop-blur-sm hover:bg-card border-border/50 hover:border-border shadow-lg hover:shadow-xl transition-all duration-200 rounded-full cursor-pointer"
        title="Reset all configurations"
      >
        <RotateCcw className="w-5 h-5 text-muted-foreground" />
      </Button>

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        size="lg"
        className="h-14 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-full cursor-pointer"
      >
        {isGenerating ? (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            <span>Generating...</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Plane className="w-5 h-5" />
            <span>Generate Flight Plan</span>
          </div>
        )}
      </Button>
    </div>
  )
}
