import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Opportunity, OpportunityFormValues } from "./types";
import { toDateInput } from "./utils";

const emptyForm = (): OpportunityFormValues => ({
  title: "", company: "", url: "", type: "INTERNSHIP", deadline: "", isGlobal: false,
});

interface OpportunityFormDialogProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Opportunity | null;
  isAdmin: boolean;
  isSubmitting: boolean;
  onSubmit: (values: OpportunityFormValues) => void;
}

export function OpportunityFormDialog({
  mode, open, onOpenChange, initial, isAdmin, isSubmitting, onSubmit,
}: OpportunityFormDialogProps) {
  const [form, setForm] = useState<OpportunityFormValues>(emptyForm());

  useEffect(() => {
    if (mode === "edit" && initial) {
      setForm({
        title: initial.title,
        company: initial.company,
        url: initial.url,
        type: initial.type,
        deadline: toDateInput(initial.deadline),
        isGlobal: initial.departmentId === null,
      });
    } else if (open) {
      setForm(emptyForm());
    }
  }, [mode, initial, open]);

  const set = <K extends keyof OpportunityFormValues>(key: K, value: OpportunityFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isValid = form.title.trim() && form.company.trim() && form.url.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-bold">
            {mode === "create" ? "Post an Opportunity" : "Edit Opportunity"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? isAdmin && form.isGlobal
                ? "This opportunity will be visible to all students across every faculty."
                : "Found a great opportunity? Share it with students in your department."
              : "Update the details below — changes are visible immediately."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="opp-title">Job or Opportunity Title</Label>
            <Input
              id="opp-title"
              placeholder="e.g. Software Engineering Intern"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opp-company">Company / Organization</Label>
            <Input
              id="opp-company"
              placeholder="e.g. Google, MTN, Federal Govt"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNSHIP">Internship</SelectItem>
                  <SelectItem value="SCHOLARSHIP">Scholarship</SelectItem>
                  <SelectItem value="HACKATHON">Hackathon</SelectItem>
                  <SelectItem value="JOB">Job</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-deadline">Deadline (Optional)</Label>
              <Input
                id="opp-deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => set("deadline", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="opp-url">Application Link (URL)</Label>
            <Input
              id="opp-url"
              type="url"
              placeholder="https://..."
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
            />
          </div>
          {isAdmin && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 px-4 py-3">
              <Checkbox
                id="opp-isGlobal"
                checked={form.isGlobal}
                onCheckedChange={(checked) => set("isGlobal", checked === true)}
                className="mt-0.5 border-amber-400 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
              />
              <div className="space-y-0.5">
                <Label htmlFor="opp-isGlobal" className="text-sm font-semibold text-amber-800 dark:text-amber-300 cursor-pointer">
                  Post for All Faculties
                </Label>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Visible to every student regardless of department.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(form)}
            disabled={!isValid || isSubmitting}
            className="bg-black hover:bg-black/90 text-white rounded-xl dark:bg-white dark:text-black"
          >
            {isSubmitting
              ? (mode === "create" ? "Posting…" : "Saving…")
              : (mode === "create" ? "Post Opportunity" : "Save Changes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
