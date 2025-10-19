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
      <DialogContent className="sm:max-w-[500px]">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
            <DialogHeader>
              <DialogTitle>Send Feedback</DialogTitle>
              <DialogDescription>
                Report a bug or suggest an enhancement. I'll review it on GitHub.
                {!isLoadingRemaining && remaining !== null && (
                  <span className="block mt-2 text-sm">
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
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={type}
                  onValueChange={(value) => setType(value as "bug" | "enhancement")}
                >
                  <SelectTrigger id="type" className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">
                      <div className="flex items-center gap-2">
                        <Bug className="h-4 w-4 text-red-500" />
                        <span>Bug Report</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="enhancement">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        <span>Feature Request</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Brief summary of the issue or suggestion"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about the bug or enhancement..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  disabled={isSubmitting}
                  rows={5}
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || remaining === 0} 
                  className="cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
