export type TabType = 'practice' | 'weaknesses' | 'shadowing' | 'daily' | 'history';

export interface GrammarError {
  original: string;
  correction: string;
  ruleCategory: string;
  explanationVi: string;
  severity: 'minor' | 'moderate' | 'critical';
}

export interface VocabularyUpgrade {
  basicWord: string;
  advancedAlternative: string;
  collocation: string;
  contextExample: string;
}

export interface PronunciationWord {
  word: string;
  ipa: string;
  problemArea: string;
  guideVi: string;
}

export interface ModelAnswer {
  band: string;
  text: string;
  vietnameseMeaning: string;
  keyHighlights: string[];
}

export interface TrackedWeakness {
  category: 'Grammar' | 'Pronunciation' | 'Fluency' | 'Vocabulary';
  key: string;
  titleVi: string;
  descriptionVi: string;
  actionableTipVi: string;
}

export interface FluencyTimelineSegment {
  id: string;
  timeStartSec: number;
  timeEndSec: number;
  timeLabel: string;
  phrase: string;
  flowScore: number; // 0 to 100
  wpm: number;
  pauseDurationSec: number;
  status: 'smooth' | 'hesitation' | 'filler' | 'repetition';
  detectedItem?: string; // e.g. "um", "uh", "actually", "very very"
  noteVi: string;
}

export interface SpeechAnalysisResult {
  overallScore: number;
  ieltsBand: number;
  cefrLevel: string;
  summaryVi: string;
  fluency: {
    score: number;
    wpm: number;
    paceStatus: string;
    hesitationsCount: number;
    fillerWords: string[];
    feedbackVi: string;
    longestPauseSec?: number;
    timelineSegments?: FluencyTimelineSegment[];
  };
  grammar: {
    score: number;
    strengths?: string[];
    errors: GrammarError[];
    feedbackVi: string;
  };
  vocabulary: {
    score: number;
    repeatedWords: string[];
    upgrades: VocabularyUpgrade[];
    feedbackVi: string;
  };
  pronunciation: {
    score: number;
    intonationFeedbackVi: string;
    flaggedWords: PronunciationWord[];
  };
  improvedVersions: {
    conversational: ModelAnswer;
    advanced: ModelAnswer;
  };
  weaknessesToTrack: TrackedWeakness[];
  retryDrill: {
    focusPointVi: string;
    challengeTextVi: string;
    targetPhraseToUse: string;
  };
}

export interface WeaknessProfileItem {
  id: string;
  key: string;
  category: 'Grammar' | 'Pronunciation' | 'Fluency' | 'Vocabulary';
  titleVi: string;
  descriptionVi: string;
  actionableTipVi: string;
  occurrenceCount: number;
  lastEncountered: string;
  masteryStatus: 'needs_focus' | 'improving' | 'mastered';
  successCount: number;
}

export interface TargetedDrill {
  titleVi: string;
  objectiveVi: string;
  ruleTipVi: string;
  questions: Array<{
    id: string;
    questionEn: string;
    questionVi: string;
    targetStructure: string;
    hintVi: string;
    exampleOpening: string;
  }>;
  quickChallengeVi: string;
}

export interface SpeakingTopic {
  id: string;
  category: 'ielts_part1' | 'ielts_part2' | 'ielts_part3' | 'interview' | 'daily' | 'weakness_drill';
  categoryLabelVi: string;
  title: string;
  descriptionVi: string;
  cueCardPoints?: string[];
  prepTimeSeconds?: number;
  targetSpeakingSeconds?: number;
  questions: string[];
}

export interface ShadowingExercise {
  id: string;
  title: string;
  level: 'B1' | 'B2' | 'C1' | 'Band 8.0';
  category: string;
  sentenceEn: string;
  meaningVi: string;
  phoneticIpa: string;
  focusPointVi: string;
  audioDurationSeconds: number;
}

export interface ShadowingResult {
  overallScore: number;
  rhythmScore: number;
  pronunciationScore: number;
  completenessScore: number;
  feedbackVi: string;
  wordBreakdown: Array<{
    word: string;
    status: 'perfect' | 'acceptable' | 'missed' | 'distorted';
    ipa?: string;
    noteVi?: string;
  }>;
  stressAndLinkingAdviceVi: string;
}

export interface SpeakingHistoryRecord {
  id: string;
  date: string;
  topicTitle: string;
  category: string;
  question: string;
  transcript: string;
  durationSeconds: number;
  analysis: SpeechAnalysisResult;
  attemptNumber: number;
  audioUrl?: string; // object URL or data URL
}

export interface DailyChallenge {
  id: string;
  dateStr: string;
  title: string;
  prompt: string;
  missionVi: string;
  ruleConstraintVi: string;
  completed: boolean;
  score?: number;
  completedAt?: string;
}
