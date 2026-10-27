import React, { useState } from 'react';
import { SPEAKING_TOPICS } from '../data/speakingTopics';
import { SpeakingTopic } from '../types';
import { MessageSquare, Plus, ChevronDown, Sparkles, BookOpen, Clock } from 'lucide-react';

interface TopicSelectorProps {
  selectedTopic: SpeakingTopic;
  selectedQuestion: string;
  onSelectTopic: (topic: SpeakingTopic, question: string) => void;
  onCustomQuestion: (question: string, topicTitle: string) => void;
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopic,
  selectedQuestion,
  onSelectTopic,
  onCustomQuestion,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customInput, setCustomInput] = useState('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const filteredTopics = SPEAKING_TOPICS.filter((t) => {
    if (activeCategory === 'all') return true;
    return t.category === activeCategory;
  });

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    onCustomQuestion(customInput.trim(), 'Chủ Đề Tùy Chọn Của Bạn');
    setIsCustomOpen(false);
    setCustomInput('');
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Chọn Chủ Đề Luyện Nói Tiếng Anh</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Luyện tập theo chuẩn đề thi IELTS Speaking Part 1, 2, 3 hoặc giao tiếp thực tế
          </p>
        </div>

        <button
          onClick={() => setIsCustomOpen(!isCustomOpen)}
          className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>{isCustomOpen ? 'Đóng nhập tùy chọn' : 'Tự nhập câu hỏi riêng'}</span>
        </button>
      </div>

      {/* Custom Question Collapsible Form */}
      {isCustomOpen && (
        <form onSubmit={handleCustomSubmit} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
          <label className="text-xs font-semibold text-indigo-900 block">
            Nhập câu hỏi hoặc chủ đề bất kỳ bạn muốn AI thẩm định:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="VD: Why do many young people prefer working remotely instead of in an office?"
              className="flex-1 rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              Chọn Câu Này
            </button>
          </div>
        </form>
      )}

      {/* Category Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
            activeCategory === 'all'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
          }`}
        >
          Tất Cả
        </button>
        <button
          onClick={() => setActiveCategory('ielts_part1')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
            activeCategory === 'ielts_part1'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
          }`}
        >
          IELTS Part 1
        </button>
        <button
          onClick={() => setActiveCategory('ielts_part2')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
            activeCategory === 'ielts_part2'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
          }`}
        >
          IELTS Part 2 (Cue Card)
        </button>
        <button
          onClick={() => setActiveCategory('ielts_part3')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
            activeCategory === 'ielts_part3'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
          }`}
        >
          IELTS Part 3 (Chuyên Sâu)
        </button>
        <button
          onClick={() => setActiveCategory('interview')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
            activeCategory === 'interview'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
          }`}
        >
          Phỏng Vấn Xin Việc
        </button>
        <button
          onClick={() => setActiveCategory('daily')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
            activeCategory === 'daily'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
          }`}
        >
          Đời Sống & Du Lịch
        </button>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTopics.map((topic) => {
          const isCurrentTopic = selectedTopic.id === topic.id;

          return (
            <div
              key={topic.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isCurrentTopic
                  ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200'
                  : 'bg-slate-50/70 border-slate-200/90 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    {topic.categoryLabelVi}
                  </span>
                  {topic.prepTimeSeconds && (
                    <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" /> 1m prep
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-1">{topic.title}</h4>
                <p className="text-xs text-slate-500 mb-3">{topic.descriptionVi}</p>
              </div>

              {/* Question list for this topic */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                {topic.questions.map((q, qIdx) => {
                  const isCurrentQ = selectedQuestion === q;
                  return (
                    <button
                      key={qIdx}
                      onClick={() => onSelectTopic(topic, q)}
                      className={`w-full text-left p-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-between ${
                        isCurrentQ
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="line-clamp-1">{q}</span>
                      {isCurrentQ && <span className="ml-1 text-[10px]">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
