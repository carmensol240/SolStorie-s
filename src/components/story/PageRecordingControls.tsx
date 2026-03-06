import React from 'react';
import { Mic, Square, Save, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageRecordingControlsProps {
  pageNumber: number;
  isRecording: boolean;
  hasPendingBlob: boolean;
  hasSaved: boolean;
  isPlaying: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onPlay: () => void;
  onStopPlaying: () => void;
  /** Light text variant for dark backgrounds (illustrations / combined pages) */
  light?: boolean;
}

const PageRecordingControls: React.FC<PageRecordingControlsProps> = ({
  pageNumber,
  isRecording,
  hasPendingBlob,
  hasSaved,
  isPlaying,
  onStartRecording,
  onStopRecording,
  onSave,
  onDiscard,
  onPlay,
  onStopPlaying,
  light = false,
}) => {
  const btnBase = cn(
    'rounded-full p-2 transition-all duration-200 shadow-md active:scale-95',
    light
      ? 'bg-white/30 backdrop-blur-sm text-white border border-white/40 hover:bg-white/50'
      : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 shadow-purple-100',
  );

  return (
    <div className="flex items-center gap-2 justify-center" dir="rtl">
      {/* Recording in progress */}
      {isRecording ? (
        <button onClick={onStopRecording} className={cn(btnBase, 'animate-pulse ring-2 ring-red-400')} aria-label="עצור הקלטה">
          <Square className="w-4 h-4 fill-red-500 text-red-500" />
        </button>
      ) : hasPendingBlob ? (
        /* Pending save */
        <>
          <button onClick={onSave} className={cn(btnBase, 'ring-2 ring-green-400')} aria-label="שמור הקלטה">
            <Save className="w-4 h-4" />
          </button>
          <button onClick={onStartRecording} className={cn(btnBase, 'opacity-70')} aria-label="הקלט מחדש">
            <RotateCcw className="w-4 h-4" />
          </button>
        </>
      ) : (
        /* Idle — show record or play */
        <>
          {hasSaved && (
            isPlaying ? (
              <button onClick={onStopPlaying} className={cn(btnBase, 'ring-2 ring-purple-400')} aria-label="עצור השמעה">
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={onPlay} className={btnBase} aria-label="השמע הקלטה">
                <Play className="w-4 h-4" />
              </button>
            )
          )}
          <button
            onClick={onStartRecording}
            className={cn(btnBase, hasSaved ? 'opacity-70' : '')}
            aria-label={hasSaved ? 'הקלט מחדש' : 'הקלט'}
          >
            {hasSaved ? <RotateCcw className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </>
      )}
    </div>
  );
};

export default PageRecordingControls;
