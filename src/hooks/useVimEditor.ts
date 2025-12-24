import { useState, useCallback, useEffect, useRef } from 'react';
import { VimMode, CursorPosition, EditorState } from '@/types/vim';

interface UseVimEditorProps {
  initialBuffer: string[];
  onBufferChange?: (buffer: string[]) => void;
}

interface UndoEntry {
  buffer: string[];
  cursor: CursorPosition;
}

interface ExtendedState extends EditorState {
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];
  register: string[];
  registerIsLine: boolean;
  searchPattern: string;
  searchDirection: 'forward' | 'backward';
  visualStart: CursorPosition | null;
}

export function useVimEditor({ initialBuffer, onBufferChange }: UseVimEditorProps) {
  const [state, setState] = useState<ExtendedState>({
    mode: 'normal',
    buffer: [...initialBuffer],
    cursor: { line: 0, col: 0 },
    commandBuffer: '',
    lastCommand: '',
    message: '',
    undoStack: [],
    redoStack: [],
    register: [],
    registerIsLine: false,
    searchPattern: '',
    searchDirection: 'forward',
    visualStart: null,
  });

  const [pendingOperator, setPendingOperator] = useState<string | null>(null);
  const [countBuffer, setCountBuffer] = useState<string>('');
  
  const onBufferChangeRef = useRef(onBufferChange);
  onBufferChangeRef.current = onBufferChange;

  // Reset buffer when initialBuffer changes
  useEffect(() => {
    setState({
      mode: 'normal',
      buffer: [...initialBuffer],
      cursor: { line: 0, col: 0 },
      commandBuffer: '',
      lastCommand: '',
      message: '',
      undoStack: [],
      redoStack: [],
      register: [],
      registerIsLine: false,
      searchPattern: '',
      searchDirection: 'forward',
      visualStart: null,
    });
    setPendingOperator(null);
    setCountBuffer('');
  }, [initialBuffer]);

  const clampCursor = useCallback((cursor: CursorPosition, buffer: string[]): CursorPosition => {
    const line = Math.max(0, Math.min(cursor.line, buffer.length - 1));
    const maxCol = Math.max(0, (buffer[line]?.length || 1) - 1);
    const col = Math.max(0, Math.min(cursor.col, maxCol));
    return { line, col };
  }, []);

  const moveCursor = useCallback((deltaLine: number, deltaCol: number, count: number = 1) => {
    setState(prev => {
      const newCursor = clampCursor({
        line: prev.cursor.line + (deltaLine * count),
        col: prev.cursor.col + (deltaCol * count),
      }, prev.buffer);
      return { ...prev, cursor: newCursor };
    });
  }, [clampCursor]);

  const moveToLineStart = useCallback(() => {
    setState(prev => ({ ...prev, cursor: { ...prev.cursor, col: 0 } }));
  }, []);

  const moveToLineEnd = useCallback(() => {
    setState(prev => {
      const lineLen = prev.buffer[prev.cursor.line]?.length || 0;
      return { ...prev, cursor: { ...prev.cursor, col: Math.max(0, lineLen - 1) } };
    });
  }, []);

  const moveToFirstLine = useCallback(() => {
    setState(prev => ({ ...prev, cursor: { line: 0, col: 0 } }));
  }, []);

  const moveToLastLine = useCallback(() => {
    setState(prev => ({ ...prev, cursor: { line: prev.buffer.length - 1, col: 0 } }));
  }, []);

  const moveToLine = useCallback((lineNum: number) => {
    setState(prev => {
      const line = Math.max(0, Math.min(lineNum - 1, prev.buffer.length - 1));
      return { ...prev, cursor: { line, col: 0 } };
    });
  }, []);

  const moveWordForward = useCallback((count: number = 1) => {
    setState(prev => {
      let { line, col } = prev.cursor;
      const buffer = prev.buffer;
      
      for (let i = 0; i < count; i++) {
        const currentLine = buffer[line] || '';
        while (col < currentLine.length && !/\s/.test(currentLine[col])) col++;
        while (col < currentLine.length && /\s/.test(currentLine[col])) col++;
        if (col >= currentLine.length && line < buffer.length - 1) {
          line++;
          col = 0;
          const newLine = buffer[line] || '';
          while (col < newLine.length && /\s/.test(newLine[col])) col++;
        }
      }
      
      return { ...prev, cursor: clampCursor({ line, col }, buffer) };
    });
  }, [clampCursor]);

  const moveWordBackward = useCallback((count: number = 1) => {
    setState(prev => {
      let { line, col } = prev.cursor;
      const buffer = prev.buffer;
      
      for (let i = 0; i < count; i++) {
        if (col === 0 && line > 0) {
          line--;
          col = (buffer[line]?.length || 1) - 1;
        } else {
          col = Math.max(0, col - 1);
        }
        const currentLine = buffer[line] || '';
        while (col > 0 && /\s/.test(currentLine[col])) col--;
        while (col > 0 && !/\s/.test(currentLine[col - 1])) col--;
      }
      
      return { ...prev, cursor: clampCursor({ line, col }, buffer) };
    });
  }, [clampCursor]);

  const deleteChar = useCallback(() => {
    setState(prev => {
      const { line, col } = prev.cursor;
      const buffer = [...prev.buffer];
      const currentLine = buffer[line];
      
      if (currentLine && col < currentLine.length) {
        const deletedChar = currentLine[col];
        buffer[line] = currentLine.slice(0, col) + currentLine.slice(col + 1);
        const newCursor = clampCursor({ line, col }, buffer);
        onBufferChangeRef.current?.(buffer);
        return { 
          ...prev, 
          buffer, 
          cursor: newCursor,
          register: [deletedChar],
          registerIsLine: false,
          undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
          redoStack: [],
        };
      }
      return prev;
    });
  }, [clampCursor]);

  const deleteWord = useCallback((count: number = 1) => {
    setState(prev => {
      let { line, col } = prev.cursor;
      const buffer = [...prev.buffer];
      let deletedText = '';
      
      for (let i = 0; i < count; i++) {
        const currentLine = buffer[line] || '';
        let endCol = col;
        while (endCol < currentLine.length && !/\s/.test(currentLine[endCol])) endCol++;
        while (endCol < currentLine.length && /\s/.test(currentLine[endCol])) endCol++;
        deletedText += currentLine.slice(col, endCol);
        buffer[line] = currentLine.slice(0, col) + currentLine.slice(endCol);
      }
      
      onBufferChangeRef.current?.(buffer);
      return { 
        ...prev, 
        buffer, 
        cursor: clampCursor({ line, col }, buffer),
        register: [deletedText],
        registerIsLine: false,
        undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
        redoStack: [],
      };
    });
  }, [clampCursor]);

  const deleteLine = useCallback((count: number = 1) => {
    setState(prev => {
      const buffer = [...prev.buffer];
      const { line } = prev.cursor;
      
      const linesToDelete = Math.min(count, buffer.length - line);
      const deletedLines = buffer.splice(line, linesToDelete);
      
      if (buffer.length === 0) buffer.push('');
      
      const newLine = Math.min(line, buffer.length - 1);
      onBufferChangeRef.current?.(buffer);
      return { 
        ...prev, 
        buffer, 
        cursor: clampCursor({ line: newLine, col: 0 }, buffer),
        register: deletedLines,
        registerIsLine: true,
        undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
        redoStack: [],
      };
    });
  }, [clampCursor]);

  const deleteToLineEnd = useCallback(() => {
    setState(prev => {
      const { line, col } = prev.cursor;
      const buffer = [...prev.buffer];
      const deletedText = buffer[line].slice(col);
      buffer[line] = buffer[line].slice(0, col);
      onBufferChangeRef.current?.(buffer);
      return { 
        ...prev, 
        buffer, 
        cursor: clampCursor({ line, col: Math.max(0, col - 1) }, buffer),
        register: [deletedText],
        registerIsLine: false,
        undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
        redoStack: [],
      };
    });
  }, [clampCursor]);

  const yankLine = useCallback((count: number = 1) => {
    setState(prev => {
      const { line } = prev.cursor;
      const linesToYank = Math.min(count, prev.buffer.length - line);
      const yankedLines = prev.buffer.slice(line, line + linesToYank);
      return { 
        ...prev, 
        register: yankedLines,
        registerIsLine: true,
        message: `${linesToYank} line(s) yanked`,
      };
    });
  }, []);

  const yankWord = useCallback((count: number = 1) => {
    setState(prev => {
      const { line, col } = prev.cursor;
      const currentLine = prev.buffer[line] || '';
      let endCol = col;
      
      for (let i = 0; i < count; i++) {
        while (endCol < currentLine.length && !/\s/.test(currentLine[endCol])) endCol++;
        while (endCol < currentLine.length && /\s/.test(currentLine[endCol])) endCol++;
      }
      
      const yankedText = currentLine.slice(col, endCol);
      return { 
        ...prev, 
        register: [yankedText],
        registerIsLine: false,
        message: 'Yanked',
      };
    });
  }, []);

  const putAfter = useCallback(() => {
    setState(prev => {
      if (prev.register.length === 0) return prev;
      
      const buffer = [...prev.buffer];
      const { line, col } = prev.cursor;
      
      if (prev.registerIsLine) {
        buffer.splice(line + 1, 0, ...prev.register);
        onBufferChangeRef.current?.(buffer);
        return { 
          ...prev, 
          buffer, 
          cursor: { line: line + 1, col: 0 },
          undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
          redoStack: [],
        };
      } else {
        const currentLine = buffer[line];
        buffer[line] = currentLine.slice(0, col + 1) + prev.register[0] + currentLine.slice(col + 1);
        onBufferChangeRef.current?.(buffer);
        return { 
          ...prev, 
          buffer, 
          cursor: { line, col: col + prev.register[0].length },
          undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
          redoStack: [],
        };
      }
    });
  }, []);

  const putBefore = useCallback(() => {
    setState(prev => {
      if (prev.register.length === 0) return prev;
      
      const buffer = [...prev.buffer];
      const { line, col } = prev.cursor;
      
      if (prev.registerIsLine) {
        buffer.splice(line, 0, ...prev.register);
        onBufferChangeRef.current?.(buffer);
        return { 
          ...prev, 
          buffer, 
          cursor: { line, col: 0 },
          undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
          redoStack: [],
        };
      } else {
        const currentLine = buffer[line];
        buffer[line] = currentLine.slice(0, col) + prev.register[0] + currentLine.slice(col);
        onBufferChangeRef.current?.(buffer);
        return { 
          ...prev, 
          buffer, 
          cursor: { line, col: col + prev.register[0].length - 1 },
          undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
          redoStack: [],
        };
      }
    });
  }, []);

  const replaceChar = useCallback((char: string) => {
    setState(prev => {
      const { line, col } = prev.cursor;
      const buffer = [...prev.buffer];
      const currentLine = buffer[line];
      
      if (currentLine && col < currentLine.length) {
        buffer[line] = currentLine.slice(0, col) + char + currentLine.slice(col + 1);
        onBufferChangeRef.current?.(buffer);
        return { 
          ...prev, 
          buffer,
          undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
          redoStack: [],
        };
      }
      return prev;
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.undoStack.length === 0) {
        return { ...prev, message: 'Already at oldest change' };
      }
      
      const lastUndo = prev.undoStack[prev.undoStack.length - 1];
      onBufferChangeRef.current?.(lastUndo.buffer);
      return { 
        ...prev, 
        buffer: lastUndo.buffer, 
        cursor: lastUndo.cursor, 
        message: 'Undo',
        undoStack: prev.undoStack.slice(0, -1),
        redoStack: [...prev.redoStack, { buffer: prev.buffer, cursor: prev.cursor }],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.redoStack.length === 0) {
        return { ...prev, message: 'Already at newest change' };
      }
      
      const lastRedo = prev.redoStack[prev.redoStack.length - 1];
      onBufferChangeRef.current?.(lastRedo.buffer);
      return { 
        ...prev, 
        buffer: lastRedo.buffer, 
        cursor: lastRedo.cursor, 
        message: 'Redo',
        redoStack: prev.redoStack.slice(0, -1),
        undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
      };
    });
  }, []);

  const changeWord = useCallback((count: number = 1) => {
    setState(prev => {
      let { line, col } = prev.cursor;
      const buffer = [...prev.buffer];
      const currentLine = buffer[line] || '';
      let endCol = col;
      
      for (let i = 0; i < count; i++) {
        while (endCol < currentLine.length && !/\s/.test(currentLine[endCol])) endCol++;
      }
      
      const deletedText = currentLine.slice(col, endCol);
      buffer[line] = currentLine.slice(0, col) + currentLine.slice(endCol);
      onBufferChangeRef.current?.(buffer);
      return { 
        ...prev, 
        buffer, 
        mode: 'insert' as VimMode,
        register: [deletedText],
        registerIsLine: false,
        undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
        redoStack: [],
      };
    });
  }, []);

  const changeLine = useCallback(() => {
    setState(prev => {
      const { line } = prev.cursor;
      const buffer = [...prev.buffer];
      const deletedLine = buffer[line];
      buffer[line] = '';
      onBufferChangeRef.current?.(buffer);
      return { 
        ...prev, 
        buffer, 
        cursor: { line, col: 0 }, 
        mode: 'insert' as VimMode,
        register: [deletedLine],
        registerIsLine: true,
        undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
        redoStack: [],
      };
    });
  }, []);

  const changeToLineEnd = useCallback(() => {
    setState(prev => {
      const { line, col } = prev.cursor;
      const buffer = [...prev.buffer];
      const deletedText = buffer[line].slice(col);
      buffer[line] = buffer[line].slice(0, col);
      onBufferChangeRef.current?.(buffer);
      return { 
        ...prev, 
        buffer, 
        mode: 'insert' as VimMode,
        register: [deletedText],
        registerIsLine: false,
        undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
        redoStack: [],
      };
    });
  }, []);

  const openLineBelow = useCallback(() => {
    setState(prev => {
      const buffer = [...prev.buffer];
      const { line } = prev.cursor;
      buffer.splice(line + 1, 0, '');
      onBufferChangeRef.current?.(buffer);
      return { 
        ...prev, 
        buffer, 
        cursor: { line: line + 1, col: 0 }, 
        mode: 'insert' as VimMode,
        undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
        redoStack: [],
      };
    });
  }, []);

  const openLineAbove = useCallback(() => {
    setState(prev => {
      const buffer = [...prev.buffer];
      const { line } = prev.cursor;
      buffer.splice(line, 0, '');
      onBufferChangeRef.current?.(buffer);
      return { 
        ...prev, 
        buffer, 
        cursor: { line, col: 0 }, 
        mode: 'insert' as VimMode,
        undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
        redoStack: [],
      };
    });
  }, []);

  const searchForward = useCallback((pattern: string) => {
    if (!pattern) return;
    
    setState(prev => {
      const { line, col } = prev.cursor;
      
      for (let l = line; l < prev.buffer.length; l++) {
        const startCol = l === line ? col + 1 : 0;
        const idx = prev.buffer[l].indexOf(pattern, startCol);
        if (idx !== -1) {
          return { ...prev, cursor: { line: l, col: idx }, message: '', searchPattern: pattern, searchDirection: 'forward' as const };
        }
      }
      for (let l = 0; l <= line; l++) {
        const endCol = l === line ? col : prev.buffer[l].length;
        const idx = prev.buffer[l].indexOf(pattern);
        if (idx !== -1 && idx < endCol) {
          return { ...prev, cursor: { line: l, col: idx }, message: 'search hit BOTTOM, continuing at TOP', searchPattern: pattern, searchDirection: 'forward' as const };
        }
      }
      
      return { ...prev, message: `Pattern not found: ${pattern}`, searchPattern: pattern, searchDirection: 'forward' as const };
    });
  }, []);

  const searchBackward = useCallback((pattern: string) => {
    if (!pattern) return;
    
    setState(prev => {
      const { line, col } = prev.cursor;
      
      for (let l = line; l >= 0; l--) {
        const lineText = prev.buffer[l];
        const searchEnd = l === line ? col : lineText.length;
        const idx = lineText.lastIndexOf(pattern, searchEnd - 1);
        if (idx !== -1) {
          return { ...prev, cursor: { line: l, col: idx }, message: '', searchPattern: pattern, searchDirection: 'backward' as const };
        }
      }
      for (let l = prev.buffer.length - 1; l >= line; l--) {
        const lineText = prev.buffer[l];
        const idx = lineText.lastIndexOf(pattern);
        if (idx !== -1 && (l !== line || idx > col)) {
          return { ...prev, cursor: { line: l, col: idx }, message: 'search hit TOP, continuing at BOTTOM', searchPattern: pattern, searchDirection: 'backward' as const };
        }
      }
      
      return { ...prev, message: `Pattern not found: ${pattern}`, searchPattern: pattern, searchDirection: 'backward' as const };
    });
  }, []);

  const searchNext = useCallback(() => {
    setState(prev => {
      if (!prev.searchPattern) return prev;
      
      const pattern = prev.searchPattern;
      const { line, col } = prev.cursor;
      
      if (prev.searchDirection === 'forward') {
        for (let l = line; l < prev.buffer.length; l++) {
          const startCol = l === line ? col + 1 : 0;
          const idx = prev.buffer[l].indexOf(pattern, startCol);
          if (idx !== -1) {
            return { ...prev, cursor: { line: l, col: idx }, message: '' };
          }
        }
        for (let l = 0; l <= line; l++) {
          const idx = prev.buffer[l].indexOf(pattern);
          if (idx !== -1) {
            return { ...prev, cursor: { line: l, col: idx }, message: 'search hit BOTTOM, continuing at TOP' };
          }
        }
      } else {
        for (let l = line; l >= 0; l--) {
          const searchEnd = l === line ? col : prev.buffer[l].length;
          const idx = prev.buffer[l].lastIndexOf(pattern, searchEnd - 1);
          if (idx !== -1) {
            return { ...prev, cursor: { line: l, col: idx }, message: '' };
          }
        }
        for (let l = prev.buffer.length - 1; l >= line; l--) {
          const idx = prev.buffer[l].lastIndexOf(pattern);
          if (idx !== -1) {
            return { ...prev, cursor: { line: l, col: idx }, message: 'search hit TOP, continuing at BOTTOM' };
          }
        }
      }
      
      return { ...prev, message: `Pattern not found: ${pattern}` };
    });
  }, []);

  const searchPrev = useCallback(() => {
    setState(prev => {
      if (!prev.searchPattern) return prev;
      
      const pattern = prev.searchPattern;
      const { line, col } = prev.cursor;
      
      // Search in opposite direction
      if (prev.searchDirection === 'forward') {
        for (let l = line; l >= 0; l--) {
          const searchEnd = l === line ? col : prev.buffer[l].length;
          const idx = prev.buffer[l].lastIndexOf(pattern, searchEnd - 1);
          if (idx !== -1) {
            return { ...prev, cursor: { line: l, col: idx }, message: '' };
          }
        }
        for (let l = prev.buffer.length - 1; l >= line; l--) {
          const idx = prev.buffer[l].lastIndexOf(pattern);
          if (idx !== -1) {
            return { ...prev, cursor: { line: l, col: idx }, message: 'search hit TOP, continuing at BOTTOM' };
          }
        }
      } else {
        for (let l = line; l < prev.buffer.length; l++) {
          const startCol = l === line ? col + 1 : 0;
          const idx = prev.buffer[l].indexOf(pattern, startCol);
          if (idx !== -1) {
            return { ...prev, cursor: { line: l, col: idx }, message: '' };
          }
        }
        for (let l = 0; l <= line; l++) {
          const idx = prev.buffer[l].indexOf(pattern);
          if (idx !== -1) {
            return { ...prev, cursor: { line: l, col: idx }, message: 'search hit BOTTOM, continuing at TOP' };
          }
        }
      }
      
      return { ...prev, message: `Pattern not found: ${pattern}` };
    });
  }, []);

  const findMatchingBracket = useCallback(() => {
    setState(prev => {
      const { line, col } = prev.cursor;
      const currentLine = prev.buffer[line];
      const char = currentLine[col];
      
      const pairs: Record<string, string> = {
        '(': ')', ')': '(',
        '[': ']', ']': '[',
        '{': '}', '}': '{',
      };
      
      if (!pairs[char]) {
        return { ...prev, message: 'No bracket under cursor' };
      }
      
      const isOpening = ['(', '[', '{'].includes(char);
      const target = pairs[char];
      let depth = 1;
      
      if (isOpening) {
        for (let l = line; l < prev.buffer.length; l++) {
          const startCol = l === line ? col + 1 : 0;
          for (let c = startCol; c < prev.buffer[l].length; c++) {
            if (prev.buffer[l][c] === char) depth++;
            if (prev.buffer[l][c] === target) depth--;
            if (depth === 0) {
              return { ...prev, cursor: { line: l, col: c } };
            }
          }
        }
      } else {
        for (let l = line; l >= 0; l--) {
          const startCol = l === line ? col - 1 : prev.buffer[l].length - 1;
          for (let c = startCol; c >= 0; c--) {
            if (prev.buffer[l][c] === char) depth++;
            if (prev.buffer[l][c] === target) depth--;
            if (depth === 0) {
              return { ...prev, cursor: { line: l, col: c } };
            }
          }
        }
      }
      
      return { ...prev, message: 'Matching bracket not found' };
    });
  }, []);

  const deleteVisualSelection = useCallback(() => {
    setState(prev => {
      if (!prev.visualStart) return prev;
      
      const buffer = [...prev.buffer];
      const start = prev.visualStart;
      const end = prev.cursor;
      
      if (prev.mode === 'visual-line') {
        const startLine = Math.min(start.line, end.line);
        const endLine = Math.max(start.line, end.line);
        const deletedLines = buffer.splice(startLine, endLine - startLine + 1);
        if (buffer.length === 0) buffer.push('');
        onBufferChangeRef.current?.(buffer);
        return { 
          ...prev, 
          buffer, 
          cursor: { line: Math.min(startLine, buffer.length - 1), col: 0 },
          mode: 'normal' as VimMode,
          register: deletedLines,
          registerIsLine: true,
          visualStart: null,
          undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
          redoStack: [],
        };
      }
      
      const startPos = (start.line < end.line || (start.line === end.line && start.col <= end.col)) 
        ? start : end;
      const endPos = startPos === start ? end : start;
      
      if (startPos.line === endPos.line) {
        const line = buffer[startPos.line];
        const deleted = line.slice(startPos.col, endPos.col + 1);
        buffer[startPos.line] = line.slice(0, startPos.col) + line.slice(endPos.col + 1);
        onBufferChangeRef.current?.(buffer);
        return { 
          ...prev, 
          buffer, 
          cursor: clampCursor(startPos, buffer),
          mode: 'normal' as VimMode,
          register: [deleted],
          registerIsLine: false,
          visualStart: null,
          undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
          redoStack: [],
        };
      } else {
        const firstLine = buffer[startPos.line].slice(0, startPos.col);
        const lastLine = buffer[endPos.line].slice(endPos.col + 1);
        buffer[startPos.line] = firstLine + lastLine;
        buffer.splice(startPos.line + 1, endPos.line - startPos.line);
        onBufferChangeRef.current?.(buffer);
        return { 
          ...prev, 
          buffer, 
          cursor: clampCursor(startPos, buffer),
          mode: 'normal' as VimMode,
          visualStart: null,
          undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
          redoStack: [],
        };
      }
    });
  }, [clampCursor]);

  const yankVisualSelection = useCallback(() => {
    setState(prev => {
      if (!prev.visualStart) return prev;
      
      const start = prev.visualStart;
      const end = prev.cursor;
      
      if (prev.mode === 'visual-line') {
        const startLine = Math.min(start.line, end.line);
        const endLine = Math.max(start.line, end.line);
        const yankedLines = prev.buffer.slice(startLine, endLine + 1);
        return { 
          ...prev, 
          mode: 'normal' as VimMode, 
          message: `${yankedLines.length} lines yanked`,
          register: yankedLines,
          registerIsLine: true,
          visualStart: null,
        };
      }
      
      const startPos = (start.line < end.line || (start.line === end.line && start.col <= end.col)) 
        ? start : end;
      const endPos = startPos === start ? end : start;
      
      if (startPos.line === endPos.line) {
        const yanked = prev.buffer[startPos.line].slice(startPos.col, endPos.col + 1);
        return { 
          ...prev, 
          mode: 'normal' as VimMode, 
          message: 'Yanked',
          register: [yanked],
          registerIsLine: false,
          visualStart: null,
        };
      }
      
      return { ...prev, mode: 'normal' as VimMode, visualStart: null };
    });
  }, []);

  const insertChar = useCallback((char: string) => {
    setState(prev => {
      if (prev.mode !== 'insert' && prev.mode !== 'replace') return prev;
      
      const { line, col } = prev.cursor;
      const buffer = [...prev.buffer];
      const currentLine = buffer[line] || '';
      
      if (prev.mode === 'replace') {
        if (col < currentLine.length) {
          buffer[line] = currentLine.slice(0, col) + char + currentLine.slice(col + 1);
        } else {
          buffer[line] = currentLine + char;
        }
        onBufferChangeRef.current?.(buffer);
        return { ...prev, buffer, cursor: { line, col: col + 1 } };
      }
      
      buffer[line] = currentLine.slice(0, col) + char + currentLine.slice(col);
      onBufferChangeRef.current?.(buffer);
      return { ...prev, buffer, cursor: { line, col: col + 1 } };
    });
  }, []);

  const insertNewline = useCallback(() => {
    setState(prev => {
      if (prev.mode !== 'insert') return prev;
      
      const { line, col } = prev.cursor;
      const buffer = [...prev.buffer];
      const currentLine = buffer[line] || '';
      
      buffer[line] = currentLine.slice(0, col);
      buffer.splice(line + 1, 0, currentLine.slice(col));
      onBufferChangeRef.current?.(buffer);
      return { ...prev, buffer, cursor: { line: line + 1, col: 0 } };
    });
  }, []);

  const backspace = useCallback(() => {
    setState(prev => {
      if (prev.mode !== 'insert' && prev.mode !== 'replace') return prev;
      
      const { line, col } = prev.cursor;
      const buffer = [...prev.buffer];
      
      if (col > 0) {
        const currentLine = buffer[line];
        buffer[line] = currentLine.slice(0, col - 1) + currentLine.slice(col);
        onBufferChangeRef.current?.(buffer);
        return { ...prev, buffer, cursor: { line, col: col - 1 } };
      } else if (line > 0) {
        const prevLineLen = buffer[line - 1].length;
        buffer[line - 1] += buffer[line];
        buffer.splice(line, 1);
        onBufferChangeRef.current?.(buffer);
        return { ...prev, buffer, cursor: { line: line - 1, col: prevLineLen } };
      }
      return prev;
    });
  }, []);

  const setMode = useCallback((mode: VimMode) => {
    setState(prev => {
      if ((prev.mode === 'insert' || prev.mode === 'replace') && mode === 'normal' && prev.cursor.col > 0) {
        return { 
          ...prev, 
          mode, 
          cursor: { ...prev.cursor, col: prev.cursor.col - 1 },
          commandBuffer: '',
          visualStart: mode === 'normal' ? null : prev.visualStart,
        };
      }
      return { ...prev, mode, commandBuffer: '', visualStart: mode === 'normal' ? null : prev.visualStart };
    });
    setPendingOperator(null);
    setCountBuffer('');
  }, []);

  const appendCommandBuffer = useCallback((char: string) => {
    setState(prev => ({ ...prev, commandBuffer: prev.commandBuffer + char }));
  }, []);

  const clearCommandBuffer = useCallback(() => {
    setState(prev => ({ ...prev, commandBuffer: '' }));
  }, []);

  const setMessage = useCallback((message: string) => {
    setState(prev => ({ ...prev, message }));
  }, []);

  const executeSubstitute = useCallback((command: string) => {
    const match = command.match(/^s\/([^/]*)\/([^/]*)(?:\/([g]?))?$/);
    if (!match) {
      setState(prev => ({ ...prev, message: 'Invalid substitution command' }));
      return;
    }
    
    const [, pattern, replacement, flags] = match;
    const global = flags === 'g';
    
    setState(prev => {
      const buffer = [...prev.buffer];
      const { line } = prev.cursor;
      
      if (global) {
        buffer[line] = buffer[line].split(pattern).join(replacement);
      } else {
        buffer[line] = buffer[line].replace(pattern, replacement);
      }
      
      onBufferChangeRef.current?.(buffer);
      return { 
        ...prev, 
        buffer, 
        message: 'Substitution done',
        undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
        redoStack: [],
      };
    });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent): { handled: boolean; command?: string } => {
    const key = e.key;
    const isCtrl = e.ctrlKey;
    
    if (state.mode === 'normal' || state.mode === 'command' || state.mode === 'visual' || state.mode === 'visual-line') {
      if (!e.metaKey) {
        e.preventDefault();
      }
    }
    
    if (key === 'Escape') {
      setMode('normal');
      clearCommandBuffer();
      setState(prev => ({ ...prev, visualStart: null }));
      return { handled: true };
    }

    if (state.mode === 'command') {
      if (key === 'Enter') {
        const command = state.commandBuffer;
        clearCommandBuffer();
        setMode('normal');
        
        if (command.startsWith('/')) {
          searchForward(command.slice(1));
          return { handled: true };
        } else if (command.startsWith('?')) {
          searchBackward(command.slice(1));
          return { handled: true };
        } else if (command.startsWith('s/')) {
          executeSubstitute(command);
          return { handled: true };
        } else if (command === '!ls') {
          setMessage('lesson.txt  notes.txt  config.vim');
          return { handled: true };
        } else if (command === '!pwd') {
          setMessage('/home/user/vimtutor');
          return { handled: true };
        } else if (command === '!date') {
          setMessage(new Date().toLocaleString());
          return { handled: true };
        } else if (command.startsWith('set ')) {
          setMessage(`Option set: ${command.slice(4)}`);
          return { handled: true };
        } else if (command === 'help' || command.startsWith('help ')) {
          setMessage('Help: Use :help {topic} for specific help');
          return { handled: true };
        }
        
        return { handled: true, command };
      } else if (key === 'Backspace') {
        if (state.commandBuffer.length === 0) {
          setMode('normal');
        } else {
          setState(prev => ({ 
            ...prev, 
            commandBuffer: prev.commandBuffer.slice(0, -1) 
          }));
        }
        return { handled: true };
      } else if (key.length === 1) {
        appendCommandBuffer(key);
        return { handled: true };
      }
      return { handled: false };
    }

    if (state.mode === 'insert' || state.mode === 'replace') {
      if (key === 'Backspace') {
        backspace();
        return { handled: true };
      } else if (key === 'Enter') {
        if (state.mode === 'insert') {
          insertNewline();
        }
        return { handled: true };
      } else if (key.length === 1 && !isCtrl && !e.metaKey) {
        e.preventDefault();
        insertChar(key);
        return { handled: true };
      }
      return { handled: false };
    }

    if (state.mode === 'visual' || state.mode === 'visual-line') {
      const count = parseInt(countBuffer) || 1;
      
      switch (key) {
        case 'h':
          moveCursor(0, -1, count);
          setCountBuffer('');
          return { handled: true };
        case 'j':
          moveCursor(1, 0, count);
          setCountBuffer('');
          return { handled: true };
        case 'k':
          moveCursor(-1, 0, count);
          setCountBuffer('');
          return { handled: true };
        case 'l':
          moveCursor(0, 1, count);
          setCountBuffer('');
          return { handled: true };
        case 'd':
        case 'x':
          deleteVisualSelection();
          setCountBuffer('');
          return { handled: true };
        case 'y':
          yankVisualSelection();
          setCountBuffer('');
          return { handled: true };
        case 'v':
          setMode('normal');
          return { handled: true };
        case 'V':
          if (state.mode === 'visual-line') {
            setMode('normal');
          } else {
            setState(prev => ({ ...prev, mode: 'visual-line' as VimMode }));
          }
          return { handled: true };
      }
      
      setCountBuffer('');
      return { handled: true };
    }

    if (state.mode === 'normal') {
      const count = parseInt(countBuffer) || 1;

      if (isCtrl) {
        if (key === 'r') {
          redo();
          return { handled: true };
        } else if (key === 'g') {
          const { line } = state.cursor;
          setMessage(`"lesson.txt" line ${line + 1} of ${state.buffer.length} --${Math.round((line + 1) / state.buffer.length * 100)}%--`);
          return { handled: true };
        }
        return { handled: false };
      }

      if (/[0-9]/.test(key) && (countBuffer.length > 0 || key !== '0')) {
        setCountBuffer(prev => prev + key);
        return { handled: true };
      }

      if (pendingOperator) {
        if (pendingOperator === 'd') {
          if (key === 'd') {
            deleteLine(count);
            setPendingOperator(null);
            setCountBuffer('');
            return { handled: true };
          } else if (key === 'w') {
            deleteWord(count);
            setPendingOperator(null);
            setCountBuffer('');
            return { handled: true };
          } else if (key === '$') {
            deleteToLineEnd();
            setPendingOperator(null);
            setCountBuffer('');
            return { handled: true };
          }
        } else if (pendingOperator === 'c') {
          if (key === 'c') {
            changeLine();
            setPendingOperator(null);
            setCountBuffer('');
            return { handled: true };
          } else if (key === 'w' || key === 'e') {
            changeWord(count);
            setPendingOperator(null);
            setCountBuffer('');
            return { handled: true };
          } else if (key === '$') {
            changeToLineEnd();
            setPendingOperator(null);
            setCountBuffer('');
            return { handled: true };
          }
        } else if (pendingOperator === 'y') {
          if (key === 'y') {
            yankLine(count);
            setPendingOperator(null);
            setCountBuffer('');
            return { handled: true };
          } else if (key === 'w') {
            yankWord(count);
            setPendingOperator(null);
            setCountBuffer('');
            return { handled: true };
          }
        } else if (pendingOperator === 'r') {
          if (key.length === 1) {
            replaceChar(key);
            setPendingOperator(null);
            setCountBuffer('');
            return { handled: true };
          }
        } else if (pendingOperator === 'g') {
          if (key === 'g') {
            moveToFirstLine();
            setPendingOperator(null);
            setCountBuffer('');
            return { handled: true };
          }
        }
        setPendingOperator(null);
        setCountBuffer('');
        return { handled: true };
      }

      switch (key) {
        case 'h':
          moveCursor(0, -1, count);
          setCountBuffer('');
          return { handled: true };
        case 'j':
          moveCursor(1, 0, count);
          setCountBuffer('');
          return { handled: true };
        case 'k':
          moveCursor(-1, 0, count);
          setCountBuffer('');
          return { handled: true };
        case 'l':
          moveCursor(0, 1, count);
          setCountBuffer('');
          return { handled: true };
        case '0':
          moveToLineStart();
          setCountBuffer('');
          return { handled: true };
        case '$':
          moveToLineEnd();
          setCountBuffer('');
          return { handled: true };
        case 'w':
          moveWordForward(count);
          setCountBuffer('');
          return { handled: true };
        case 'b':
          moveWordBackward(count);
          setCountBuffer('');
          return { handled: true };
        case 'x':
          for (let i = 0; i < count; i++) deleteChar();
          setCountBuffer('');
          return { handled: true };
        case 'd':
          setPendingOperator('d');
          return { handled: true };
        case 'c':
          setPendingOperator('c');
          return { handled: true };
        case 'y':
          setPendingOperator('y');
          return { handled: true };
        case 'r':
          setPendingOperator('r');
          return { handled: true };
        case 'g':
          setPendingOperator('g');
          return { handled: true };
        case 'G':
          if (countBuffer) {
            moveToLine(count);
          } else {
            moveToLastLine();
          }
          setCountBuffer('');
          return { handled: true };
        case 'p':
          putAfter();
          setCountBuffer('');
          return { handled: true };
        case 'P':
          putBefore();
          setCountBuffer('');
          return { handled: true };
        case 'u':
          undo();
          setCountBuffer('');
          return { handled: true };
        case 'n':
          searchNext();
          setCountBuffer('');
          return { handled: true };
        case 'N':
          searchPrev();
          setCountBuffer('');
          return { handled: true };
        case '%':
          findMatchingBracket();
          setCountBuffer('');
          return { handled: true };
        case 'o':
          openLineBelow();
          setCountBuffer('');
          return { handled: true };
        case 'O':
          openLineAbove();
          setCountBuffer('');
          return { handled: true };
        case 'i':
          setState(prev => ({
            ...prev,
            undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
            redoStack: [],
          }));
          setMode('insert');
          setCountBuffer('');
          return { handled: true };
        case 'a':
          setState(prev => ({
            ...prev,
            cursor: { 
              ...prev.cursor, 
              col: Math.min(prev.cursor.col + 1, (prev.buffer[prev.cursor.line]?.length || 0))
            },
            undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
            redoStack: [],
          }));
          setMode('insert');
          setCountBuffer('');
          return { handled: true };
        case 'A':
          setState(prev => ({
            ...prev,
            cursor: { 
              ...prev.cursor, 
              col: prev.buffer[prev.cursor.line]?.length || 0
            },
            undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
            redoStack: [],
          }));
          setMode('insert');
          setCountBuffer('');
          return { handled: true };
        case 'R':
          setState(prev => ({ 
            ...prev, 
            mode: 'replace' as VimMode,
            undoStack: [...prev.undoStack, { buffer: prev.buffer, cursor: prev.cursor }],
            redoStack: [],
          }));
          setCountBuffer('');
          return { handled: true };
        case 'v':
          setState(prev => ({ ...prev, mode: 'visual' as VimMode, visualStart: { ...prev.cursor } }));
          setCountBuffer('');
          return { handled: true };
        case 'V':
          setState(prev => ({ ...prev, mode: 'visual-line' as VimMode, visualStart: { ...prev.cursor } }));
          setCountBuffer('');
          return { handled: true };
        case ':':
          setMode('command');
          setCountBuffer('');
          return { handled: true };
        case '/':
          setState(prev => ({ ...prev, mode: 'command' as VimMode, commandBuffer: '/' }));
          setCountBuffer('');
          return { handled: true };
        case '?':
          setState(prev => ({ ...prev, mode: 'command' as VimMode, commandBuffer: '?' }));
          setCountBuffer('');
          return { handled: true };
        default:
          setCountBuffer('');
          return { handled: false };
      }
    }

    return { handled: false };
  }, [
    state.mode, 
    state.commandBuffer,
    state.cursor,
    state.buffer,
    countBuffer,
    pendingOperator,
    moveCursor, 
    moveToLineStart, 
    moveToLineEnd,
    moveToFirstLine,
    moveToLastLine,
    moveToLine,
    moveWordForward,
    moveWordBackward,
    deleteChar,
    deleteWord,
    deleteLine,
    deleteToLineEnd,
    deleteVisualSelection,
    yankLine,
    yankWord,
    yankVisualSelection,
    putAfter,
    putBefore,
    replaceChar,
    undo,
    redo,
    changeWord,
    changeLine,
    changeToLineEnd,
    openLineBelow,
    openLineAbove,
    searchForward,
    searchBackward,
    searchNext,
    searchPrev,
    findMatchingBracket,
    executeSubstitute,
    insertChar,
    insertNewline,
    backspace,
    setMode,
    appendCommandBuffer,
    clearCommandBuffer,
    setMessage,
  ]);

  const resetBuffer = useCallback(() => {
    setState({
      mode: 'normal',
      buffer: [...initialBuffer],
      cursor: { line: 0, col: 0 },
      commandBuffer: '',
      lastCommand: '',
      message: '',
      undoStack: [],
      redoStack: [],
      register: [],
      registerIsLine: false,
      searchPattern: '',
      searchDirection: 'forward',
      visualStart: null,
    });
    setPendingOperator(null);
    setCountBuffer('');
  }, [initialBuffer]);

  return {
    state,
    pendingOperator,
    countBuffer,
    visualStart: state.visualStart,
    handleKeyDown,
    resetBuffer,
    setMessage,
  };
}
