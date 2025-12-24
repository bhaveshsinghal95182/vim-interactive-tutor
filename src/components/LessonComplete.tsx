import { Button } from '@/components/ui/button';
import { Check, ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonCompleteProps {
  lessonId: string;
  lessonTitle: string;
  onNextLesson: () => void;
  onRestart: () => void;
  hasNextLesson: boolean;
  className?: string;
}

export function LessonComplete({
  lessonId,
  lessonTitle,
  onNextLesson,
  onRestart,
  hasNextLesson,
  className,
}: LessonCompleteProps) {
  return (
    <div className={cn(
      "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4",
      "animate-fade-in",
      className
    )}>
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full shadow-2xl animate-fade-in">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gruvbox-green/20 flex items-center justify-center">
            <Check className="h-8 w-8 text-gruvbox-green" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Lesson Complete!
          </h2>
          <p className="text-muted-foreground">
            You've mastered <span className="text-gruvbox-yellow font-mono">{lessonId}</span> - {lessonTitle}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {hasNextLesson && (
            <Button 
              onClick={onNextLesson}
              className="w-full bg-gruvbox-green hover:bg-gruvbox-green/90 text-primary-foreground"
            >
              <span>Continue to Next Lesson</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={onRestart}
            className="w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            <span>Practice Again</span>
          </Button>
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Press <span className="key-cap text-xs">:next</span> or <span className="key-cap text-xs">Enter</span> to continue
        </p>
      </div>
    </div>
  );
}
