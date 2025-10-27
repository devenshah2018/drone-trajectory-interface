"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Bug, Lightbulb, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isLoadingRemaining, setIsLoadingRemaining] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"bug" | "enhancement">("enhancement");
  const [description, setDescription] = useState("");

  // Fetch remaining submissions when dialog opens
  useEffect(() => {
    if (open && remaining === null) {
      fetchRemainingSubmissions();
    }
  }, [open]);

  const fetchRemainingSubmissions = async () => {
    setIsLoadingRemaining(true);
    try {
      const response = await fetch("/api/create-issue");
      const data = await response.json();
      setRemaining(data.remaining);
    } catch (err) {
      console.error("Failed to fetch remaining submissions:", err);
      setRemaining(5); // Default to 5 on error
    } finally {
      setIsLoadingRemaining(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create issue body with type label
      const issueBody = `${type === "bug" ? "**🐛 Bug Report**" : "**✨ Enhancement Request**"}

**Description:**
${description}

---
*Submitted via Drone Flight Planner feedback form*`;

      const response = await fetch("/api/create-issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          body: issueBody,
          type: type 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      // Update remaining count
      if (typeof data.remaining === 'number') {
        setRemaining(data.remaining);
      }

      // Success!
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        // Reset form after dialog closes
        setTimeout(() => {
          setTitle("");
          setType("enhancement");
          setDescription("");
          setSubmitted(false);
        }, 300);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset error when closing
        setTimeout(() => setError(null), 300);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/50 transition-all duration-200 cursor-pointer"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] w-full max-w-full p-0 sm:p-0 rounded-xl shadow-2xl border border-border bg-background overflow-y-auto max-h-[100dvh] sm:max-h-[90vh] flex flex-col justify-center sm:mx-0 mx-4">
        <div className="p-0 sm:p-0">
          <div className="rounded-t-xl border-b border-border px-6 py-4 flex items-center gap-3">
            <MessageSquare className="h-5 w-5" aria-hidden />
            <DialogTitle className="text-lg font-bold text-foreground">Send Feedback</DialogTitle>
          </div>
          <div className="px-6 py-6">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <svg
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <DialogTitle className="mb-2">Thank you!</DialogTitle>
                <DialogDescription>
                  Your feedback has been submitted successfully.
                </DialogDescription>
              </div>
            ) : (
              <>
                <DialogDescription className="mb-4 text-sm text-muted-foreground">
                  Report a bug or suggest an enhancement. I'll review it on GitHub.
                  {!isLoadingRemaining && remaining !== null && (
                    <span className="block mt-2 text-xs">
                      {remaining > 0 ? (
                        <span className="text-muted-foreground">
                          You can submit <span className="font-semibold text-foreground">{remaining}</span> more feedback{remaining !== 1 ? 's' : ''} today.
                        </span>
                      ) : (
                        <span className="text-destructive font-semibold">
                          You've reached the daily limit. Please try again tomorrow.
                        </span>
                      )}
                    </span>
                  )}
                </DialogDescription>
                <form onSubmit={handleSubmit} className="space-y-5" aria-label="Feedback form">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium">Type</Label>
                    <Select
                      value={type}
                      onValueChange={(value) => setType(value as "bug" | "enhancement")}
                    >
                      <SelectTrigger id="type" className="cursor-pointer w-full focus:ring-2 focus:ring-sky-400 focus:outline-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">
                          <div className="flex items-center gap-2">
                            <Bug className="h-4 w-4 text-red-500" aria-hidden />
                            <span>Bug Report</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="enhancement">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" aria-hidden />
                            <span>Feature Request</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                    <Input
                      id="title"
                      placeholder="Brief summary of the issue or suggestion"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full focus:ring-2 focus:ring-sky-400 focus:outline-none"
                      maxLength={80}
                      aria-required="true"
                      aria-label="Feedback title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide details about the bug or enhancement..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      disabled={isSubmitting}
                      rows={5}
                      className="w-full focus:ring-2 focus:ring-sky-400 focus:outline-none"
                      maxLength={1000}
                      aria-required="true"
                      aria-label="Feedback description"
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {description.length}/1000
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                      {error}
                    </div>
                  )}

                  <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto cursor-pointer"
                      aria-label="Cancel feedback"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || remaining === 0} 
                      className="w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
                      aria-label="Submit feedback"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                      <span>Submit</span>
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
