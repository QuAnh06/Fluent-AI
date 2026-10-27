import React, { useState } from 'react';
import { SpeakingHistoryRecord } from '../types';
import {
  BarChart3,
  Calendar,
  Volume2,
  Award,
  Trash2,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface ProgressHistoryViewProps {
  history: SpeakingHistoryRecord[];
  onSelectRecord: (record: SpeakingHistoryRecord) => void;
  onClearHistory: () => void;
}

export const ProgressHistoryView: React.FC<ProgressHistoryViewProps> = ({
  history,
  onSelectRecord,
  onClearHistory,
}) => {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);

  // Calculate high-level stats
  const totalRecordings = history.length;
  const avgBand = totalRecordings > 0
    ? (history.reduce((sum, h) => sum + h.analysis.ieltsBand, 0) / totalRecordings).toFixed(1)
    : '6.5';
  const highestBand = totalRecordings > 0
    ? Math.max(...history.map((h) => h.analysis.ieltsBand)).toFixed(1)
    : '7.5';
  const avgFluency = totalRecordings > 0
    ? Math.round(history.reduce((sum, h) => sum + h.analysis.fluency.score, 0) / totalRecordings)
    : 78;

  const handlePlayAudio = (id: string, audioUrl?: string) => {
    setAudioNotice(null);
    if (!audioUrl) {
      setAudioNotice('Không tìm thấy tệp ghi âm giọng nói đính kèm cho bản ghi này.');
      return;
    }

    if (playingAudioId === id) {
      setPlayingAudioId(null);
      return;
    }

    setPlayingAudioId(id);
    const audio = new Audio(audioUrl);
    audio.onended = () => setPlayingAudioId(null);
    audio.onerror = () => {
      setPlayingAudioId(null);
      setAudioNotice('Tệp âm thanh tạm thời không khả dụng.');
    };
    audio.play();
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats (Light Theme) */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-sky-50 border border-emerald-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" /> Tiến Trình & Lịch Sử
              </span>
              <span className="text-xs text-slate-500">• So Sánh Các Bản Ghi Theo Thời Gian</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Biểu Đồ & Nhật Ký Luyện Nói
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl leading-relaxed">
              Theo dõi sự gia tăng điểm số IELTS Band, tốc độ nói (WPM) và mức độ loại bỏ từ chêm
              qua từng buổi luyện tập.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:w-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-xs">
              <p className="text-xs text-slate-500 font-semibold">Tổng Bài Nói</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{totalRecordings}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-xs">
              <p className="text-xs text-slate-500 font-semibold">Band Trung Bình</p>
              <p className="text-2xl font-black text-indigo-700 mt-0.5">{avgBand}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-xs">
              <p className="text-xs text-slate-500 font-semibold">Band Cao Nhất</p>
              <p className="text-2xl font-black text-emerald-700 mt-0.5">{highestBand}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-xs">
              <p className="text-xs text-slate-500 font-semibold">Độ Trôi Chảy TB</p>
              <p className="text-2xl font-black text-sky-700 mt-0.5">{avgFluency}</p>
            </div>
          </div>
        </div>
      </div>

      {audioNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>{audioNotice}</span>
          </div>
          <button
            onClick={() => setAudioNotice(null)}
            className="text-xs font-bold text-amber-800 hover:text-amber-950"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Recording History List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Danh Sách Các Bản Ghi Gần Đây</span>
            <span className="text-xs text-slate-500 font-normal">({totalRecordings} bản ghi)</span>
          </h3>

          {totalRecordings > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa lịch sử</span>
            </button>
          )}
        </div>

        {totalRecordings === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-3">
            <Clock className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
            <p className="text-sm font-semibold text-slate-700">Chưa có bài ghi âm nào được lưu lại.</p>
            <p className="text-xs text-slate-500">
              Hãy sang tab <strong>Phòng Luyện Nói</strong> và ghi âm bài nói đầu tiên của bạn!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record) => (
              <div
                key={record.id}
                className="bg-slate-50/70 border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Band {record.analysis.ieltsBand.toFixed(1)} • CEFR {record.analysis.cefrLevel}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">• {record.date}</span>
                    <span className="text-xs text-slate-500 font-medium">• {record.durationSeconds}s</span>
                    {record.attemptNumber > 1 && (
                      <span className="px-2 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                        Lần #{record.attemptNumber}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">
                    {record.question}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-2 italic font-normal">
                    "{record.transcript}"
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {record.audioUrl && (
                    <button
                      onClick={() => handlePlayAudio(record.id, record.audioUrl)}
                      className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-700 border border-slate-200 transition cursor-pointer shadow-xs"
                      title="Nghe lại giọng nói của bạn"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onSelectRecord(record)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
                  >
                    <span>Xem Phân Tích</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
