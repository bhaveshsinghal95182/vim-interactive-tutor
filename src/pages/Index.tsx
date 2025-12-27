import { useState, useCallback, useEffect } from 'react';
import { VimEditor } from '@/components/VimEditor';
import { LessonSidebar } from '@/components/LessonSidebar';
import { InstructionsPanel } from '@/components/InstructionsPanel';
import { LessonComplete } from '@/components/LessonComplete';
import { KeyboardHint } from '@/components/KeyboardHint';
import { Navbar } from '@/components/Navbar';
import { useProgress } from '@/hooks/useProgress';
import { getLessonById, getNextLesson } from '@/data/lessons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Index = () => {
  const {
    appState,
    setCurrentLesson,
    markLessonComplete,
    isLessonCompleted,
    toggleSidebar,
    resetKey,
  } = useProgress();

  const [showComplete, setShowComplete] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  // Reset editor when progress is reset
  useEffect(() => {
    if (resetKey > 0) {
      setEditorKey(k => k + 1);
      setShowComplete(false);
    }
  }, [resetKey]);

  const currentLesson = getLessonById(appState.currentLessonId);
  const nextLesson = currentLesson ? getNextLesson(currentLesson.id) : undefined;
  const lessonCompleted = currentLesson ? isLessonCompleted(currentLesson.id) : false;

  // Handle keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showComplete && (e.key === 'Enter' || e.key === 'n')) {
        if (nextLesson) {
          handleNextLesson();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showComplete, nextLesson]);

  const handleSuccess = useCallback(() => {
    if (!currentLesson || lessonCompleted) return;
    
    markLessonComplete(currentLesson.id);
    setShowComplete(true);
    toast.success('Lesson completed!', {
      description: `You've mastered ${currentLesson.subtitle}`,
    });
  }, [currentLesson, lessonCompleted, markLessonComplete]);

  const handleCommand = useCallback((command: string) => {
    // Special handling for lesson 1.2 - typing :next completes the lesson
    if (currentLesson?.id === '1.2' && (command === 'next' || command === 'n')) {
      if (!lessonCompleted) {
        markLessonComplete('1.2');
        setShowComplete(true);
        toast.success('Lesson completed!', {
          description: `You've mastered ${currentLesson.subtitle}`,
        });
      }
      return;
    }
    
    if (command === 'next' || command === 'n') {
      if (nextLesson) {
        handleNextLesson();
      } else {
        toast.info('You are on the last lesson!');
      }
    } else if (command === 'prev' || command === 'p') {
      const lessons = require('@/data/lessons').lessons;
      const currentIndex = lessons.findIndex((l: any) => l.id === appState.currentLessonId);
      if (currentIndex > 0) {
        setCurrentLesson(lessons[currentIndex - 1].id);
        setEditorKey(k => k + 1);
        setShowComplete(false);
      }
    } else if (command === 'reset' || command === 'r') {
      setEditorKey(k => k + 1);
      toast.info('Lesson reset!');
    } else if (command === 'q' || command === 'quit') {
      toast.info("This is a web app! You can't quit Vim 😄");
    } else if (command.startsWith('w')) {
      toast.success('Changes saved! (simulated)');
    }
  }, [currentLesson, lessonCompleted, markLessonComplete, nextLesson, appState.currentLessonId, setCurrentLesson]);

  const handleNextLesson = useCallback(() => {
    if (nextLesson) {
      setCurrentLesson(nextLesson.id);
      setEditorKey(k => k + 1);
      setShowComplete(false);
    }
  }, [nextLesson, setCurrentLesson]);

  const handleRestart = useCallback(() => {
    setEditorKey(k => k + 1);
    setShowComplete(false);
  }, []);

  const handleSelectLesson = useCallback((lessonId: string) => {
    setCurrentLesson(lessonId);
    setEditorKey(k => k + 1);
    setShowComplete(false);
  }, [setCurrentLesson]);

  if (!currentLesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar
        onMenuClick={toggleSidebar}
        sidebarOpen={appState.sidebarOpen}
      />

      {/* Sidebar */}
      <LessonSidebar
        isOpen={appState.sidebarOpen}
        onToggle={toggleSidebar}
        currentLessonId={appState.currentLessonId}
        onSelectLesson={handleSelectLesson}
        isLessonCompleted={isLessonCompleted}
      />

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen pt-14 transition-all duration-300 ease-in-out",
          appState.sidebarOpen ? "pl-64" : "pl-0"
        )}
      >
        <div className="container max-w-6xl mx-auto p-6 lg:p-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Instructions Panel */}
            <div className="order-2 lg:order-1">
              <InstructionsPanel
                lesson={currentLesson}
                isCompleted={lessonCompleted}
              />
            </div>

            {/* Editor Panel */}
            <div className="order-1 lg:order-2">
              <VimEditor
                key={editorKey}
                lessonId={currentLesson.id}
                initialBuffer={currentLesson.initialBuffer}
                targetBuffer={currentLesson.targetBuffer}
                onSuccess={handleSuccess}
                onCommand={handleCommand}
                className="h-[400px] lg:h-[500px]"
              />
              
              {/* Navigation hint */}
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Click on the editor to focus • Type <span className="font-mono text-gruvbox-aqua">:next</span> to continue • <span className="font-mono text-gruvbox-aqua">:reset</span> to restart
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Keyboard Reference */}
      <KeyboardHint />

      {/* Lesson Complete Modal */}
      {showComplete && (
        <LessonComplete
          lessonId={currentLesson.id}
          lessonTitle={currentLesson.subtitle}
          onNextLesson={handleNextLesson}
          onRestart={handleRestart}
          hasNextLesson={!!nextLesson}
        />
      )}
    </div>
  );
};

export default Index;
