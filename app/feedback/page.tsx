"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Send, Loader2 } from "lucide-react";

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    email: "",
    comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.category || !formData.name || !formData.email || !formData.comment) {
      setError("Please fill in all fields.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = "Failed to submit feedback";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Reset form
      setFormData({
        category: "",
        name: "",
        email: "",
        comment: "",
      });

      // Show success dialog
      setShowSuccessDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Hero Section */}
      <div className="space-y-4 text-center pb-4">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl"></div>
            <div className="relative rounded-full bg-primary/10 p-6">
              <MessageSquare className="h-16 w-16 text-primary" />
            </div>
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Any thoughts? I'd love to hear from you.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your feedback helps us improve this platform and make it more useful for everyone.
        </p>
      </div>

      {/* Feedback Form */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Share Your Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Select */}
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-foreground">
                Select feedback category <span className="text-destructive">*</span>
              </label>
              <Select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full"
              >
                <option value="">Select a category...</option>
                <option value="adding places">Adding Places</option>
                <option value="report error">Report Error</option>
                <option value="general feedback">General Feedback</option>
              </Select>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
                className="w-full"
              />
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email <span className="text-destructive">*</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
                className="w-full"
              />
            </div>

            {/* Comment Textarea */}
            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium text-foreground">
                Comment <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="comment"
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                required
                placeholder="Share your thoughts, suggestions, or report any issues..."
                rows={6}
                className="w-full"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-w-[140px]"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center">Thank you for your feedback!</DialogTitle>
            <DialogDescription className="text-center">
              We appreciate you taking the time to share your thoughts with us.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
