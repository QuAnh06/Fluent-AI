import React, { useState, useEffect } from 'react';
import { TabType, SpeakingTopic, SpeechAnalysisResult, WeaknessProfileItem, SpeakingHistoryRecord, DailyChallenge } from './types';
import { SPEAKING_TOPICS } from './data/speakingTopics';
import { Header } from './components/Header';
import { TopicSelector } from './components/TopicSelector';
import { VoiceRecorder } from './components/VoiceRecorder';
import { AnalysisResultView } from './components/AnalysisResultView';
import { WeaknessTrackerView } from './components/WeaknessTrackerView';
import { ShadowingStudioView } from './components/ShadowingStudioView';
import { DailyChallengeView } from './components/DailyChallengeView';
import { ProgressHistoryView } from './components/ProgressHistoryView';
import {
  getStoredWeaknesses,
  recordDetectedWeaknesses,
  markWeaknessProgress,
  getSpeakingHistory,
  saveSpeakingRecord,
  clearSpeakingHistory,
  getDailyChallenges,
  completeDailyChallenge,
  getTargetBand,
  setTargetBand,
} from './utils/storage';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('practice');
  const [targetBand, setTargetBandState] = useState<number>(7.0);
  const [weaknesses, setWeaknesses] = useState<WeaknessProfileItem[]>([]);
  const [history, setHistory] = useState<SpeakingHistoryRecord[]>([]);
  const [dailyData, setDailyData] = useState<{ challenges: DailyChallenge[]; streak: number }>({
    challenges: [],
    streak: 4,
  });

  // Active Practice State
  const [selectedTopic, setSelectedTopic] = useState<SpeakingTopic>(SPEAKING_TOPICS[0]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>(SPEAKING_TOPICS[0].questions[0]);
  const [attemptNumber, setAttemptNumber] = useState<number>(1);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [lastDurationSeconds, setLastDurationSeconds] = useState<number>(20);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<SpeechAnalysisResult | null>(null);

  // Load stored state on mount
  useEffect(() => {
    setWeaknesses(getStoredWeaknesses());
    setHistory(getSpeakingHistory());
    setDailyData(getDailyChallenges());
    setTargetBandState(getTargetBand());
  }, []);

  const handleChangeTargetBand = (band: number) => {
    setTargetBandState(band);
    setTargetBand(band);
  };

  // Submit spoken transcript to AI
  const handleAnalyzeSpeech = async (transcript: string, durationSeconds: number, audioUrl?: string) => {
    if (!transcript.trim()) return;

    setIsAnalyzing(true);
    setLastTranscript(transcript);
    setLastDurationSeconds(durationSeconds);

    try {
      const activeWeaknessTitles = weaknesses.map((w) => w.titleVi);

      const response = await fetch('/api/analyze-speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          question: selectedQuestion,
          topic: selectedTopic.title,
          targetBand,
          durationSeconds,
          previousWeaknesses: activeWeaknessTitles,
          attemptNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('Lỗi máy chủ khi phân tích bài nói');
      }

      const result: SpeechAnalysisResult = await response.json();
      setAnalysisResult(result);

      // Trigger celebration confetti if good band
      if (result.ieltsBand >= 7.0) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.5 },
        });
      }

      // Update Weakness Profile with newly detected weaknesses
      if (result.weaknessesToTrack && result.weaknessesToTrack.length > 0) {
        const updatedWeaknesses = recordDetectedWeaknesses(result.weaknessesToTrack);
        setWeaknesses(updatedWeaknesses);
      }

      // Save to speaking history
      const newRecord: SpeakingHistoryRecord = {
        id: 'rec_' + Date.now(),
        date: new Date().toLocaleDateString('vi-VN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        topicTitle: selectedTopic.title,
        category: selectedTopic.categoryLabelVi,
        question: selectedQuestion,
        transcript,
        durationSeconds,
        analysis: result,
        attemptNumber,
        audioUrl,
      };
      const updatedHistory = saveSpeakingRecord(newRecord);
      setHistory(updatedHistory);

      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Error analyzing speech:', err);
      // Fallback notification or gracefully handled
    } finally {
      setIsAnalyzing(false);
    }
  };

  // User chooses to retry speaking the current question to fix errors (Attempt 2)
  const handleRetryDrill = () => {
    setAttemptNumber((prev) => prev + 1);
    setAnalysisResult(null);
    setCurrentTab('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Launch targeted drill from Weakness Tracker
  const handleStartTargetedDrill = (question: string, topicTitle: string, weaknessKey: string) => {
    const drillTopic: SpeakingTopic = {
      id: 'weakness_drill_' + weaknessKey,
      category: 'weakness_drill',
      categoryLabelVi: 'Targeted Weakness Drill',
      title: topicTitle,
      descriptionVi: 'Bài tập được AI thiết kế riêng để sửa triệt để điểm yếu của bạn.',
      questions: [question],
    };

    setSelectedTopic(drillTopic);
    setSelectedQuestion(question);
    setAttemptNumber(1);
    setAnalysisResult(null);
    setCurrentTab('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Launch daily challenge
  const handleStartDailyChallenge = (challenge: DailyChallenge) => {
    const challengeTopic: SpeakingTopic = {
      id: 'daily_challenge_topic',
      category: 'daily',
      categoryLabelVi: 'Thử Thách Mỗi Ngày',
      title: challenge.title,
      descriptionVi: challenge.missionVi,
      questions: [challenge.prompt],
    };

    setSelectedTopic(challengeTopic);
    setSelectedQuestion(challenge.prompt);
    setAttemptNumber(1);
    setAnalysisResult(null);
    setCurrentTab('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select a past recording to inspect analysis
  const handleSelectHistoryRecord = (record: SpeakingHistoryRecord) => {
    const topic: SpeakingTopic = {
      id: 'history_' + record.id,
      category: 'ielts_part1',
      categoryLabelVi: record.category,
      title: record.topicTitle,
      descriptionVi: 'Xem lại bài nói trong lịch sử',
      questions: [record.question],
    };

    setSelectedTopic(topic);
    setSelectedQuestion(record.question);
    setLastTranscript(record.transcript);
    setLastDurationSeconds(record.durationSeconds || 20);
    setAnalysisResult(record.analysis);
    setAttemptNumber(record.attemptNumber || 1);
    setCurrentTab('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear history
  const handleClearHistory = () => {
    clearSpeakingHistory();
    setHistory([]);
  };

  // Update weakness status manually
  const handleUpdateWeaknessStatus = (weaknessKey: string, succeeded: boolean) => {
    const updated = markWeaknessProgress(weaknessKey, succeeded);
    setWeaknesses(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Global Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        streak={dailyData.streak}
        targetBand={targetBand}
        onChangeTargetBand={handleChangeTargetBand}
        activeWeaknessCount={weaknesses.filter((w) => w.masteryStatus === 'needs_focus').length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* VIEW 1: Practice Studio (Luyện Nói & Chẩn Đoán AI) */}
        {currentTab === 'practice' && (
          <div className="space-y-8">
            {/* Topic Selector */}
            <TopicSelector
              selectedTopic={selectedTopic}
              selectedQuestion={selectedQuestion}
              onSelectTopic={(topic, q) => {
                setSelectedTopic(topic);
                setSelectedQuestion(q);
                setAnalysisResult(null);
                setAttemptNumber(1);
              }}
              onCustomQuestion={(customQ, title) => {
                const customTopic: SpeakingTopic = {
                  id: 'custom_' + Date.now(),
                  category: 'daily',
                  categoryLabelVi: 'Chủ Đề Tự Chọn',
                  title: title,
                  descriptionVi: 'Chủ đề tùy chỉnh do bạn tự nhập.',
                  questions: [customQ],
                };
                setSelectedTopic(customTopic);
                setSelectedQuestion(customQ);
                setAnalysisResult(null);
                setAttemptNumber(1);
              }}
            />

            {/* Voice Recorder & Transcript View */}
            <VoiceRecorder
              question={selectedQuestion}
              topicTitle={selectedTopic.title}
              categoryLabel={selectedTopic.categoryLabelVi}
              cueCardPoints={selectedTopic.cueCardPoints}
              targetSpeakingSeconds={selectedTopic.targetSpeakingSeconds || 60}
              isAnalyzing={isAnalyzing}
              onSubmit={handleAnalyzeSpeech}
              attemptNumber={attemptNumber}
            />

            {/* Deep Analysis Result View */}
            {analysisResult && (
              <AnalysisResultView
                result={analysisResult}
                question={selectedQuestion}
                transcript={lastTranscript}
                durationSeconds={lastDurationSeconds}
                onRetry={handleRetryDrill}
                onGoToWeaknessTracker={() => setCurrentTab('weaknesses')}
                attemptNumber={attemptNumber}
              />
            )}
          </div>
        )}

        {/* VIEW 2: Personal Weakness Tracker */}
        {currentTab === 'weaknesses' && (
          <WeaknessTrackerView
            weaknesses={weaknesses}
            onStartTargetedDrill={handleStartTargetedDrill}
            onUpdateStatus={handleUpdateWeaknessStatus}
          />
        )}

        {/* VIEW 3: Shadowing Studio */}
        {currentTab === 'shadowing' && <ShadowingStudioView />}

        {/* VIEW 4: Daily Speaking Challenge */}
        {currentTab === 'daily' && (
          <DailyChallengeView
            challenges={dailyData.challenges}
            streak={dailyData.streak}
            onStartChallenge={handleStartDailyChallenge}
          />
        )}

        {/* VIEW 5: Progress & History */}
        {currentTab === 'history' && (
          <ProgressHistoryView
            history={history}
            onSelectRecord={handleSelectHistoryRecord}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-700">Fluent AI • Huấn Luyện Viên Nói & Sửa Lỗi Phát Âm Chuẩn Bản Xứ</span>
          <span>Được tối ưu cho người học tiếng Anh & luyện thi IELTS Speaking</span>
        </div>
      </footer>
    </div>
  );
}
