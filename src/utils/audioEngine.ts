// Web Audio and Speech utilities for SpeakBetter AI

// SpeechRecognition type definitions for cross-browser support
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export class SpeechRecognitionController {
  private recognition: any = null;
  private isListening = false;
  private finalTranscript = '';
  private onTranscriptChange?: (text: string, isFinal: boolean) => void;
  private onError?: (error: string) => void;

  constructor(
    onTranscriptChange?: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ) {
    this.onTranscriptChange = onTranscriptChange;
    this.onError = onError;

    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              this.finalTranscript += (this.finalTranscript ? ' ' : '') + transcript.trim();
            } else {
              interimTranscript += transcript;
            }
          }

          const combined = (this.finalTranscript + ' ' + interimTranscript).trim();
          if (this.onTranscriptChange) {
            this.onTranscriptChange(combined, false);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
          if (event.error !== 'no-speech' && this.onError) {
            this.onError(event.error);
          }
        };

        this.recognition.onend = () => {
          if (this.isListening) {
            // Auto-restart if still flagged listening (prevents early cutoffs)
            try {
              this.recognition.start();
            } catch {
              // Ignore if already started
            }
          }
        };
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
      }
    }
  }

  public isAvailable(): boolean {
    return !!this.recognition;
  }

  public start(initialText = '') {
    this.finalTranscript = initialText;
    this.isListening = true;
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Speech recognition start failed or already active:', e);
      }
    }
  }

  public stop(): string {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
    return this.finalTranscript.trim();
  }

  public reset(text = '') {
    this.finalTranscript = text;
  }
}

export interface RecordStartResult {
  success: boolean;
  errorType?: 'permission_denied' | 'not_supported' | 'device_not_found' | 'unknown';
  errorMessage?: string;
}

// Audio Recording & Waveform Stream Manager
export class AudioRecorderManager {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  public async startRecording(
    onVolumeUpdate?: (volume: number, frequencies: Uint8Array) => void
  ): Promise<RecordStartResult> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        success: false,
        errorType: 'not_supported',
        errorMessage: 'Trình duyệt không hỗ trợ MediaDevices ghi âm.',
      };
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];

      // Setup Web Audio Analyser for live visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;
        source.connect(this.analyser);

        if (onVolumeUpdate) {
          const bufferLength = this.analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const tick = () => {
            if (!this.analyser) return;
            this.analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const normalizedVol = Math.min(100, Math.round((average / 255) * 150));

            onVolumeUpdate(normalizedVol, dataArray);
            this.animFrameId = requestAnimationFrame(tick);
          };
          this.animFrameId = requestAnimationFrame(tick);
        }
      }

      // MediaRecorder setup
      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }
        this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };
        this.mediaRecorder.start(200);
      }

      return { success: true };
    } catch (err: any) {
      const isPermissionDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.message?.includes('Permission denied') ||
        err?.message?.includes('denied');

      const isNotFound =
        err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError';

      if (isPermissionDenied) {
        return {
          success: false,
          errorType: 'permission_denied',
          errorMessage: 'Quyền truy cập Microphone bị từ chối trong trình duyệt.',
        };
      }

      if (isNotFound) {
        return {
          success: false,
          errorType: 'device_not_found',
          errorMessage: 'Không tìm thấy thiết bị Microphone khả dụng trên máy.',
        };
      }

      return {
        success: false,
        errorType: 'unknown',
        errorMessage: err?.message || 'Không thể khởi động microphone.',
      };
    }
  }

  public stopRecording(): Promise<{ audioBlob: Blob; audioUrl: string }> {
    return new Promise((resolve) => {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }

      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close().catch(() => {});
      }

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((t) => t.stop());
        this.mediaStream = null;
      }

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = () => {
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          const audioUrl = URL.createObjectURL(audioBlob);
          resolve({ audioBlob, audioUrl });
        };
        this.mediaRecorder.stop();
      } else {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        resolve({ audioBlob, audioUrl: '' });
      }
    });
  }
}

// Current active audio playback element
let currentAudio: HTMLAudioElement | null = null;

// Speech Synthesis & Gemini TTS audio player
export async function playNativeSpeech(
  text: string,
  options?: {
    useGeminiTts?: boolean;
    voiceName?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): Promise<() => void> {
  const { useGeminiTts = true, voiceName = 'Kore', onStart, onEnd, onError } = options || {};

  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // Try Gemini 3.8 Flash Lite TTS first if enabled
  if (useGeminiTts) {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.slice(0, 400),
          voiceName: voiceName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          currentAudio = audio;

          audio.onplay = () => onStart?.();
          audio.onended = () => {
            currentAudio = null;
            onEnd?.();
          };
          audio.onerror = (e) => {
            console.warn('Audio element error, falling back to Web Speech synthesis:', e);
            fallbackSpeechSynthesis(text, onStart, onEnd, onError);
          };

          await audio.play();
          return () => {
            audio.pause();
            audio.currentTime = 0;
            currentAudio = null;
          };
        }
      }
    } catch (err) {
      console.warn('Gemini TTS request failed, fallback to client synthesis:', err);
    }
  }

  // Fallback to Browser Native SpeechSynthesis
  return fallbackSpeechSynthesis(text, onStart, onEnd, onError);
}

function fallbackSpeechSynthesis(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): () => void {
  if (!('speechSynthesis' in window)) {
    onError?.('Trình duyệt không hỗ trợ tổng hợp giọng nói.');
    return () => {};
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.95; // slightly slower for maximum educational clarity
  utterance.pitch = 1.0;

  // Pick a natural US or UK English voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.name.includes('Samantha') ||
        v.name.includes('Daniel') ||
        v.name.includes('Zira'))
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    onError?.(e);
  };

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
}
