"use client"

import { Button } from "@/components/ui/button"
import { Plane, RotateCcw } from "lucide-react"

/**
 * Props for the floating generate/reset control.
 *
 * @param onGenerate - Callback invoked when the user requests flight plan generation
 * @param onReset - Callback invoked to reset all configuration to defaults
 * @param isGenerating - Flag indicating whether generation is currently in progress
 */
interface FloatingGenerateButtonProps {
  onGenerate: () => void
  onReset: () => void
  isGenerating: boolean
}

/**
 * Floating action control containing a reset shortcut and a primary generate button.
 *
 * @param props - Component props
 * @param props.onGenerate - Called when the user clicks the Generate button
 * @param props.onReset - Called when the user clicks the Reset button
 * @param props.isGenerating - When true, the Generate button shows a spinner and is disabled
 * @returns A fixed-position control with Reset and Generate actions
 * @remarks Client component that intentionally sits above other content and should
 * be keyboard accessible. Visual styling and disabled state are preserved.
 */
export function FloatingGenerateButton({ onGenerate, onReset, isGenerating }: FloatingGenerateButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Reset Button: small circular outline button that resets configuration. Disabled while generating. */}
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

      {/* Primary Generate Button: shows spinner and message when generating. Disabled while generating to prevent duplicate requests. */}
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        size="lg"
        className="h-14 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-full cursor-pointer"
      >
        {isGenerating ? (
          // Loading state: spinner and text
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            <span>Generating...</span>
          </div>
        ) : (
          // Default state: plane icon and descriptive label
          <div className="flex items-center gap-3">
            <Plane className="w-5 h-5" />
            <span>Generate Flight Plan</span>
          </div>
        )}
      </Button>
    </div>
  )
}
