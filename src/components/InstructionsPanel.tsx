import { Lesson } from '@/types/vim';
import { cn } from '@/lib/utils';
import { Lightbulb, Target, Keyboard } from 'lucide-react';

interface InstructionsPanelProps {
  lesson: Lesson;
  isCompleted: boolean;
  className?: string;
}

export function InstructionsPanel({ lesson, isCompleted, className }: InstructionsPanelProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Lesson Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <span className="font-mono">Lesson {lesson.id}</span>
          <span>•</span>
          <span>Level {lesson.level}</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">{lesson.subtitle}</h2>
        <p className="text-muted-foreground mt-1">{lesson.title}</p>
      </div>

      {/* Instructions */}
      <div className="space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="font-mono text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {lesson.instructions.map((line, i) => (
            <div key={i} className="min-h-[1.25rem]">
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Task Box */}
      <div 
        className={cn(
          "instruction-highlight animate-fade-in",
          isCompleted && "border-gruvbox-green/60 bg-gruvbox-green/10"
        )}
        style={{ animationDelay: '200ms' }}
      >
        <div className="flex items-start gap-3">
          <Target className={cn(
            "h-5 w-5 mt-0.5 flex-shrink-0",
            isCompleted ? "text-gruvbox-green" : "text-primary"
          )} />
          <div>
            <h3 className={cn(
              "font-semibold mb-1",
              isCompleted ? "text-gruvbox-green" : "text-primary"
            )}>
              {isCompleted ? "✓ Task Completed!" : "Your Task"}
            </h3>
            <p className="text-sm text-foreground/80">{lesson.task}</p>
          </div>
        </div>
      </div>

      {/* Target Buffer */}
      <div className="animate-fade-in" style={{ animationDelay: '250ms' }}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Target className="h-4 w-4" />
          <span>Target (what it should look like)</span>
        </div>
        <div className="bg-gruvbox-bg border border-border rounded-lg p-3 font-mono text-sm overflow-x-auto">
          {lesson.targetBuffer.map((line, i) => (
            <div key={i} className="text-gruvbox-fg min-h-[1.25rem] whitespace-pre">
              {line || ' '}
            </div>
          ))}
        </div>
      </div>

      {/* Keys to Learn */}
      <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Keyboard className="h-4 w-4" />
          <span>Keys in this lesson</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {lesson.keysToLearn.map(key => (
            <span key={key} className="key-cap">
              {key}
            </span>
          ))}
        </div>
      </div>

      {/* Hints */}
      {lesson.hints.length > 0 && (
        <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Lightbulb className="h-4 w-4" />
            <span>Hints</span>
          </div>
          <ul className="space-y-2">
            {lesson.hints.map((hint, i) => (
              <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                <span className="text-gruvbox-aqua">→</span>
                {hint}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
