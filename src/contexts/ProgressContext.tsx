import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { LessonProgress, AppState } from '@/types/vim';

const STORAGE_KEY = 'vim-interactive-progress';

const defaultState: AppState = {
  currentLessonId: '1.1',
  progress: {},
  sidebarOpen: true,
};

interface ProgressContextValue {
  appState: AppState;
  setCurrentLesson: (lessonId: string) => void;
  markLessonComplete: (lessonId: string) => void;
  getLessonProgress: (lessonId: string) => LessonProgress | undefined;
  isLessonCompleted: (lessonId: string) => boolean;
  toggleSidebar: () => void;
  resetProgress: () => void;
  resetKey: number;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppState>(() => {
    if (typeof window === 'undefined') return defaultState;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultState, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
    return defaultState;
  });

  // This key is used to force re-render of components when progress is reset
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [appState]);

  const setCurrentLesson = useCallback((lessonId: string) => {
    setAppState(prev => ({ ...prev, currentLessonId: lessonId }));
  }, []);

  const markLessonComplete = useCallback((lessonId: string) => {
    setAppState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        [lessonId]: {
          lessonId,
          completed: true,
          attempts: (prev.progress[lessonId]?.attempts || 0) + 1,
        },
      },
    }));
  }, []);

  const getLessonProgress = useCallback((lessonId: string): LessonProgress | undefined => {
    return appState.progress[lessonId];
  }, [appState.progress]);

  const isLessonCompleted = useCallback((lessonId: string): boolean => {
    return appState.progress[lessonId]?.completed || false;
  }, [appState.progress]);

  const toggleSidebar = useCallback(() => {
    setAppState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  }, []);

  const resetProgress = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to clear progress storage:', e);
    }
    setAppState(defaultState);
    // Increment resetKey to force re-render of all components using progress
    setResetKey(prev => prev + 1);
  }, []);

  const value: ProgressContextValue = {
    appState,
    setCurrentLesson,
    markLessonComplete,
    getLessonProgress,
    isLessonCompleted,
    toggleSidebar,
    resetProgress,
    resetKey,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
