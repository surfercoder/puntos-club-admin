"use client";

import * as React from "react";
import { MessageSquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { sendFeedback } from "@/actions/feedback/send-feedback";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const FEEDBACK_TYPES = [
  "comment",
  "feedback",
  "error",
  "improvement",
  "question",
] as const;

type FeedbackType = (typeof FEEDBACK_TYPES)[number];

interface FeedbackDialogProps {
  userEmail: string;
  userName: string;
}

export function FeedbackDialog({ userEmail, userName }: FeedbackDialogProps) {
  const t = useTranslations("Feedback");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<FeedbackType>("feedback");
  const [message, setMessage] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsPending(true);
    try {
      const result = await sendFeedback({
        type,
        message,
        userEmail,
        userName,
      });

      if (result.success) {
        toast.success(t("successMessage"));
        setOpen(false);
        setMessage("");
        setType("feedback");
      } else {
        toast.error(result.error || t("errorMessage"));
      }
    } catch {
      toast.error(t("errorMessage"));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
        >
          <MessageSquarePlus className="size-4" />
          <span className="hidden text-xs font-medium sm:inline">
            {t("trigger")}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="feedback-type"
                className="text-sm font-medium"
              >
                {t("typeLabel")}
              </label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as FeedbackType)}
              >
                <SelectTrigger id="feedback-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_TYPES.map((ft) => (
                    <SelectItem key={ft} value={ft}>
                      {t(`types.${ft}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="feedback-message"
                className="text-sm font-medium"
              >
                {t("messageLabel")}
              </label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("messagePlaceholder")}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !message.trim()}>
              {isPending ? tCommon("sending") : tCommon("send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
