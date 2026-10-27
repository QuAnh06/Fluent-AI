import { WeaknessProfileItem, SpeakingHistoryRecord, DailyChallenge, TrackedWeakness } from '../types';
import { INITIAL_WEAKNESSES } from '../data/initialWeaknesses';
import { DAILY_CHALLENGES } from '../data/dailyChallenges';

const STORAGE_KEYS = {
  WEAKNESSES: 'speakbetter_weaknesses_v1',
  HISTORY: 'speakbetter_history_v1',
  DAILY: 'speakbetter_daily_v1',
  STREAK: 'speakbetter_streak_v1',
  TARGET_BAND: 'speakbetter_target_band_v1',
};

// --- WEAKNESS PROFILE ---

export function getStoredWeaknesses(): WeaknessProfileItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEAKNESSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WEAKNESSES, JSON.stringify(INITIAL_WEAKNESSES));
      return INITIAL_WEAKNESSES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read weaknesses from storage:', e);
    return INITIAL_WEAKNESSES;
  }
}

export function saveStoredWeaknesses(items: WeaknessProfileItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WEAKNESSES, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save weaknesses:', e);
  }
}

export function recordDetectedWeaknesses(detected: TrackedWeakness[]): WeaknessProfileItem[] {
  const current = getStoredWeaknesses();
  const updated = [...current];

  detected.forEach((item) => {
    const existingIndex = updated.findIndex((w) => w.key === item.key || w.titleVi.toLowerCase() === item.titleVi.toLowerCase());

    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        occurrenceCount: updated[existingIndex].occurrenceCount + 1,
        lastEncountered: 'Vừa xong',
        // If it occurs again, reset mastery to needs_focus if it was previously marked improving
        masteryStatus: updated[existingIndex].masteryStatus === 'mastered' ? 'improving' : updated[existingIndex].masteryStatus,
      };
    } else {
      updated.unshift({
        id: 'w_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        key: item.key,
        category: item.category,
        titleVi: item.titleVi,
        descriptionVi: item.descriptionVi,
        actionableTipVi: item.actionableTipVi,
        occurrenceCount: 1,
        lastEncountered: 'Vừa xong',
        masteryStatus: 'needs_focus',
        successCount: 0,
      });
    }
  });

  saveStoredWeaknesses(updated);
  return updated;
}

export function markWeaknessProgress(weaknessKey: string, succeeded: boolean): WeaknessProfileItem[] {
  const current = getStoredWeaknesses();
  const updated = current.map((w) => {
    if (w.key === weaknessKey) {
      const newSuccess = succeeded ? w.successCount + 1 : Math.max(0, w.successCount - 1);
      let status: 'needs_focus' | 'improving' | 'mastered' = w.masteryStatus;
      if (newSuccess >= 5) status = 'mastered';
      else if (newSuccess >= 2) status = 'improving';
      else status = 'needs_focus';

      return {
        ...w,
        successCount: newSuccess,
        masteryStatus: status,
      };
    }
    return w;
  });

  saveStoredWeaknesses(updated);
  return updated;
}

// --- SPEAKING HISTORY ---

export function getSpeakingHistory(): SpeakingHistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to get history:', e);
    return [];
  }
}

export function saveSpeakingRecord(record: SpeakingHistoryRecord): SpeakingHistoryRecord[] {
  try {
    const history = getSpeakingHistory();
    // Keep max 50 recent records
    const updated = [record, ...history].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save history record:', e);
    return [];
  }
}

export function clearSpeakingHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}

// --- DAILY CHALLENGES & STREAK ---

export function getDailyChallenges(): { challenges: DailyChallenge[]; streak: number } {
  try {
    const rawDaily = localStorage.getItem(STORAGE_KEYS.DAILY);
    const rawStreak = localStorage.getItem(STORAGE_KEYS.STREAK);

    const challenges: DailyChallenge[] = rawDaily ? JSON.parse(rawDaily) : DAILY_CHALLENGES;
    const streak = rawStreak ? parseInt(rawStreak, 10) : 4; // pre-seed realistic 4-day streak for motivation

    return { challenges, streak };
  } catch (e) {
    return { challenges: DAILY_CHALLENGES, streak: 4 };
  }
}

export function completeDailyChallenge(challengeId: string, score: number): { challenges: DailyChallenge[]; streak: number } {
  const { challenges, streak } = getDailyChallenges();
  const updatedChallenges = challenges.map((c) => {
    if (c.id === challengeId) {
      return {
        ...c,
        completed: true,
        score,
        completedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
    }
    return c;
  });

  const newStreak = streak + 1;
  localStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(updatedChallenges));
  localStorage.setItem(STORAGE_KEYS.STREAK, newStreak.toString());

  return { challenges: updatedChallenges, streak: newStreak };
}

// --- TARGET BAND ---

export function getTargetBand(): number {
  const stored = localStorage.getItem(STORAGE_KEYS.TARGET_BAND);
  return stored ? parseFloat(stored) : 7.0;
}

export function setTargetBand(band: number): void {
  localStorage.setItem(STORAGE_KEYS.TARGET_BAND, band.toString());
}
