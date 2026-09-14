"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteMove } from "@/app/actions/moves";
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

export function DeleteMoveButton({
  moveId,
  label,
}: {
  moveId: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="destructive" className="h-10" />}
      >
        Delete move
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this move?</DialogTitle>
          <DialogDescription>
            “{label}” and its stages and checklist will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="h-10" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="h-10"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await deleteMove(moveId);
                if (result?.error) {
                  toast.error(result.error);
                }
              });
            }}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
