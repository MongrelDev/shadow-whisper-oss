import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { m } from "~/paraglide/messages";
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
import { Textarea } from "@/components/ui/textarea";
import type { useSnippetMutations } from "@/hooks/use-snippets";

interface FormValues {
  trigger: string;
  expanded: string;
}

interface AddSnippetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mutations: ReturnType<typeof useSnippetMutations>;
}

export function AddSnippetModal({
  open,
  onOpenChange,
  mutations,
}: AddSnippetModalProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<FormValues>({ mode: "onChange" });

  const adding = mutations.addSnippet.isPending;

  const onSubmit = async (values: FormValues): Promise<void> => {
    await mutations.addSnippet.mutateAsync({
      trigger: values.trigger.trim(),
      expanded: values.expanded.trim(),
    });
    reset();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{m.dictionary_snippet_modal_title()}</DialogTitle>
          <DialogDescription>{m.dictionary_snippet_modal_description()}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {m.dictionary_snippet_modal_trigger_label()}
            </label>
            <Input
              {...register("trigger", { required: true })}
              placeholder={m.dictionary_snippet_modal_placeholder_trigger()}
              className="h-12 text-base font-mono"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {m.dictionary_snippet_modal_expanded_label()}
            </label>
            <Textarea
              {...register("expanded", { required: true })}
              placeholder={m.dictionary_snippet_modal_placeholder_expanded()}
              className="text-base min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={adding}
            >
              {m.dictionary_button_cancel()}
            </Button>
            <Button type="submit" disabled={!isValid || adding}>
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {m.dictionary_button_adding()}
                </>
              ) : (
                m.dictionary_button_confirm_add()
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
