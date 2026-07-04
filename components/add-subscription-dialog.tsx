"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface AddSubscriptionDialogProps {
  onAdded: () => void;
  disabled?: boolean;
}

export function AddSubscriptionDialog({ onAdded, disabled }: AddSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [category, setCategory] = useState("Other");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName("");
    setAmount("");
    setFrequency("monthly");
    setCategory("Other");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount: parseFloat(amount),
          frequency,
          category,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add subscription");
        return;
      }
      setOpen(false);
      reset();
      onAdded();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2 border-border" disabled={disabled}>
          <Plus className="h-4 w-4" />
          Add manual
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add subscription manually</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="sub-name">Name</Label>
            <Input
              id="sub-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Netflix"
              required
            />
          </div>
          <div>
            <Label htmlFor="sub-amount">Amount (USD)</Label>
            <Input
              id="sub-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="9.99"
              required
            />
          </div>
          <div>
            <Label htmlFor="sub-frequency">Frequency</Label>
            <select
              id="sub-frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div>
            <Label htmlFor="sub-category">Category</Label>
            <Input
              id="sub-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Entertainment"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding…" : "Add subscription"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
