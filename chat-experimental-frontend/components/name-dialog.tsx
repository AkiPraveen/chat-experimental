"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NameDialogProps {
  onNameSubmit: (name: string) => void;
}

export function NameDialog({ onNameSubmit }: NameDialogProps) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNameSubmit(name.trim());
      setOpen(false);
    }
  };

  // Prevent closing the dialog if no name is set
  useEffect(() => {
    if (!name.trim()) {
      setOpen(true);
    }
  }, [name]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to Chat Experimental</DialogTitle>
          <DialogDescription>
            Please enter your name to start chatting
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={!name.trim()}>
              Start Chatting
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 