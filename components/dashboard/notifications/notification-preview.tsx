import { Bell } from 'lucide-react';

interface NotificationPreviewProps {
  title: string;
  body: string;
  previewLabel: string;
  titlePlaceholder: string;
  bodyPlaceholder: string;
}

// Extracted from NotificationForm to keep the component's own control-flow
// complexity down; behavior is unchanged.
export function NotificationPreview({ title, body, previewLabel, titlePlaceholder, bodyPlaceholder }: NotificationPreviewProps) {
  return (
    <div className="bg-muted/50 border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Bell className="size-5 text-primary mt-0.5" />
        <div className="flex-1 text-sm min-w-0">
          <p className="font-semibold text-foreground mb-1">{previewLabel}</p>
          <div className="bg-background rounded-lg p-3 shadow-sm border min-w-0">
            <p className="font-semibold text-sm mb-1 whitespace-pre-wrap break-words">
              {title || titlePlaceholder}
            </p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
              {body || bodyPlaceholder}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
