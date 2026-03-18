'use client';

import { useRef } from 'react';
import { Smile } from 'lucide-react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const TITLE_MAX_LENGTH = 65;
const BODY_MAX_LENGTH = 240;

interface NotificationFormFieldsProps {
  title: string;
  body: string;
  titleCharsLeft: number;
  bodyCharsLeft: number;
  showTitleEmojiPicker: boolean;
  showEmojiPicker: boolean;
  isDisabled: boolean;
  onContentChange: (field: 'title' | 'body', value: string) => void;
  onToggleTitleEmojiPicker: () => void;
  onCloseTitleEmojiPicker: () => void;
  onToggleEmojiPicker: () => void;
  onCloseEmojiPicker: () => void;
  onTitleEmojiInsert: (value: string) => void;
  onBodyEmojiInsert: (value: string) => void;
}

export default function NotificationFormFields({
  title,
  body,
  titleCharsLeft,
  bodyCharsLeft,
  showTitleEmojiPicker,
  showEmojiPicker,
  isDisabled,
  onContentChange,
  onToggleTitleEmojiPicker,
  onCloseTitleEmojiPicker,
  onToggleEmojiPicker,
  onCloseEmojiPicker,
  onTitleEmojiInsert,
  onBodyEmojiInsert,
}: NotificationFormFieldsProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const t = useTranslations('Dashboard.notifications.form');

  /* c8 ignore start */
  const handleTitleEmojiClick = (emojiData: EmojiClickData) => {
    const input = titleInputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? title.length;
    const end = input.selectionEnd ?? title.length;
    const newTitle = title.substring(0, start) + emojiData.emoji + title.substring(end);

    const nextTitle = newTitle.slice(0, TITLE_MAX_LENGTH);
    onTitleEmojiInsert(nextTitle);

    setTimeout(() => {
      input.focus();
      const newCursorPos = Math.min(start + emojiData.emoji.length, nextTitle.length);
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody = body.substring(0, start) + emojiData.emoji + body.substring(end);

    const nextBody = newBody.slice(0, BODY_MAX_LENGTH);
    onBodyEmojiInsert(nextBody);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = Math.min(start + emojiData.emoji.length, nextBody.length);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  /* c8 ignore stop */

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="title">{t('titleLabel')}</Label>
          <span id="title-char-count" className={`text-sm ${/* c8 ignore next */ titleCharsLeft < 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
            {titleCharsLeft} {t('charsRemaining')}
          </span>
        </div>
        <div className="relative">
          <Input
            ref={titleInputRef}
            id="title"
            type="text"
            value={title}
            onChange={(e) => onContentChange('title', e.target.value)}
            placeholder={t('titlePlaceholder')}
            disabled={isDisabled}
            aria-invalid={title.length > TITLE_MAX_LENGTH}
            aria-describedby="title-char-count"
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleTitleEmojiPicker}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            disabled={isDisabled}
            title={t('addEmoji')}
          >
            <Smile className="h-5 w-5" />
          </Button>
          {showTitleEmojiPicker && (
            <div className="absolute right-0 top-full mt-2 z-50">
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onCloseTitleEmojiPicker}
                  className="absolute -top-2 -right-2 bg-background rounded-full shadow-md z-10"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
                <EmojiPicker
                  onEmojiClick={handleTitleEmojiClick}
                  width={350}
                  height={400}
                />
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {t('titleTip')}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="body">{t('messageLabel')}</Label>
          <span id="body-char-count" className={`text-sm ${/* c8 ignore next */ bodyCharsLeft < 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
            {bodyCharsLeft} {t('charsRemaining')}
          </span>
        </div>
        <div className="relative">
          <Textarea
            ref={bodyTextareaRef}
            id="body"
            value={body}
            onChange={(e) => onContentChange('body', e.target.value)}
            placeholder={t('bodyPlaceholder')}
            rows={4}
            className="resize-none pr-12"
            disabled={isDisabled}
            aria-invalid={body.length > BODY_MAX_LENGTH}
            aria-describedby="body-char-count"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleEmojiPicker}
            className="absolute right-2 top-2"
            disabled={isDisabled}
            title={t('addEmoji')}
          >
            <Smile className="h-5 w-5" />
          </Button>
          {showEmojiPicker && (
            <div className="absolute right-0 top-full mt-2 z-50">
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onCloseEmojiPicker}
                  className="absolute -top-2 -right-2 bg-background rounded-full shadow-md z-10"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={350}
                  height={400}
                />
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {t('aiTip')}
        </p>
      </div>
    </>
  );
}
