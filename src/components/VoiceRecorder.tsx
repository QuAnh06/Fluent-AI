import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, RotateCcw, Send, Play, Pause, Edit3, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { SpeechRecognitionController, AudioRecorderManager } from '../utils/audioEngine';

interface VoiceRecorderProps {
  question: string;
  topicTitle: string;
  categoryLabel?: string;
  cueCardPoints?: string[];
  targetSpeakingSeconds?: number;
  isAnalyzing: boolean;
  onSubmit: (transcript: string, durationSeconds: number, audioUrl?: string) => void;
  attemptNumber?: number;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  question,
  topicTitle,
  categoryLabel,
  cueCardPoints,
  targetSpeakingSeconds = 60,
  isAnalyzing,
  onSubmit,
  attemptNumber = 1,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingOwnAudio, setIsPlayingOwnAudio] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [micErrorNotice, setMicErrorNotice] = useState<string | null>(null);
  const [isSimulatedRecording, setIsSimulatedRecording] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionController | null>(null);
  const recorderManagerRef = useRef<AudioRecorderManager | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const controller = new SpeechRecognitionController(
      (text) => {
        setTranscript(text);
      },
      (error) => {
        console.warn('Speech recognition warning:', error);
      }
    );
    recognitionRef.current = controller;
    setMicSupported(controller.isAvailable());

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Handle start recording with microphone
  const handleStartRecording = async () => {
    setMicErrorNotice(null);
    if (isPlayingOwnAudio && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlayingOwnAudio(false);
    }

    setTranscript('');
    setElapsedSeconds(0);
    setAudioUrl(null);
    setIsEditingTranscript(false);
    setIsSimulatedRecording(false);

    recorderManagerRef.current = new AudioRecorderManager();
    const result = await recorderManagerRef.current.startRecording((volume) => {
      setVolumeLevel(volume);
    });

    if (result.success) {
      setIsRecording(true);
      recognitionRef.current?.start();

      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      // Graceful in-app fallback (no window.alert)
      setMicErrorNotice(
        result.errorType === 'permission_denied'
          ? 'Microphone chưa được cấp quyền truy cập. Bạn có thể cấp quyền trong trình duyệt hoặc bấm "Luyện nói bấm giờ" để tự nói và nhập câu trả lời.'
          : result.errorMessage || 'Không thể mở microphone. Bạn có thể chuyển sang chế độ tự nhập bên dưới.'
      );
      setIsEditingTranscript(true);
    }
  };

  // Handle simulated / timer-only speaking practice (works with zero mic permissions)
  const handleStartTimerPractice = () => {
    setMicErrorNotice(null);
    setIsSimulatedRecording(true);
    setIsRecording(true);
    setElapsedSeconds(0);
    setIsEditingTranscript(true);

    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        // Generate simulated dynamic volume for waveform
        setVolumeLevel(Math.floor(25 + Math.random() * 50));
        return prev + 1;
      });
    }, 1000);
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsSimulatedRecording(false);
    setVolumeLevel(0);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const finalRecognized = recognitionRef.current?.stop() || '';
    if (finalRecognized) {
      setTranscript(finalRecognized);
    }

    if (recorderManagerRef.current) {
      const result = await recorderManagerRef.current.stopRecording();
      if (result.audioUrl) {
        setAudioUrl(result.audioUrl);
      }
    }
  };

  // Handle Reset
  const handleReset = () => {
    if (isRecording) {
      handleStopRecording();
    }
    setTranscript('');
    setElapsedSeconds(0);
    setAudioUrl(null);
    setIsPlayingOwnAudio(false);
    recognitionRef.current?.reset('');
  };

  // Toggle user audio playback
  const togglePlayAudio = () => {
    if (!audioUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlayingOwnAudio(false);
    }

    if (isPlayingOwnAudio) {
      audioElementRef.current.pause();
      setIsPlayingOwnAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingOwnAudio(true);
    }
  };

  // WPM & Pace calculation
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const currentWpm = elapsedSeconds > 2 ? Math.round((wordCount / elapsedSeconds) * 60) : 0;

  const getPaceBadge = () => {
    if (wordCount < 5) return null;
    if (currentWpm < 95) {
      return <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Tốc độ hơi chậm ({currentWpm} WPM)</span>;
    }
    if (currentWpm > 165) {
      return <span className="text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Hơi nhanh ({currentWpm} WPM)</span>;
    }
    return <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Tốc độ lý tưởng ({currentWpm} WPM)</span>;
  };

  // Format seconds mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  // Quick sample fill for demo or testing
  const handleInsertSample = (type: 'typical_b1' | 'ielts_attempt') => {
    if (type === 'typical_b1') {
      setTranscript(
        "Well, in my free time, I really like playing badminton with my friend. I have played badminton yesterday with him and it was very good. Badminton help me to keep fit and relax after work. But actually, I don't have much time because my company is very busy."
      );
      setElapsedSeconds(18);
    } else {
      setTranscript(
        "To be honest, whenever I have some downtime, I usually gravitate towards reading science fiction novels or going for a stroll in the park. Last weekend, I went to a local botanical garden with my family, which was incredibly rejuvenating. Engaging in these leisure activities definitely allows me to recharge my batteries after an exhausting workweek."
      );
      setElapsedSeconds(28);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
      {/* Background visual ambiance */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/70 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-50/70 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Question Header Card */}
      <div className="relative z-10 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {categoryLabel || 'Speaking Practice'}
            </span>
            <span className="text-xs text-slate-500">• {topicTitle}</span>
          </div>
          {attemptNumber > 1 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
              Lần nói thứ {attemptNumber} (Retry Drill)
            </span>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
          {question}
        </h2>

        {/* IELTS Part 2 Cue card bullets if present */}
        {cueCardPoints && cueCardPoints.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-sm">
            <p className="font-semibold text-indigo-700 mb-2">You should say:</p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-600">
              {cueCardPoints.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Microphone Permission Warning / In-app Banner */}
      {micErrorNotice && (
        <div className="relative z-10 mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold text-amber-900">Microphone chưa được cấp quyền</p>
              <p className="text-amber-800 text-xs mt-0.5">{micErrorNotice}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleStartRecording}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              Cấp quyền lại
            </button>
            <button
              onClick={handleStartTimerPractice}
              className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-semibold text-xs hover:bg-amber-100 transition cursor-pointer shadow-xs"
            >
              Luyện nói bấm giờ
            </button>
            <button
              onClick={() => setMicErrorNotice(null)}
              className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Interactive Recording Zone */}
      <div className="relative z-10 bg-slate-50/80 border border-slate-200 rounded-2xl p-6 mb-6 text-center">
        {/* Visual Waveform Frequency Bars */}
        <div className="flex items-center justify-center space-x-1.5 h-16 mb-4">
          {Array.from({ length: 24 }).map((_, i) => {
            const barHeight = isRecording
              ? Math.max(8, Math.min(60, Math.sin((i / 24) * Math.PI) * (volumeLevel * 0.9) + Math.random() * 15))
              : 6;

            return (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-75 ${
                  isRecording
                    ? 'bg-gradient-to-t from-indigo-600 via-sky-500 to-emerald-500 shadow-xs'
                    : 'bg-slate-200'
                }`}
                style={{ height: `${barHeight}px` }}
              />
            );
          })}
        </div>

        {/* Big Record Button */}
        <div className="flex items-center justify-center space-x-6">
          {!isRecording ? (
            <div className="flex flex-col items-center">
              <button
                onClick={handleStartRecording}
                disabled={isAnalyzing}
                className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Mic className="w-9 h-9 group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 rounded-full border-2 border-white/30 group-hover:border-white/60 transition" />
              </button>
              <button
                onClick={handleStartTimerPractice}
                disabled={isAnalyzing}
                className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-4 cursor-pointer"
              >
                Hoặc bấm giờ tự luyện nói (không cần mic)
              </button>
            </div>
          ) : (
            <button
              onClick={handleStopRecording}
              className="relative flex items-center justify-center w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 animate-pulse transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Square className="w-8 h-8 fill-white" />
            </button>
          )}
        </div>

        {/* Timer & Status Label */}
        <div className="mt-4 flex flex-col items-center">
          <div className="text-2xl font-mono font-bold text-slate-900 tracking-wider">
            {formatTime(elapsedSeconds)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isRecording
              ? isSimulatedRecording
                ? 'Đang bấm giờ luyện nói... Hãy nói to ra tiếng, sau đó nhấn dừng để AI phân tích'
                : 'Đang lắng nghe giọng nói của bạn... Nhấn nút vuông đỏ để hoàn tất'
              : transcript
              ? 'Đã ghi âm xong. Kiểm tra bản gõ lời nói hoặc nhấn "Chẩn Đoán Bằng AI"'
              : 'Nhấn vào micro để bắt đầu trả lời bằng giọng nói'}
          </p>

          <div className="mt-2 flex items-center space-x-2">
            {getPaceBadge()}
            {wordCount > 0 && (
              <span className="text-slate-500 text-xs">{wordCount} từ</span>
            )}
          </div>
        </div>

        {/* User Playback Audio bar if recorded */}
        {audioUrl && !isRecording && (
          <div className="mt-4 inline-flex items-center space-x-3 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 shadow-xs">
            <Volume2 className="w-4 h-4 text-indigo-600" />
            <span>Bản ghi âm giọng của bạn:</span>
            <button
              onClick={togglePlayAudio}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition cursor-pointer shadow-xs"
            >
              {isPlayingOwnAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingOwnAudio ? 'Tạm dừng' : 'Nghe lại giọng mình'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Spoken Transcript Area */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
            <span>Lời nói được nhận diện (Transcript):</span>
            {!micSupported && (
              <span className="text-amber-700 text-xs flex items-center gap-1 font-normal">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Web Speech chưa kích hoạt, bạn có thể gõ văn bản trực tiếp
              </span>
            )}
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditingTranscript(!isEditingTranscript)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingTranscript ? 'Khóa chỉnh sửa' : 'Chỉnh sửa chữ'}</span>
            </button>
          </div>
        </div>

        {isEditingTranscript ? (
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Bạn có thể gõ hoặc điều chỉnh lại câu trả lời tiếng Anh của mình tại đây..."
            rows={4}
            className="w-full rounded-2xl bg-white border border-slate-300 p-4 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        ) : (
          <div
            onClick={() => setIsEditingTranscript(true)}
            className="w-full min-h-[90px] rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-800 cursor-text hover:border-slate-300 transition"
          >
            {transcript ? (
              <p className="leading-relaxed">{transcript}</p>
            ) : (
              <p className="text-slate-400 italic">
                Lời nói của bạn sẽ tự động xuất hiện ở đây theo thời gian thực khi bạn bắt đầu nói...
              </p>
            )}
          </div>
        )}

        {/* Quick test prompts helper */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Thử nhanh mẫu:
          </span>
          <button
            onClick={() => handleInsertSample('typical_b1')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            Mẫu có lỗi thì & ngữ pháp (Band 5.5)
          </button>
          <button
            onClick={() => handleInsertSample('ielts_attempt')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            Mẫu diễn đạt tự nhiên (Band 7.5)
          </button>
        </div>
      </div>

      {/* Action Buttons: Reset & Analyze */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={handleReset}
          disabled={isRecording || isAnalyzing}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition flex items-center justify-center space-x-2 text-sm cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Ghi lại từ đầu</span>
        </button>

        <button
          onClick={() => onSubmit(transcript, Math.max(5, elapsedSeconds), audioUrl || undefined)}
          disabled={!transcript.trim() || isRecording || isAnalyzing}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>AI Đang Phân Tích Toàn Diện...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Chẩn Đoán Bằng AI (Sửa Lỗi & Band Điểm)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

