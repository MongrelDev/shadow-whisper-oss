import { useState } from "react";
import { m } from "~/paraglide/messages";
import { AsyncButton } from "@/components/ui/async-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { useDictionaryMutations } from "@/hooks/use-dictionary";

interface AddWordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mutations: ReturnType<typeof useDictionaryMutations>;
}

export function AddWordModal({
  open,
  onOpenChange,
  mutations,
}: AddWordModalProps): React.ReactElement {
  const [value, setValue] = useState("");
  const adding = mutations.addWord.isPending;

  const handleSubmit = async (): Promise<void> => {
    const trimmed = value.trim();
    if (!trimmed) return;
    await mutations.addWord.mutateAsync(trimmed);
    setValue("");
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && value.trim()) handleSubmit();
  };

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen) setValue("");
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{m.dictionary_word_modal_title()}</DialogTitle>
          <DialogDescription>{m.dictionary_word_modal_description()}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={m.dictionary_word_modal_placeholder()}
            className="h-12 text-base"
            autoFocus
          />
          <p className="text-sm text-muted-foreground/60 mt-2.5 px-1">
            {m.dictionary_word_modal_hint()}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={adding}>
            {m.dictionary_button_cancel()}
          </Button>
          <AsyncButton
            onClick={handleSubmit}
            isPending={adding}
            pendingLabel={m.dictionary_button_adding()}
            disabled={!value.trim()}
          >
            {m.dictionary_button_confirm_add()}
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
