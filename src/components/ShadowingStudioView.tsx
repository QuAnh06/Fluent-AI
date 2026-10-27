import React, { useState, useRef, useEffect } from 'react';
import { SHADOWING_EXERCISES } from '../data/shadowingSentences';
import { ShadowingExercise, ShadowingResult } from '../types';
import {
  Headphones,
  Mic,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  CheckCircle,
  AlertCircle,
  Award,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { playNativeSpeech, SpeechRecognitionController, AudioRecorderManager } from '../utils/audioEngine';
import confetti from 'canvas-confetti';

export const ShadowingStudioView: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<ShadowingExercise>(SHADOWING_EXERCISES[0]);
  const [isPlayingModel, setIsPlayingModel] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<ShadowingResult | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionController | null>(null);
  const recorderManagerRef = useRef<AudioRecorderManager | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    recognitionRef.current = new SpeechRecognitionController((text) => {
      setUserTranscript(text);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Play reference model audio
  const handlePlayModel = async () => {
    if (isPlayingModel) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlayingModel(false);
      return;
    }

    setIsPlayingModel(true);
    await playNativeSpeech(selectedExercise.sentenceEn, {
      onEnd: () => setIsPlayingModel(false),
      onError: () => setIsPlayingModel(false),
    });
  };

  // Start user recording
  const handleStartShadowing = async () => {
    setMicError(null);
    setInlineNotice(null);
    setUserTranscript('');
    setRecordingSeconds(0);
    setResult(null);

    recorderManagerRef.current = new AudioRecorderManager();
    const startRes = await recorderManagerRef.current.startRecording();
    if (startRes.success) {
      setIsRecording(true);
      recognitionRef.current?.start();

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setMicError(
        startRes.errorType === 'permission_denied'
          ? 'Microphone chưa được cấp quyền trong trình duyệt. Bạn có thể cấp quyền hoặc bấm nút "Thử nghiệm mẫu giọng" bên dưới để kiểm tra thuật toán chấm điểm.'
          : startRes.errorMessage || 'Không thể mở microphone.'
      );
    }
  };

  // Handle sample test phrase for shadowing without mic
  const handleTestShadowingSample = () => {
    setMicError(null);
    setInlineNotice(null);
    const sample = selectedExercise.sentenceEn;
    setUserTranscript(sample);
    setRecordingSeconds(Math.round(selectedExercise.audioDurationSeconds));
    triggerShadowingAnalysis(sample, Math.round(selectedExercise.audioDurationSeconds));
  };

  // Stop recording & trigger AI analysis
  const handleStopShadowing = async () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const finalRecognized = recognitionRef.current?.stop() || '';
    if (finalRecognized) {
      setUserTranscript(finalRecognized);
    }

    if (recorderManagerRef.current) {
      await recorderManagerRef.current.stopRecording();
    }

    // Auto analyze
    triggerShadowingAnalysis(finalRecognized || userTranscript, Math.max(3, recordingSeconds));
  };

  const triggerShadowingAnalysis = async (transcript: string, duration: number) => {
    if (!transcript.trim()) {
      setInlineNotice('Chưa nhận diện được giọng nói của bạn. Hãy nói to, rõ ràng hơn hoặc bấm "Thử nghiệm mẫu giọng".');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-shadowing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSentence: selectedExercise.sentenceEn,
          userTranscript: transcript,
          userDurationSeconds: duration,
          expectedDurationSeconds: selectedExercise.audioDurationSeconds,
        }),
      });

      if (response.ok) {
        const data: ShadowingResult = await response.json();
        setResult(data);
        if (data.overallScore >= 80) {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        }
      } else {
        setInlineNotice('Không thể kết nối máy chủ phân tích Shadowing lúc này.');
      }
    } catch (e) {
      console.error('Shadowing analysis error:', e);
      setInlineNotice('Lỗi kết nối khi gửi dữ liệu phân tích.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectExercise = (ex: ShadowingExercise) => {
    setSelectedExercise(ex);
    setResult(null);
    setUserTranscript('');
    setRecordingSeconds(0);
    setInlineNotice(null);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header (Light Theme) */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-indigo-50 border border-sky-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-sky-600" /> Shadowing Studio
              </span>
              <span className="text-xs text-slate-500">• Luyện Nhại Giọng Chuẩn Bản Xứ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Kỹ Thuật Shadowing Đột Phá
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
              Nghe câu mẫu, nhại lại nhịp điệu, ngữ điệu và nối âm của người bản xứ. AI sẽ so sánh sóng âm
              và từng từ phát âm để chấm điểm độ chuẩn xác.
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Exercise List */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>Danh Sách Câu Luyện Tập</span>
          </h3>

          <div className="space-y-2">
            {SHADOWING_EXERCISES.map((ex) => {
              const isSelected = ex.id === selectedExercise.id;
              return (
                <div
                  key={ex.id}
                  onClick={() => handleSelectExercise(ex)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 border-sky-400 shadow-xs ring-1 ring-sky-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-sky-700">{ex.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {ex.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 line-clamp-2 font-medium">{ex.sentenceEn}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Shadowing Deck */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                {selectedExercise.category}
              </span>
              <span className="text-xs text-slate-500">Thời lượng chuẩn: ~{selectedExercise.audioDurationSeconds}s</span>
            </div>

            {/* Model Target Sentence */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <p className="text-xl sm:text-2xl font-black text-slate-900 leading-relaxed font-sans">
                "{selectedExercise.sentenceEn}"
              </p>

              <p className="text-xs sm:text-sm text-sky-800 font-medium italic">
                "{selectedExercise.meaningVi}"
              </p>

              <p className="font-mono text-xs text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 inline-block font-semibold">
                IPA: {selectedExercise.phoneticIpa}
              </p>

              <div className="pt-2 text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                💡 <strong>Điểm cần chú ý:</strong> {selectedExercise.focusPointVi}
              </div>
            </div>

            {/* Model Listen Controller */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={handlePlayModel}
                className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-sm shadow-sky-600/25 transition cursor-pointer flex items-center space-x-2"
              >
                {isPlayingModel ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{isPlayingModel ? 'Đang phát...' : 'Nghe Câu Mẫu (Bản Xứ)'}</span>
              </button>
            </div>

            {/* Shadowing Recording Area */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <div className="text-sm font-bold text-slate-800 mb-3">
                Lượt Của Bạn: Nhại lại câu trên
              </div>

              {inlineNotice && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium max-w-lg mx-auto">
                  {inlineNotice}
                </div>
              )}

              {micError && (
                <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 max-w-lg mx-auto">
                  <span>{micError}</span>
                  <button
                    onClick={handleTestShadowingSample}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                  >
                    Thử mẫu nhại giọng
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                {!isRecording ? (
                  <>
                    <button
                      onClick={handleStartShadowing}
                      disabled={isAnalyzing}
                      className="flex items-center space-x-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-rose-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                      <Mic className="w-5 h-5" />
                      <span>Bắt Đầu Shadowing Ngay</span>
                    </button>
                    <button
                      onClick={handleTestShadowingSample}
                      disabled={isAnalyzing}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
                    >
                      Thử nghiệm mẫu giọng
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleStopShadowing}
                    className="flex items-center space-x-2 px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/30 animate-pulse transition cursor-pointer"
                  >
                    <span>Dừng & Chấm Điểm ({recordingSeconds}s)</span>
                  </button>
                )}
              </div>

              {/* User transcript preview */}
              {userTranscript && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 max-w-lg mx-auto text-left shadow-xs">
                  <span className="font-bold text-slate-500">Giọng nói nhận diện:</span> "{userTranscript}"
                </div>
              )}

              {isAnalyzing && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-indigo-700 text-xs font-medium">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>AI đang phân tích độ đồng điệu nhịp điệu và phát âm...</span>
                </div>
              )}
            </div>
          </div>

          {/* Shadowing Results Card */}
          {result && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-sky-50 border border-sky-300 shadow-xs">
                    <span className="text-3xl font-black text-sky-700">{result.overallScore}%</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Độ Khớp</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Kết Quả Shadowing</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{result.feedbackVi}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="px-3 py-2 rounded-xl bg-slate-50 text-center border border-slate-200 min-w-[75px]">
                    <p className="text-[10px] text-slate-500 font-medium">Nhịp Điệu</p>
                    <p className="text-base font-bold text-emerald-700">{result.rhythmScore}%</p>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-slate-50 text-center border border-slate-200 min-w-[75px]">
                    <p className="text-[10px] text-slate-500 font-medium">Phát Âm</p>
                    <p className="text-base font-bold text-indigo-700">{result.pronunciationScore}%</p>
                  </div>
                </div>
              </div>

              {/* Word-by-word visual breakdown */}
              <div>
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Đánh giá chi tiết từng từ:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {result.wordBreakdown.map((wb, i) => {
                    const isPerfect = wb.status === 'perfect';
                    const isAcceptable = wb.status === 'acceptable';
                    const isDistorted = wb.status === 'distorted';

                    return (
                      <span
                        key={i}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                          isPerfect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : isAcceptable
                            ? 'bg-sky-50 border-sky-300 text-sky-800'
                            : isDistorted
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-rose-50 border-rose-300 text-rose-800 line-through'
                        }`}
                        title={wb.noteVi || wb.ipa || wb.status}
                      >
                        {wb.word}
                        {wb.ipa && <span className="ml-1 text-[10px] opacity-75">({wb.ipa})</span>}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Connected speech & Stress advice */}
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs sm:text-sm text-indigo-950">
                <strong className="text-indigo-800 font-bold">Lời khuyên về nối âm và ngữ điệu: </strong>
                {result.stressAndLinkingAdviceVi}
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={handleStartShadowing}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Thử lại câu này để nâng điểm
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
