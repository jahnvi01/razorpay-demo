import { InfoIcon } from "./icons";
import { Card } from "./ui";

export function Placeholder({ body }: { body: string }) {
  return (
    <Card className="flex items-start gap-3 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-line bg-page text-ink-muted">
        <InfoIcon size={18} />
      </span>
      <p className="pt-2 text-sm text-ink-subtle">{body}</p>
    </Card>
  );
}
