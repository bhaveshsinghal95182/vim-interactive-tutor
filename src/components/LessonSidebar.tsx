import { lessons, getAllLevels, getLessonsByLevel } from '@/data/lessons';
import { ChevronLeft, ChevronRight, Check, Circle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface LessonSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentLessonId: string;
  onSelectLesson: (lessonId: string) => void;
  isLessonCompleted: (lessonId: string) => boolean;
}

export function LessonSidebar({
  isOpen,
  onToggle,
  currentLessonId,
  onSelectLesson,
  isLessonCompleted,
}: LessonSidebarProps) {
  const levels = getAllLevels();

  const levelTitles: Record<number, string> = {
    1: 'The Basics',
    2: 'Deletion Commands',
    3: 'Put & Replace',
    4: 'Search & Navigate',
    5: 'External Commands',
    6: 'Advanced Options',
  };

  const isLessonUnlocked = (lessonId: string) => {
    const lessonIndex = lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex === 0) return true;
    const prevLesson = lessons[lessonIndex - 1];
    return prevLesson ? isLessonCompleted(prevLesson.id) : true;
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          "fixed top-4 z-50 transition-all duration-300",
          isOpen ? "left-64" : "left-4"
        )}
      >
        {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-40",
          "transition-all duration-300 ease-in-out",
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-primary">VimInteractive</h1>
            <p className="text-sm text-muted-foreground mt-1">Learn Vim, interactively</p>
          </div>

          {/* Lessons List */}
          <nav className="flex-1 overflow-y-auto py-4">
            {levels.map(level => (
              <div key={level} className="mb-4">
                <h2 className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Level {level}: {levelTitles[level]}
                </h2>
                <ul className="space-y-1 px-3">
                  {getLessonsByLevel(level).map(lesson => {
                    const isActive = lesson.id === currentLessonId;
                    const isCompleted = isLessonCompleted(lesson.id);
                    const isUnlocked = isLessonUnlocked(lesson.id);

                    return (
                      <li key={lesson.id}>
                        <button
                          onClick={() => isUnlocked && onSelectLesson(lesson.id)}
                          disabled={!isUnlocked}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200",
                            isActive && "bg-sidebar-accent border-l-2 border-sidebar-primary",
                            !isActive && isUnlocked && "hover:bg-sidebar-accent/50",
                            !isUnlocked && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span className="flex-shrink-0">
                            {isCompleted ? (
                              <Check className="h-4 w-4 text-gruvbox-green" />
                            ) : isUnlocked ? (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </span>
                          <span className="flex flex-col min-w-0">
                            <span className={cn(
                              "text-sm font-medium truncate",
                              isActive && "text-sidebar-primary"
                            )}>
                              {lesson.id} {lesson.subtitle}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="key-cap text-xs">?</span>
              <span>Help</span>
              <span className="mx-2">•</span>
              <span className="key-cap text-xs">:q</span>
              <span>Quit</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
