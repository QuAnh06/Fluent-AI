import React from 'react';
import { DailyChallenge } from '../types';
import { Flame, Calendar, Award, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface DailyChallengeViewProps {
  challenges: DailyChallenge[];
  streak: number;
  onStartChallenge: (challenge: DailyChallenge) => void;
}

export const DailyChallengeView: React.FC<DailyChallengeViewProps> = ({
  challenges,
  streak,
  onStartChallenge,
}) => {
  const todayChallenge = challenges[0];

  return (
    <div className="space-y-6">
      {/* Streak Banner (Light Theme) */}
      <div className="bg-gradient-to-r from-amber-50 via-white to-orange-50 border border-amber-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-5 text-center sm:text-left">
            <div className="flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-100 border-2 border-amber-300 shadow-xs">
              <Flame className="w-10 h-10 text-amber-500 animate-bounce" />
              <span className="text-xl font-black text-amber-900">{streak}</span>
            </div>
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Daily Speaking Streak
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Chuỗi {streak} Ngày Luyện Nói
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg leading-relaxed">
                Nói tiếng Anh ít nhất 2 phút mỗi ngày là chìa khóa vàng để phá vỡ sự ngập ngừng và tạo phản xạ vô điều kiện.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const isPast = day <= streak;
              return (
                <div
                  key={day}
                  className={`w-9 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition ${
                    isPast
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  <span>D{day}</span>
                  {isPast ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5" /> : <span className="text-[10px] mt-0.5">•</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Today's Featured Challenge */}
      {todayChallenge && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Thử Thách Hôm Nay
              </span>
              <span className="text-xs text-slate-500 font-medium">• {todayChallenge.dateStr}</span>
            </div>

            {todayChallenge.completed && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã hoàn thành (Điểm: {todayChallenge.score || 85}/100)
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              {todayChallenge.title}
            </h3>
            <p className="text-lg text-indigo-700 font-bold mt-2">
              "{todayChallenge.prompt}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs sm:text-sm text-slate-800">
              <p className="font-bold text-sky-800 mb-1 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-sky-600" /> Yêu Cầu Nhiệm Vụ:
              </p>
              <p>{todayChallenge.missionVi}</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-slate-800">
              <p className="font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" /> Ràng Buộc & Tiêu Chuẩn:
              </p>
              <p>{todayChallenge.ruleConstraintVi}</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onStartChallenge(todayChallenge)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>{todayChallenge.completed ? 'Luyện Lại Để Cải Thiện Điểm' : 'Bắt Đầu Thực Hiện Thử Thách'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Daily Challenges */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          Thử Thách Các Ngày Tiếp Theo
        </h4>

        <div className="space-y-3">
          {challenges.slice(1).map((ch) => (
            <div
              key={ch.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            >
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold text-slate-500">{ch.dateStr}</span>
                  <span className="text-xs font-bold text-slate-900">• {ch.title}</span>
                </div>
                <p className="text-xs text-slate-700 font-medium">"{ch.prompt}"</p>
              </div>

              <button
                onClick={() => onStartChallenge(ch)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition self-start sm:self-auto cursor-pointer shadow-xs"
              >
                Luyện Trước
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
