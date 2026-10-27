import { FluencyTimelineSegment } from '../types';

const COMMON_FILLERS = new Set(['um', 'uh', 'er', 'ah', 'like', 'actually', 'basically', 'you know', 'well']);

export function ensureFluencyTimeline(
  transcript: string,
  durationSeconds: number,
  hesitationsCount: number,
  fillerWords: string[] = [],
  providedSegments?: FluencyTimelineSegment[]
): {
  segments: FluencyTimelineSegment[];
  longestPauseSec: number;
  totalPauseTimeSec: number;
  smoothPercentage: number;
} {
  // If provided segments exist and have items, normalize them
  if (providedSegments && providedSegments.length > 2) {
    const normalized = providedSegments.map((seg, idx) => {
      const start = seg.timeStartSec ?? Math.round((idx / providedSegments.length) * durationSeconds);
      const end = seg.timeEndSec ?? Math.round(((idx + 1) / providedSegments.length) * durationSeconds);
      const startMins = Math.floor(start / 60);
      const startSecs = Math.round(start % 60);
      const timeLabel = `${startMins}:${startSecs < 10 ? '0' : ''}${startSecs}`;

      return {
        ...seg,
        id: seg.id || `seg_${idx}`,
        timeStartSec: start,
        timeEndSec: end,
        timeLabel: seg.timeLabel || timeLabel,
        flowScore: Math.min(100, Math.max(10, Math.round(seg.flowScore || 75))),
        wpm: seg.wpm || Math.round((seg.phrase.split(/\s+/).length / Math.max(1, end - start)) * 60),
        pauseDurationSec: seg.pauseDurationSec || (seg.status === 'hesitation' ? 1.8 : 0.3),
      };
    });

    const longestPause = Math.max(...normalized.map((s) => s.pauseDurationSec || 0), 1.5);
    const totalPause = normalized.reduce((acc, s) => acc + (s.status === 'hesitation' ? s.pauseDurationSec : 0.2), 0);
    const smoothCount = normalized.filter((s) => s.status === 'smooth').length;
    const smoothPercentage = Math.round((smoothCount / normalized.length) * 100);

    return {
      segments: normalized,
      longestPauseSec: parseFloat(longestPause.toFixed(1)),
      totalPauseTimeSec: parseFloat(totalPause.toFixed(1)),
      smoothPercentage,
    };
  }

  // Algorithmic breakdown of transcript words across the recorded duration
  const words = transcript.trim().split(/\s+/);
  if (words.length === 0 || !transcript.trim()) {
    return {
      segments: [],
      longestPauseSec: 0,
      totalPauseTimeSec: 0,
      smoothPercentage: 100,
    };
  }

  const safeDuration = Math.max(5, durationSeconds || Math.round(words.length * 0.5));
  // Divide into ~6 to 12 meaningful timeline chunks
  const segmentCount = Math.min(Math.max(4, Math.ceil(words.length / 5)), 12);
  const wordsPerSegment = Math.ceil(words.length / segmentCount);

  const segments: FluencyTimelineSegment[] = [];
  let longestPause = 0.4;
  let totalPause = 0;

  // Track lowercase filler words set
  const fillerSet = new Set(fillerWords.map((f) => f.toLowerCase().trim()));

  for (let i = 0; i < segmentCount; i++) {
    const chunkWords = words.slice(i * wordsPerSegment, (i + 1) * wordsPerSegment);
    if (chunkWords.length === 0) break;

    const phrase = chunkWords.join(' ');
    const timeStartSec = Math.round((i / segmentCount) * safeDuration);
    const timeEndSec = Math.round(((i + 1) / segmentCount) * safeDuration);
    const segDuration = Math.max(1, timeEndSec - timeStartSec);
    const segWpm = Math.round((chunkWords.length / segDuration) * 60);

    const startMins = Math.floor(timeStartSec / 60);
    const startSecs = timeStartSec % 60;
    const timeLabel = `${startMins}:${startSecs < 10 ? '0' : ''}${startSecs}`;

    // Detect repetitions (e.g. "I I", "and and", "very very")
    let repeatedWord = '';
    for (let w = 0; w < chunkWords.length - 1; w++) {
      const w1 = chunkWords[w].toLowerCase().replace(/[^a-z]/g, '');
      const w2 = chunkWords[w + 1].toLowerCase().replace(/[^a-z]/g, '');
      if (w1 && w1 === w2 && w1.length > 1) {
        repeatedWord = `${chunkWords[w]} ${chunkWords[w + 1]}`;
        break;
      }
    }

    // Detect filler words
    let foundFiller = '';
    for (const w of chunkWords) {
      const cleanW = w.toLowerCase().replace(/[^a-z]/g, '');
      if (COMMON_FILLERS.has(cleanW) || fillerSet.has(cleanW)) {
        foundFiller = w;
        break;
      }
    }

    // Determine status & flowScore
    let status: 'smooth' | 'hesitation' | 'filler' | 'repetition' = 'smooth';
    let flowScore = 88;
    let pauseSec = 0.3;
    let noteVi = 'Nói lưu loát, tốc độ nhịp điệu tự nhiên.';

    if (repeatedWord) {
      status = 'repetition';
      flowScore = 48;
      pauseSec = 1.4;
      noteVi = `Lặp từ không chủ đích: "${repeatedWord}".`;
    } else if (foundFiller) {
      status = 'filler';
      flowScore = 60;
      pauseSec = 1.2;
      noteVi = `Xuất hiện từ chêm: "${foundFiller}" làm gián đoạn dòng suy nghĩ.`;
    } else if (i === Math.floor(segmentCount / 2) && hesitationsCount > 0) {
      // simulate the hesitation spike at middle transition
      status = 'hesitation';
      pauseSec = Math.min(3.2, 1.5 + (hesitationsCount * 0.4));
      flowScore = 42;
      noteVi = `Ngập ngừng ${pauseSec.toFixed(1)}s để tìm ý và chuyển mạch câu.`;
    } else if (segWpm < 90) {
      status = 'hesitation';
      pauseSec = 1.6;
      flowScore = 55;
      noteVi = `Tốc độ chậm (${segWpm} WPM), có khoảng dừng dài giữa các cụm.`;
    } else if (segWpm > 175) {
      flowScore = 78;
      pauseSec = 0.1;
      noteVi = `Nói hơi vội (${segWpm} WPM), cần thêm khoảng ngắt nghỉ ngữ nghĩa.`;
    }

    if (pauseSec > longestPause) {
      longestPause = pauseSec;
    }
    totalPause += pauseSec;

    segments.push({
      id: `seg_${i}`,
      timeStartSec,
      timeEndSec,
      timeLabel,
      phrase,
      flowScore,
      wpm: segWpm,
      pauseDurationSec: parseFloat(pauseSec.toFixed(1)),
      status,
      detectedItem: repeatedWord || foundFiller || undefined,
      noteVi,
    });
  }

  const smoothCount = segments.filter((s) => s.status === 'smooth').length;
  const smoothPercentage = Math.round((smoothCount / Math.max(1, segments.length)) * 100);

  return {
    segments,
    longestPauseSec: parseFloat(longestPause.toFixed(1)),
    totalPauseTimeSec: parseFloat(totalPause.toFixed(1)),
    smoothPercentage,
  };
}
