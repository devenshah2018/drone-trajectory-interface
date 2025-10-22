"use client";

import { Button } from "@/components/ui/button";
import { Plane, RotateCcw } from "lucide-react";

/**
 * Props for the floating generate/reset control.
 *
 * @param onGenerate - Callback invoked when the user requests flight plan generation
 * @param onReset - Callback invoked to reset all configuration to defaults
 * @param isGenerating - Flag indicating whether generation is currently in progress
 * @param showReset - Flag indicating whether the reset button should be shown
 * @param exportButton - Optional node to render an export button
 */
interface FloatingGenerateButtonProps {
  onGenerate: () => void;
  onReset: () => void;
  isGenerating: boolean;
  showReset?: boolean;
  exportButton?: React.ReactNode;
}

/**
 * Floating action control containing a reset shortcut and a primary generate button.
 *
 * @param props - Component props
 * @param props.onGenerate - Called when the user clicks the Generate button
 * @param props.onReset - Called when the user clicks the Reset button
 * @param props.isGenerating - When true, the Generate button shows a spinner and is disabled
 * @param props.showReset - When true, the Reset button is shown
 * @param props.exportButton - Optional node to render an export button
 * @returns A fixed-position control with Reset, Generate, and optional Export actions
 * @remarks Client component that intentionally sits above other content and should
 * be keyboard accessible. Visual styling and disabled state are preserved.
 */
export function FloatingGenerateButton({
  onGenerate,
  onReset,
  isGenerating,
  showReset = true,
  exportButton,
}: FloatingGenerateButtonProps) {
  return (
    <div className="fixed right-6 bottom-6 z-50 flex items-center gap-3 sm:flex">
      <div className={`flex items-center gap-3 sm:hidden1 ${!showReset ? "mr-4" : ""}`}>
        {showReset && (
          <Button
            onClick={onReset}
            disabled={isGenerating}
            size="lg"
            variant="outline"
            className="bg-card/90 hover:bg-card border-border/50 hover:border-border h-12 w-12 cursor-pointer rounded-full p-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl"
            title="Reset all configurations"
          >
            <RotateCcw className="text-muted-foreground h-5 w-5" />
          </Button>
        )}
        {exportButton}
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 w-14 cursor-pointer rounded-full p-0 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl flex items-center justify-center"
        >
          {isGenerating ? (
            <div className="border-primary-foreground/30 border-t-primary-foreground h-5 w-5 animate-spin rounded-full border-2" />
          ) : (
            <Plane className="h-5 w-5" />
          )}
        </Button>
      </div>
      {/* Desktop: show full button with text */}
      <div className="hidden sm:flex items-center gap-3">
        {showReset && (
          <Button
            onClick={onReset}
            disabled={isGenerating}
            size="lg"
            variant="outline"
            className="bg-card/90 hover:bg-card border-border/50 hover:border-border h-12 w-12 cursor-pointer rounded-full p-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl"
            title="Reset all configurations"
          >
            <RotateCcw className="text-muted-foreground h-5 w-5" />
          </Button>
        )}
        {exportButton}
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 cursor-pointer rounded-full px-6 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          {isGenerating ? (
            <div className="flex items-center gap-3">
              <div className="border-primary-foreground/30 border-t-primary-foreground h-5 w-5 animate-spin rounded-full border-2" />
              <span>Generating...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Plane className="h-5 w-5" />
              <span>Generate Flight Plan</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
