import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { m } from "~/paraglide/messages";
import type { DictionaryMutations } from "../hooks/use-dictionary-mutations";

interface AddWordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mutations: DictionaryMutations;
}

export function AddWordModal({
  open,
  onOpenChange,
  mutations,
}: AddWordModalProps): React.ReactElement {
  const [value, setValue] = useState("");
  const adding = mutations.addWord.isPending;

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) setValue("");
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      await mutations.addWord.mutateAsync(trimmed);
      setValue("");
      onOpenChange(false);
    } catch {
      // toast surfaced in mutation onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{m.dictionary_add_word()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="word-input">{m.dictionary_word_label()}</Label>
            <Input
              id="word-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={m.dictionary_word_placeholder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={adding}
            >
              {m.dictionary_action_cancel()}
            </Button>
            <Button type="submit" disabled={!value.trim() || adding}>
              {adding ? <Loader2 className="size-4 animate-spin" /> : null}
              {m.dictionary_action_add()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
