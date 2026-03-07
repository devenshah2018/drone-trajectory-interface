"use client";

import { Button } from "@/components/ui/button";
import { Rocket, RotateCcw } from "lucide-react";

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
    <div className="fixed right-6 bottom-6 z-50 flex flex-row items-center gap-2">
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        size="lg"
        className="bg-black hover:bg-black/90 text-white h-12 sm:h-12 sm:min-w-[180px] cursor-pointer rounded-full p-0 sm:px-6 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl flex items-center justify-center shrink-0"
      >
        {isGenerating ? (
          <div className="flex items-center gap-3">
            <div className="border-white/30 border-t-white h-5 w-5 animate-spin rounded-full border-2" />
            <span className="hidden sm:inline">Generating...</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Rocket className="h-5 w-5 shrink-0" />
            <span className="hidden sm:inline">Generate Flight Plan</span>
          </div>
        )}
      </Button>
    </div>
  );
}
