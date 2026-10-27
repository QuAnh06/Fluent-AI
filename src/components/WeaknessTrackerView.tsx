import React, { useState } from 'react';
import { WeaknessProfileItem, TargetedDrill } from '../types';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  BookOpen,
  Mic,
  Volume2,
  X,
  RefreshCw,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WeaknessTrackerViewProps {
  weaknesses: WeaknessProfileItem[];
  onStartTargetedDrill: (question: string, topicTitle: string, weaknessKey: string) => void;
  onUpdateStatus: (weaknessKey: string, succeeded: boolean) => void;
}

export const WeaknessTrackerView: React.FC<WeaknessTrackerViewProps> = ({
  weaknesses,
  onStartTargetedDrill,
  onUpdateStatus,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeDrill, setActiveDrill] = useState<TargetedDrill | null>(null);
  const [isLoadingDrill, setIsLoadingDrill] = useState(false);
  const [drillErrorMessage, setDrillErrorMessage] = useState<string | null>(null);
  const [currentDrillWeakness, setCurrentDrillWeakness] = useState<WeaknessProfileItem | null>(null);

  // Filter weaknesses
  const filtered = weaknesses.filter((w) => {
    if (selectedCategory === 'all') return true;
    return w.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const needsFocusCount = weaknesses.filter((w) => w.masteryStatus === 'needs_focus').length;
  const improvingCount = weaknesses.filter((w) => w.masteryStatus === 'improving').length;
  const masteredCount = weaknesses.filter((w) => w.masteryStatus === 'mastered').length;

  // Generate targeted AI drill for a specific weakness
  const handleGenerateDrill = async (weakness: WeaknessProfileItem) => {
    setCurrentDrillWeakness(weakness);
    setIsLoadingDrill(true);
    setActiveDrill(null);
    setDrillErrorMessage(null);

    try {
      const response = await fetch('/api/generate-targeted-drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weaknessKey: weakness.key,
          weaknessTitle: weakness.titleVi,
          weaknessCategory: weakness.category,
        }),
      });

      if (response.ok) {
        const drillData = await response.json();
        setActiveDrill(drillData);
      } else {
        setDrillErrorMessage('Không thể tạo bài tập lúc này. Vui lòng thử lại sau giây lát.');
      }
    } catch (err) {
      console.error('Error generating targeted drill:', err);
      setDrillErrorMessage('Lỗi kết nối khi kết nối với máy chủ AI.');
    } finally {
      setIsLoadingDrill(false);
    }
  };

  const handleMarkMastered = (weaknessKey: string) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    onUpdateStatus(weaknessKey, true);
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner (Light Mode) */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-white to-violet-50/80 border border-indigo-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-rose-600" /> Tính Năng Độc Quyền
              </span>
              <span className="text-xs text-slate-500">• Cá Nhân Hóa Dựa Trên Lỗi Thực Tế</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Personal Weakness Tracker
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
              Thay vì chỉ nói chuyện bâng quơ với chatbot, hệ thống ghi nhận chính xác các lỗi bạn lặp lại
              nhiều lần (nhầm thì, nuốt âm đuôi, từ chêm) và tự động tạo bài tập "đánh trúng huyệt" để bạn khắc phục triệt để.
            </p>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-white border border-rose-200 rounded-2xl p-4 text-center min-w-[90px] shadow-xs">
              <span className="text-2xl font-black text-rose-600">{needsFocusCount}</span>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Cần chú ý</p>
            </div>
            <div className="bg-white border border-amber-200 rounded-2xl p-4 text-center min-w-[90px] shadow-xs">
              <span className="text-2xl font-black text-amber-600">{improvingCount}</span>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Đang tiến bộ</p>
            </div>
            <div className="bg-white border border-emerald-200 rounded-2xl p-4 text-center min-w-[90px] shadow-xs">
              <span className="text-2xl font-black text-emerald-600">{masteredCount}</span>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Đã làm chủ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs sm:text-sm">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shadow-xs ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Tất Cả ({weaknesses.length})
        </button>
        <button
          onClick={() => setSelectedCategory('grammar')}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shadow-xs ${
            selectedCategory === 'grammar'
              ? 'bg-violet-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Ngữ Pháp ({weaknesses.filter((w) => w.category === 'Grammar').length})
        </button>
        <button
          onClick={() => setSelectedCategory('pronunciation')}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shadow-xs ${
            selectedCategory === 'pronunciation'
              ? 'bg-rose-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Phát Âm & Âm Đuôi ({weaknesses.filter((w) => w.category === 'Pronunciation').length})
        </button>
        <button
          onClick={() => setSelectedCategory('fluency')}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shadow-xs ${
            selectedCategory === 'fluency'
              ? 'bg-sky-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Độ Trôi Chảy & Từ Chêm ({weaknesses.filter((w) => w.category === 'Fluency').length})
        </button>
        <button
          onClick={() => setSelectedCategory('vocabulary')}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shadow-xs ${
            selectedCategory === 'vocabulary'
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Từ Vựng ({weaknesses.filter((w) => w.category === 'Vocabulary').length})
        </button>
      </div>

      {/* Weakness Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((item) => {
          const isMastered = item.masteryStatus === 'mastered';
          const isImproving = item.masteryStatus === 'improving';

          return (
            <div
              key={item.id}
              className={`bg-white border rounded-3xl p-6 transition-all relative flex flex-col justify-between shadow-xs ${
                isMastered
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : isImproving
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200 hover:border-indigo-400'
              }`}
            >
              <div>
                {/* Header tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    {item.category === 'Grammar'
                      ? 'Ngữ Pháp'
                      : item.category === 'Pronunciation'
                      ? 'Phát Âm'
                      : item.category === 'Fluency'
                      ? 'Độ Trôi Chảy'
                      : 'Từ Vựng'}
                  </span>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      isMastered
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : isImproving
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {isMastered ? '✓ Đã Làm Chủ' : isImproving ? '⚡ Đang Tiến Bộ' : '⚠️ Cần Tập Trung'}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 mb-2 leading-snug">
                  {item.titleVi}
                </h3>

                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  {item.descriptionVi}
                </p>

                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 mb-4 leading-relaxed">
                  <strong className="text-amber-800 font-bold">💡 Mẹo Khắc Phục: </strong>
                  {item.actionableTipVi}
                </div>
              </div>

              {/* Bottom Actions */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200 mb-4">
                  <span>Phát hiện: <strong className="text-slate-800 font-bold">{item.occurrenceCount} lần</strong></span>
                  <span>Lần cuối: {item.lastEncountered}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateDrill(item)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Luyện Tập Lỗi Này Bằng AI</span>
                  </button>

                  {!isMastered && (
                    <button
                      onClick={() => handleMarkMastered(item.key)}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-emerald-700 font-bold text-xs transition cursor-pointer border border-slate-200"
                      title="Đánh dấu đã tiến bộ"
                    >
                      ✓ Đã sửa
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive AI Targeted Drill Modal */}
      {(isLoadingDrill || activeDrill || drillErrorMessage) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setActiveDrill(null);
                setIsLoadingDrill(false);
                setDrillErrorMessage(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {isLoadingDrill ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <h4 className="text-lg font-black text-slate-900">
                  AI Đang Soạn Bài Luyện Tập Đặc Biệt...
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Đang thiết kế các câu hỏi đòi hỏi bạn phải sử dụng chính xác cấu trúc để khắc phục lỗi "
                  {currentDrillWeakness?.titleVi}"
                </p>
              </div>
            ) : drillErrorMessage ? (
              <div className="text-center py-8 space-y-4">
                <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">{drillErrorMessage}</h4>
                <button
                  onClick={() => currentDrillWeakness && handleGenerateDrill(currentDrillWeakness)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700"
                >
                  Thử lại
                </button>
              </div>
            ) : activeDrill ? (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Targeted Speaking Drill
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                    {activeDrill.titleVi}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">{activeDrill.objectiveVi}</p>
                </div>

                {/* Rule Tip Cheat Sheet */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm leading-relaxed">
                  <strong className="text-amber-800 font-bold">💡 Ghi nhớ nhanh: </strong>
                  {activeDrill.ruleTipVi}
                </div>

                {/* Drill Questions */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800">
                    Chọn 1 trong các câu sau để bắt đầu luyện nói ngay:
                  </h4>

                  {activeDrill.questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:border-indigo-400 transition flex flex-col justify-between gap-3 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-indigo-700">Câu hỏi #{idx + 1}</span>
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                            Cấu trúc: {q.targetStructure}
                          </span>
                        </div>
                        <p className="text-base font-bold text-slate-900">{q.questionEn}</p>
                        <p className="text-xs text-slate-600 mt-0.5 italic">"{q.questionVi}"</p>

                        <p className="text-xs text-slate-700 mt-2 bg-white p-2.5 rounded-xl border border-slate-200">
                          🎯 <strong>Mở đầu mẫu:</strong> "{q.exampleOpening}"
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          onStartTargetedDrill(
                            q.questionEn,
                            `Khắc phục: ${currentDrillWeakness?.titleVi || 'Weakness Drill'}`,
                            currentDrillWeakness?.key || ''
                          );
                          setActiveDrill(null);
                        }}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Luyện Nói Câu Này Ngay</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 text-center font-medium">
                  ⚡ <strong>Thử thách nhỏ:</strong> {activeDrill.quickChallengeVi}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
