import { useState, useEffect, useCallback } from 'react';
import { LessonProgress, AppState } from '@/types/vim';

const STORAGE_KEY = 'vim-interactive-progress';

const defaultState: AppState = {
  currentLessonId: '1.1',
  progress: {},
  sidebarOpen: true,
};

export function useProgress() {
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
  }, []);

  return {
    appState,
    setCurrentLesson,
    markLessonComplete,
    getLessonProgress,
    isLessonCompleted,
    toggleSidebar,
    resetProgress,
  };
}
