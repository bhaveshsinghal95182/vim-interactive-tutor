export type VimMode = 'normal' | 'insert' | 'visual' | 'visual-line' | 'command' | 'replace';

export interface CursorPosition {
  line: number;
  col: number;
}

export interface EditorState {
  mode: VimMode;
  buffer: string[];
  cursor: CursorPosition;
  commandBuffer: string;
  lastCommand: string;
  message: string;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  level: number;
  lessonNumber: number;
  instructions: string[];
  task: string;
  initialBuffer: string[];
  targetBuffer: string[];
  hints: string[];
  keysToLearn: string[];
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  attempts: number;
  bestTime?: number;
}

export interface AppState {
  currentLessonId: string;
  progress: Record<string, LessonProgress>;
  sidebarOpen: boolean;
}
