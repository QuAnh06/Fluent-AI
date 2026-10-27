import React from 'react';
import { TabType } from '../types';
import { Mic, Target, Headphones, Calendar, BarChart3, Flame, Award, Volume2 } from 'lucide-react';

interface HeaderProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  streak: number;
  targetBand: number;
  onChangeTargetBand: (band: number) => void;
  activeWeaknessCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  streak,
  targetBand,
  onChangeTargetBand,
  activeWeaknessCount,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 text-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('practice')}>
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-sky-500 shadow-md shadow-indigo-500/20 ring-2 ring-indigo-100">
              <Mic className="w-6 h-6 text-white animate-pulse" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Fluent <span className="text-indigo-600 font-black">AI</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  IELTS & Speaking Coach
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Huấn luyện viên nói tiếng Anh thông minh & sửa lỗi phát âm
              </p>
            </div>
          </div>

          {/* Quick Metrics (Streak & Target Band) */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Daily Streak Pill */}
            <button
              onClick={() => onSelectTab('daily')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition cursor-pointer text-xs sm:text-sm font-semibold shadow-xs"
              title="Chuỗi ngày luyện nói liên tiếp"
            >
              <Flame className="w-4 h-4 text-amber-500 animate-bounce" />
              <span>{streak} ngày</span>
            </button>

            {/* Target Band selector */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-slate-500 hidden md:inline">Mục tiêu:</span>
              <select
                value={targetBand}
                onChange={(e) => onChangeTargetBand(parseFloat(e.target.value))}
                className="bg-transparent text-indigo-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="6.0" className="bg-white text-slate-900">Band 6.0 (B2)</option>
                <option value="6.5" className="bg-white text-slate-900">Band 6.5 (B2+)</option>
                <option value="7.0" className="bg-white text-slate-900">Band 7.0 (C1)</option>
                <option value="7.5" className="bg-white text-slate-900">Band 7.5 (C1+)</option>
                <option value="8.0" className="bg-white text-slate-900">Band 8.0+ (C2)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none text-xs sm:text-sm">
          <button
            onClick={() => onSelectTab('practice')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium transition whitespace-nowrap cursor-pointer ${
              currentTab === 'practice'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Phòng Luyện Nói</span>
          </button>

          <button
            onClick={() => onSelectTab('weaknesses')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium transition whitespace-nowrap relative cursor-pointer ${
              currentTab === 'weaknesses'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Target className="w-4 h-4 text-rose-500" />
            <span>Personal Weakness Tracker</span>
            {activeWeaknessCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                {activeWeaknessCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('shadowing')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium transition whitespace-nowrap cursor-pointer ${
              currentTab === 'shadowing'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Headphones className="w-4 h-4 text-sky-500" />
            <span>Shadowing Studio</span>
          </button>

          <button
            onClick={() => onSelectTab('daily')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium transition whitespace-nowrap cursor-pointer ${
              currentTab === 'daily'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>Thử Thách Mỗi Ngày</span>
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium transition whitespace-nowrap cursor-pointer ${
              currentTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span>Tiến Trình & Lịch Sử</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
