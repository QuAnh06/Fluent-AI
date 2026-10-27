import React, { useState } from 'react';
import { SpeechAnalysisResult } from '../types';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Headphones,
  Check,
  TrendingUp,
  Flame,
  MessageSquare,
} from 'lucide-react';
import { playNativeSpeech } from '../utils/audioEngine';
import { FluencyHeatmapView } from './FluencyHeatmapView';

interface AnalysisResultViewProps {
  result: SpeechAnalysisResult;
  question: string;
  transcript: string;
  durationSeconds?: number;
  onRetry: () => void;
  onGoToWeaknessTracker: () => void;
  attemptNumber?: number;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  result,
  question,
  transcript,
  durationSeconds = 20,
  onRetry,
  onGoToWeaknessTracker,
  attemptNumber = 1,
}) => {
  const [activeTab, setActiveTab] = useState<'grammar' | 'vocab' | 'pron' | 'fluency' | 'models' | 'retry'>('fluency');
  const [playingAudioKey, setPlayingAudioKey] = useState<string | null>(null);
  const [modelType, setModelType] = useState<'conversational' | 'advanced'>('conversational');

  // Handle TTS audio playback
  const handlePlayAudio = async (key: string, textToSpeak: string) => {
    if (playingAudioKey === key) {
      setPlayingAudioKey(null);
      return;
    }

    setPlayingAudioKey(key);
    await playNativeSpeech(textToSpeak, {
      onEnd: () => setPlayingAudioKey(null),
      onError: () => setPlayingAudioKey(null),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Main Score Card (Light Theme) */}
      <div className="bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/60 border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left: Overall Band & CEFR */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
            <div className="relative flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white border-2 border-indigo-200 shadow-sm shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">IELTS Band</span>
              <span className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600">
                {result.ieltsBand.toFixed(1)}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 mt-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                CEFR {result.cefrLevel}
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Điểm tổng quát: {result.overallScore}/100
                </span>
                {attemptNumber > 1 && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Lần thử #{attemptNumber}
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Kết Quả Chẩn Đoán Bài Nói Của Bạn
              </h3>
              <p className="text-slate-600 text-sm mt-1 max-w-xl leading-relaxed font-normal">
                {result.summaryVi}
              </p>
            </div>
          </div>

          {/* Right: Sub-scores Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            <button
              onClick={() => setActiveTab('fluency')}
              className={`border rounded-2xl p-3.5 text-center transition cursor-pointer ${
                activeTab === 'fluency'
                  ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/30'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-xs text-sky-700 font-semibold">
                <span>Trôi Chảy</span>
                <Sparkles className="w-3 h-3 text-sky-600" />
              </div>
              <p className="text-2xl font-black text-sky-700 mt-0.5">{result.fluency.score}</p>
              <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-center gap-1">
                <span>{result.fluency.wpm} WPM</span>
                <span className="text-sky-600 font-bold">• Heatmap</span>
              </p>
            </button>

            <button
              onClick={() => setActiveTab('grammar')}
              className={`border rounded-2xl p-3.5 text-center transition cursor-pointer ${
                activeTab === 'grammar'
                  ? 'bg-violet-50 border-violet-400 ring-2 ring-violet-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-violet-300 hover:bg-violet-50/30'
              }`}
            >
              <p className="text-xs text-violet-700 font-semibold">Ngữ Pháp</p>
              <p className="text-2xl font-black text-violet-700 mt-0.5">{result.grammar.score}</p>
              <p className="text-[11px] text-slate-500 mt-1">{result.grammar.errors.length} lỗi cần sửa</p>
            </button>

            <button
              onClick={() => setActiveTab('vocab')}
              className={`border rounded-2xl p-3.5 text-center transition cursor-pointer ${
                activeTab === 'vocab'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              <p className="text-xs text-emerald-700 font-semibold">Từ Vựng</p>
              <p className="text-2xl font-black text-emerald-700 mt-0.5">{result.vocabulary.score}</p>
              <p className="text-[11px] text-slate-500 mt-1">{result.vocabulary.upgrades.length} nâng cấp</p>
            </button>

            <button
              onClick={() => setActiveTab('pron')}
              className={`border rounded-2xl p-3.5 text-center transition cursor-pointer ${
                activeTab === 'pron'
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/30'
              }`}
            >
              <p className="text-xs text-rose-700 font-semibold">Phát Âm</p>
              <p className="text-2xl font-black text-rose-700 mt-0.5">{result.pronunciation.score}</p>
              <p className="text-[11px] text-slate-500 mt-1">{result.pronunciation.flaggedWords.length} từ cần nắn</p>
            </button>
          </div>
        </div>

        {/* Weakness Alert Bar if new weaknesses detected */}
        {result.weaknessesToTrack && result.weaknessesToTrack.length > 0 && (
          <div className="relative z-10 mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-50/80 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center space-x-3 text-xs sm:text-sm text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>Cảnh báo điểm yếu cần khắc phục: </strong>
                {result.weaknessesToTrack.map((w) => w.titleVi).join(' • ')}
              </span>
            </div>
            <button
              onClick={onGoToWeaknessTracker}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline underline-offset-4 flex items-center gap-1 shrink-0 cursor-pointer"
            >
              Xem Hồ Sơ Điểm Yếu <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Deep-dive Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('fluency')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'fluency'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-sky-200" />
          <span>Timeline Fluency Heatmap 🔥</span>
        </button>

        <button
          onClick={() => setActiveTab('grammar')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'grammar'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-violet-200" />
          <span>Sửa Lỗi Ngữ Pháp ({result.grammar.errors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'vocab'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-200" />
          <span>Nâng Cấp Từ Vựng ({result.vocabulary.upgrades.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pron')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'pron'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Volume2 className="w-4 h-4 text-rose-200" />
          <span>Phát Âm & Ngữ Điệu ({result.pronunciation.flaggedWords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'models'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-200" />
          <span>Bản Mẫu Chuẩn Bản Xứ</span>
        </button>

        <button
          onClick={() => setActiveTab('retry')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'retry'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-amber-200" />
          <span>Luyện Lại Bài Này</span>
        </button>
      </div>

      {/* Tab 1: Fluency Timeline Heatmap */}
      {activeTab === 'fluency' && (
        <FluencyHeatmapView
          transcript={transcript}
          durationSeconds={durationSeconds}
          hesitationsCount={result.fluency.hesitationsCount}
          fillerWords={result.fluency.fillerWords}
          wpm={result.fluency.wpm}
          fluencyScore={result.fluency.score}
          paceStatus={result.fluency.paceStatus}
          providedSegments={result.fluency.timelineSegments}
        />
      )}

      {/* Tab 2: Grammar Errors */}
      {activeTab === 'grammar' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Chi Tiết Lỗi Ngữ Pháp & Cách Sửa Chuẩn</span>
            </h4>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              Điểm ngữ pháp: {result.grammar.score}/100
            </span>
          </div>

          <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed">
            {result.grammar.feedbackVi}
          </p>

          {result.grammar.errors.length === 0 ? (
            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center">
              <CheckCircle2 className="w-9 h-9 mx-auto mb-2 text-emerald-600" />
              <p className="font-bold text-base">Tuyệt vời! Không phát hiện lỗi ngữ pháp nghiêm trọng nào trong bài nói.</p>
              <p className="text-xs text-emerald-700 mt-1">Cấu trúc câu của bạn rất tự nhiên và chính xác.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.grammar.errors.map((err, i) => (
                <div
                  key={i}
                  className="bg-slate-50/60 border border-slate-200 rounded-2xl p-5 hover:border-violet-300 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-200">
                      {err.ruleCategory}
                    </span>
                    <span
                      className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        err.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      Mức độ: {err.severity === 'critical' ? 'Nghiêm trọng' : 'Cần lưu ý'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm">
                      <p className="text-xs text-rose-700 font-bold mb-1">Câu bạn đã nói (Có lỗi):</p>
                      <p className="text-rose-900 line-through decoration-rose-500 font-medium">{err.original}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
                      <p className="text-xs text-emerald-700 font-bold mb-1">Cách nói đúng chuẩn bản xứ:</p>
                      <p className="text-emerald-900 font-semibold">{err.correction}</p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200">
                    💡 <strong>Giải thích ngữ pháp:</strong> {err.explanationVi}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Vocabulary Upgrades */}
      {activeTab === 'vocab' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-slate-900">
              Nâng Cấp Từ Vựng & Collocations Band 7.5+
            </h4>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Điểm từ vựng: {result.vocabulary.score}/100
            </span>
          </div>

          <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed">
            {result.vocabulary.feedbackVi}
          </p>

          {result.vocabulary.repeatedWords.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <strong>Từ bạn đã lặp lại nhiều lần:</strong>{' '}
              {result.vocabulary.repeatedWords.join(', ')}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.vocabulary.upgrades.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50/60 border border-slate-200 rounded-2xl p-5 hover:border-emerald-400 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500 font-medium">Thay vì nói từ cơ bản:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs line-through font-medium">
                    "{item.basicWord}"
                  </span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-black text-emerald-700">
                    {item.advancedAlternative}
                  </span>
                  <button
                    onClick={() => handlePlayAudio(`up_${idx}`, item.advancedAlternative)}
                    className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition cursor-pointer"
                    title="Nghe phát âm từ này"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <p>
                    <strong className="text-slate-600">Cụm từ tự nhiên (Collocation):</strong>{' '}
                    <span className="text-indigo-700 font-bold">{item.collocation}</span>
                  </p>
                  <p className="p-3 rounded-xl bg-white border border-slate-200 italic text-slate-800">
                    "{item.contextExample}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Pronunciation & Acoustics */}
      {activeTab === 'pron' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-slate-900">
              Phân Tích Phát Âm, Trọng Âm & Âm Đuôi
            </h4>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Điểm phát âm: {result.pronunciation.score}/100
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 text-sm text-indigo-950 leading-relaxed">
            <strong className="text-indigo-800">Nhận xét về Ngữ điệu & Nhịp điệu: </strong>
            {result.pronunciation.intonationFeedbackVi}
          </div>

          <div className="space-y-4">
            <h5 className="text-sm font-bold text-slate-800">
              Các từ người Việt thường phát âm sai hoặc nuốt âm trong bài nói này:
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.pronunciation.flaggedWords.map((wordItem, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/60 border border-slate-200 rounded-2xl p-5 hover:border-rose-400 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-black text-slate-900">{wordItem.word}</span>
                      <span className="font-mono text-sm text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-md border border-rose-200">
                        {wordItem.ipa}
                      </span>
                    </div>

                    <button
                      onClick={() => handlePlayAudio(`pron_${idx}`, wordItem.word)}
                      className="p-2 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition cursor-pointer"
                      title="Nghe phát âm chuẩn bản xứ"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs space-y-2 mt-2">
                    <p className="text-amber-800 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200">
                      ⚠️ Lỗi thường gặp: {wordItem.problemArea}
                    </p>
                    <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                      👄 <strong>Khẩu hình chuẩn:</strong> {wordItem.guideVi}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Native Model Answers */}
      {activeTab === 'models' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-bold text-slate-900">
                Bản Mẫu Chuẩn Bản Xứ Cho Câu Hỏi Này
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Nghe người bản xứ phát âm và học cấu trúc câu tự nhiên
              </p>
            </div>

            {/* Toggle Model Type */}
            <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 self-start sm:self-auto text-xs">
              <button
                onClick={() => setModelType('conversational')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  modelType === 'conversational'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Giao Tiếp Tự Nhiên (Band 7.0)
              </button>
              <button
                onClick={() => setModelType('advanced')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  modelType === 'advanced'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                IELTS Chuyên Sâu (Band 8.5)
              </button>
            </div>
          </div>

          {/* Selected Model Card */}
          {(() => {
            const currentModel =
              modelType === 'conversational'
                ? result.improvedVersions.conversational
                : result.improvedVersions.advanced;

            return (
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {currentModel.band}
                  </span>
                  <button
                    onClick={() => handlePlayAudio(`model_${modelType}`, currentModel.text)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{playingAudioKey === `model_${modelType}` ? 'Đang phát...' : 'Nghe giọng bản xứ (TTS)'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-900 text-base leading-relaxed font-sans shadow-xs">
                  "{currentModel.text}"
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Bản dịch tiếng Việt:
                  </p>
                  <p className="italic leading-relaxed">"{currentModel.vietnameseMeaning}"</p>
                </div>

                <div>
                  <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Điểm sáng ngôn ngữ cần học hỏi:
                  </h6>
                  <div className="flex flex-wrap gap-2">
                    {currentModel.keyHighlights.map((hl, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold"
                      >
                        ✓ {hl}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 6: Retry Drill */}
      {activeTab === 'retry' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              <span>Nói Lại Bài Này Để Khắc Phục Ngay Lỗi Lớn Nhất</span>
            </h4>
          </div>

          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
            <div className="text-amber-800 font-bold text-sm">
              🎯 Mục tiêu trọng tâm của lần thử này:
            </div>
            <p className="text-slate-900 text-base font-bold">
              {result.retryDrill.focusPointVi}
            </p>
            <p className="text-amber-950 text-sm leading-relaxed">
              {result.retryDrill.challengeTextVi}
            </p>
            <div className="p-3.5 rounded-xl bg-white border border-amber-200 text-xs text-amber-900">
              💡 Cụm từ gợi ý áp dụng ngay: <strong className="text-amber-950 font-bold">"{result.retryDrill.targetPhraseToUse}"</strong>
            </div>
          </div>

          <div className="flex items-center justify-center pt-2">
            <button
              onClick={onRetry}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-black text-base shadow-md shadow-amber-500/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Bật Mic Nói Lại Lần #{attemptNumber + 1} Ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="text-xs text-slate-600 text-center sm:text-left">
          Luyện nói lại ngay khi vừa nhìn thấy lỗi giúp não bộ ghi nhớ phát âm và cấu trúc nhanh gấp 3 lần.
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={onRetry}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Nói Lại Lần #{attemptNumber + 1}</span>
          </button>

          <button
            onClick={onGoToWeaknessTracker}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <span>Hồ Sơ Điểm Yếu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
