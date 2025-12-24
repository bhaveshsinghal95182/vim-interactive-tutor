import { cn } from '@/lib/utils';

interface KeyboardHintProps {
  className?: string;
}

export function KeyboardHint({ className }: KeyboardHintProps) {
  return (
    <div className={cn(
      "fixed bottom-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg",
      "text-sm max-w-xs",
      className
    )}>
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        <span className="text-gruvbox-yellow">💡</span>
        <span className="font-medium">Quick Reference</span>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Move cursor</span>
          <div className="flex gap-1">
            <span className="key-cap text-xs">h</span>
            <span className="key-cap text-xs">j</span>
            <span className="key-cap text-xs">k</span>
            <span className="key-cap text-xs">l</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Insert mode</span>
          <span className="key-cap text-xs">i</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Normal mode</span>
          <span className="key-cap text-xs">ESC</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Delete char</span>
          <span className="key-cap text-xs">x</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Next lesson</span>
          <span className="key-cap text-xs">:next</span>
        </div>
      </div>
    </div>
  );
}
