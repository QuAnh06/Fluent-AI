import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { FluencyTimelineSegment } from '../types';
import { ensureFluencyTimeline } from '../utils/fluencyTimeline';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  RotateCcw,
  CheckCircle2,
  Info,
  Layers,
  Zap,
} from 'lucide-react';

interface FluencyHeatmapViewProps {
  transcript: string;
  durationSeconds: number;
  hesitationsCount: number;
  fillerWords: string[];
  wpm: number;
  fluencyScore: number;
  paceStatus: string;
  providedSegments?: FluencyTimelineSegment[];
}

export const FluencyHeatmapView: React.FC<FluencyHeatmapViewProps> = ({
  transcript,
  durationSeconds,
  hesitationsCount,
  fillerWords,
  wpm,
  fluencyScore,
  paceStatus,
  providedSegments,
}) => {
  const { segments, longestPauseSec, totalPauseTimeSec, smoothPercentage } = ensureFluencyTimeline(
    transcript,
    durationSeconds,
    hesitationsCount,
    fillerWords,
    providedSegments
  );

  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    segments.length > 0 ? segments[0].id : null
  );

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId) || segments[0];

  const chartData = segments.map((seg) => ({
    id: seg.id,
    time: seg.timeLabel,
    timeSec: seg.timeStartSec,
    score: seg.flowScore,
    pauseSec: seg.pauseDurationSec,
    wpm: seg.wpm,
    phrase: seg.phrase,
    status: seg.status,
    detectedItem: seg.detectedItem,
    noteVi: seg.noteVi,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'repetition':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'hesitation':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'filler':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'smooth':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  const getStatusLabelVi = (status: string) => {
    switch (status) {
      case 'repetition':
        return 'Lặp từ (Repetition)';
      case 'hesitation':
        return 'Ngập ngừng / Dừng dài';
      case 'filler':
        return 'Từ chêm (Filler word)';
      case 'smooth':
      default:
        return 'Trôi chảy, tự nhiên';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xl text-xs max-w-xs space-y-1.5 z-50 text-slate-900">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
            <span className="font-mono font-bold text-indigo-700">Thời điểm {data.time}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                data.status === 'smooth'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : data.status === 'repetition'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : data.status === 'filler'
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {getStatusLabelVi(data.status)}
            </span>
          </div>

          <p className="text-slate-800 font-medium italic">"{data.phrase}"</p>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
            <div>
              <span>Độ liền mạch: </span>
              <strong className="text-slate-900 font-bold">{data.score}/100</strong>
            </div>
            <div>
              <span>Khoảng dừng: </span>
              <strong className="text-amber-700 font-bold">{data.pauseSec}s</strong>
            </div>
          </div>

          <p className="text-slate-700 text-[11px] pt-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
            💡 {data.noteVi}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Timeline Fluency Heatmap
            </span>
            <span className="text-xs text-slate-500">• Bản Đồ Nhiệt Độ Trôi Chảy Theo Giây</span>
          </div>
          <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
            Phân Tích Ngắt Nghỉ & Lặp Từ Theo Dòng Thời Gian
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Biểu đồ trực quan hóa diễn biến độ liền mạch trong suốt {durationSeconds} giây nói. Giúp bạn nhìn thấy
            chính xác giây phút nào bị "khựng lại", lặp từ hoặc dùng từ chêm.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Liền mạch
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Ngập ngừng &gt;1.2s
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> Từ chêm ("um/uh")
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Lặp từ
          </span>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 text-center shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Tỷ Lệ Liền Mạch</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-0.5">{smoothPercentage}%</p>
          <p className="text-[11px] text-slate-500 mt-1">Đạt chuẩn tự nhiên</p>
        </div>

        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 text-center shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Khoảng Dừng Lớn Nhất</p>
          <p className="text-2xl sm:text-3xl font-black text-amber-700 mt-0.5">{longestPauseSec}s</p>
          <p className="text-[11px] text-slate-500 mt-1">Cần giảm xuống &lt;1.0s</p>
        </div>

        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 text-center shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Tổng Thời Gian Khựng</p>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-0.5">{totalPauseTimeSec}s</p>
          <p className="text-[11px] text-slate-500 mt-1">Chiếm {Math.round((totalPauseTimeSec / Math.max(1, durationSeconds)) * 100)}% bài nói</p>
        </div>

        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 text-center shadow-xs">
          <p className="text-xs text-slate-500 font-semibold">Tốc Độ Bình Quân</p>
          <p className="text-2xl sm:text-3xl font-black text-sky-700 mt-0.5">{wpm}</p>
          <p className="text-[11px] text-slate-500 mt-1">{paceStatus}</p>
        </div>
      </div>

      {/* Recharts Timeline Area & Bar Chart */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-sky-600" /> Đường Sóng Nhịp Điệu (Fluency Rhythm Flow)
          </span>
          <span className="text-slate-500">Đường đứt nét xanh: Ngưỡng tự nhiên (Band 7.0+)</span>
        </div>

        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length) {
                  setSelectedSegmentId(e.activePayload[0].payload.id);
                }
              }}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fluencyFlowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="pauseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.4} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />

              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine y={75} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Band 7.0+ Target', fill: '#059669', fontSize: 10, position: 'insideTopRight' }} />

              <Area
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#fluencyFlowGradient)"
                name="Điểm nhịp điệu"
              />

              <Bar
                dataKey="pauseSec"
                barSize={12}
                fill="url(#pauseGradient)"
                radius={[4, 4, 0, 0]}
                name="Khoảng ngắt nghỉ (giây)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap Strip Timeline */}
        <div className="space-y-1.5 pt-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Thanh Bản Đồ Nhiệt (Click vào từng khối để xem phân tích chi tiết giây đó):
          </p>

          <div className="flex h-7 rounded-xl overflow-hidden border border-slate-300 p-0.5 bg-slate-200 gap-0.5">
            {segments.map((seg) => {
              const isSelected = seg.id === selectedSegmentId;
              let bgClass = 'bg-emerald-500 hover:bg-emerald-600';
              if (seg.status === 'repetition') bgClass = 'bg-rose-500 hover:bg-rose-600';
              else if (seg.status === 'filler') bgClass = 'bg-orange-500 hover:bg-orange-600';
              else if (seg.status === 'hesitation') bgClass = 'bg-amber-500 hover:bg-amber-600';

              return (
                <button
                  key={seg.id}
                  onClick={() => setSelectedSegmentId(seg.id)}
                  className={`flex-1 h-full rounded-md transition-all cursor-pointer relative ${bgClass} ${
                    isSelected ? 'ring-2 ring-indigo-600 scale-105 z-10' : 'opacity-90'
                  }`}
                  title={`${seg.timeLabel}: ${seg.phrase} (${seg.pauseDurationSec}s pause)`}
                />
              );
            })}
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
            <span>0:00</span>
            <span>{Math.floor(durationSeconds / 2)}s</span>
            <span>{Math.floor(durationSeconds / 60)}:{(durationSeconds % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* Synchronized Detail Card for Selected Moment */}
      {selectedSegment && (
        <div className="bg-slate-50/80 border border-indigo-200 rounded-2xl p-5 sm:p-6 space-y-3 relative shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-mono text-xs font-bold border border-indigo-200">
                Thời Điểm {selectedSegment.timeLabel} ({selectedSegment.timeStartSec}s - {selectedSegment.timeEndSec}s)
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                  selectedSegment.status
                )}`}
              >
                {getStatusLabelVi(selectedSegment.status)}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-600">
                Khoảng dừng: <strong className="text-amber-700 font-bold">{selectedSegment.pauseDurationSec}s</strong>
              </span>
              <span className="text-slate-600">
                Tốc độ cụm: <strong className="text-sky-700 font-bold">{selectedSegment.wpm} WPM</strong>
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Câu bạn đã nói ở giây này:
            </p>
            <p className="text-base sm:text-lg font-bold text-slate-900 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed font-sans shadow-xs">
              "{selectedSegment.phrase}"
            </p>
          </div>

          {selectedSegment.detectedItem && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                <strong>Vấn đề phát hiện: </strong>
                {selectedSegment.status === 'repetition'
                  ? `Lặp lại từ ngữ: "${selectedSegment.detectedItem}"`
                  : `Dùng từ chêm gây gián đoạn: "${selectedSegment.detectedItem}"`}
              </span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-700 shadow-xs">
            <p className="text-indigo-700 font-bold mb-1 flex items-center gap-1.5">
              <Info className="w-4 h-4" /> Đánh Giá & Cách Khắc Phục Cụm Này:
            </p>
            <p>{selectedSegment.noteVi}</p>
          </div>
        </div>
      )}

      {/* Interactive Transcript Segment Flow */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-3">
        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" /> Toàn Bộ Lời Thoại Được Gắn Nhãn Theo Nhịp Dừng:
        </h5>

        <div className="flex flex-wrap gap-2 text-sm leading-relaxed">
          {segments.map((seg) => {
            const isSelected = seg.id === selectedSegmentId;
            let tagStyle = 'border-slate-200 text-slate-800 hover:border-slate-400 bg-white';
            if (seg.status === 'repetition') tagStyle = 'border-rose-200 text-rose-900 bg-rose-50';
            else if (seg.status === 'filler') tagStyle = 'border-orange-200 text-orange-900 bg-orange-50';
            else if (seg.status === 'hesitation') tagStyle = 'border-amber-200 text-amber-900 bg-amber-50';

            return (
              <span
                key={seg.id}
                onClick={() => setSelectedSegmentId(seg.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer text-xs sm:text-sm ${tagStyle} ${
                  isSelected ? 'ring-2 ring-indigo-600 shadow-sm scale-102 font-bold' : ''
                }`}
              >
                <span>{seg.phrase}</span>
                {seg.pauseDurationSec > 1.0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    ⏸ {seg.pauseDurationSec}s
                  </span>
                )}
                {seg.status === 'repetition' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                    Lặp
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
