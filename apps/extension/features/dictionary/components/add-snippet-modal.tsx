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
import { Textarea } from "~/components/ui/textarea";
import { m } from "~/paraglide/messages";
import type { DictionaryMutations } from "../hooks/use-dictionary-mutations";

interface AddSnippetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mutations: DictionaryMutations;
}

export function AddSnippetModal({
  open,
  onOpenChange,
  mutations,
}: AddSnippetModalProps): React.ReactElement {
  const [trigger, setTrigger] = useState("");
  const [expanded, setExpanded] = useState("");
  const adding = mutations.addSnippet.isPending;

  const reset = () => {
    setTrigger("");
    setExpanded("");
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const canSubmit = trigger.trim().length > 0 && expanded.trim().length > 0 && !adding;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    try {
      await mutations.addSnippet.mutateAsync({
        trigger: trigger.trim(),
        expanded: expanded.trim(),
      });
      reset();
      onOpenChange(false);
    } catch {
      // toast surfaced in mutation onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{m.dictionary_add_snippet()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="snippet-trigger">{m.dictionary_snippet_trigger_label()}</Label>
            <Input
              id="snippet-trigger"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder={m.dictionary_snippet_trigger_placeholder()}
              className="font-mono"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="snippet-expanded">{m.dictionary_snippet_expanded_label()}</Label>
            <Textarea
              id="snippet-expanded"
              value={expanded}
              onChange={(e) => setExpanded(e.target.value)}
              placeholder={m.dictionary_snippet_expanded_placeholder()}
              rows={4}
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
            <Button type="submit" disabled={!canSubmit}>
              {adding ? <Loader2 className="size-4 animate-spin" /> : null}
              {m.dictionary_action_add()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
