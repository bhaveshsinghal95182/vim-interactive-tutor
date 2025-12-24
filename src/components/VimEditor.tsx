import { useEffect, useRef, useCallback } from 'react';
import { useVimEditor } from '@/hooks/useVimEditor';
import { VimMode } from '@/types/vim';
import { cn } from '@/lib/utils';

interface VimEditorProps {
  initialBuffer: string[];
  targetBuffer?: string[];
  lessonId?: string;
  onSuccess?: () => void;
  onCommand?: (command: string) => void;
  className?: string;
}

export function VimEditor({ 
  initialBuffer, 
  targetBuffer, 
  lessonId,
  onSuccess, 
  onCommand,
  className 
}: VimEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const successCalledRef = useRef(false);
  
  // Reset success flag when lesson changes
  useEffect(() => {
    successCalledRef.current = false;
  }, [lessonId, initialBuffer]);
  
  const handleBufferChange = useCallback((buffer: string[]) => {
    if (successCalledRef.current) return;
    if (targetBuffer && targetBuffer.length > 0) {
      const matches = buffer.length === targetBuffer.length &&
        buffer.every((line, i) => line === targetBuffer[i]);
      if (matches) {
        successCalledRef.current = true;
        onSuccess?.();
      }
    }
  }, [targetBuffer, onSuccess]);

  const { state, pendingOperator, countBuffer, handleKeyDown, resetBuffer } = useVimEditor({
    initialBuffer,
    onBufferChange: handleBufferChange,
  });

  // Special validation for lesson 1.1 - check if cursor is on 'X'
  useEffect(() => {
    if (successCalledRef.current) return;
    if (lessonId === '1.1') {
      const { line, col } = state.cursor;
      const currentLine = state.buffer[line] || '';
      const charUnderCursor = currentLine[col];
      if (charUnderCursor === 'X') {
        successCalledRef.current = true;
        onSuccess?.();
      }
    }
  }, [lessonId, state.cursor, state.buffer, onSuccess]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const result = handleKeyDown(e);
      if (result.command) {
        if (result.command === 'reset') {
          resetBuffer();
        } else {
          onCommand?.(result.command);
        }
      }
    };

    container.focus();
    container.addEventListener('keydown', onKeyDown);
    return () => container.removeEventListener('keydown', onKeyDown);
  }, [handleKeyDown, onCommand, resetBuffer]);

  const getModeColor = (mode: VimMode) => {
    switch (mode) {
      case 'normal': return 'bg-gruvbox-yellow text-primary-foreground';
      case 'insert': return 'bg-gruvbox-green text-primary-foreground';
      case 'visual': return 'bg-gruvbox-purple text-foreground';
      case 'visual-line': return 'bg-gruvbox-purple text-foreground';
      case 'command': return 'bg-gruvbox-blue text-foreground';
      case 'replace': return 'bg-gruvbox-red text-foreground';
      default: return 'bg-gruvbox-yellow text-primary-foreground';
    }
  };

  const getModeText = (mode: VimMode) => {
    switch (mode) {
      case 'normal': return '-- NORMAL --';
      case 'insert': return '-- INSERT --';
      case 'visual': return '-- VISUAL --';
      case 'visual-line': return '-- VISUAL LINE --';
      case 'command': return ':';
      case 'replace': return '-- REPLACE --';
      default: return '-- NORMAL --';
    }
  };

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      className={cn(
        "flex flex-col bg-background rounded-lg border border-border overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50",
        className
      )}
    >
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gruvbox-red/80" />
            <div className="w-3 h-3 rounded-full bg-gruvbox-yellow/80" />
            <div className="w-3 h-3 rounded-full bg-gruvbox-green/80" />
          </div>
          <span className="font-mono text-sm text-muted-foreground ml-2">
            lesson.txt
          </span>
        </div>
        <div className="flex items-center gap-2">
          {pendingOperator && (
            <span className="font-mono text-sm text-gruvbox-aqua">
              {pendingOperator}
            </span>
          )}
          {countBuffer && (
            <span className="font-mono text-sm text-gruvbox-orange">
              {countBuffer}
            </span>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 p-4 font-mono text-base leading-relaxed overflow-auto min-h-[300px]">
        {state.buffer.map((line, lineIndex) => (
          <div 
            key={lineIndex}
            className={cn(
              "flex min-h-[1.5rem]",
              lineIndex === state.cursor.line && "bg-editor-lineHighlight rounded"
            )}
          >
            {/* Line number */}
            <span className="w-8 text-right pr-4 text-muted-foreground select-none text-sm">
              {lineIndex + 1}
            </span>
            
            {/* Line content */}
            <span className="flex-1 whitespace-pre">
              {line.split('').map((char, colIndex) => {
                const isCursor = lineIndex === state.cursor.line && colIndex === state.cursor.col;
                
                return (
                  <span
                    key={colIndex}
                    className={cn(
                      isCursor && state.mode === 'normal' && "bg-primary text-primary-foreground",
                      isCursor && state.mode === 'insert' && "border-l-2 border-gruvbox-green",
                    )}
                  >
                    {char}
                  </span>
                );
              })}
              {/* Cursor at end of line */}
              {lineIndex === state.cursor.line && state.cursor.col >= line.length && (
                <span 
                  className={cn(
                    "inline-block w-2",
                    state.mode === 'normal' && "bg-primary animate-cursor-blink",
                    state.mode === 'insert' && "border-l-2 border-gruvbox-green animate-cursor-blink",
                  )}
                >
                  &nbsp;
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Statusline */}
      <div className="statusline border-t border-border">
        <div className="flex items-center gap-3">
          <span className={cn("mode-indicator", getModeColor(state.mode))}>
            {getModeText(state.mode)}
            {state.mode === 'command' && state.commandBuffer}
          </span>
          {state.message && (
            <span className="text-muted-foreground">{state.message}</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>
            {Math.round((state.cursor.line / Math.max(1, state.buffer.length - 1)) * 100)}%
          </span>
          <span>
            {state.cursor.line + 1}:{state.cursor.col + 1}
          </span>
        </div>
      </div>
    </div>
  );
}
