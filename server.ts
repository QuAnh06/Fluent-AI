import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for resilient Gemini calls with transient error retry and model fallback
async function generateWithFallback(params: {
  contents: any;
  config?: any;
  primaryModel?: string;
}) {
  const models = [
    params.primaryModel || 'gemini-2.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];

  let lastError: any = null;
  for (const modelName of models) {
    try {
      return await ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: params.config,
      });
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${modelName} returned error, trying next available model:`, err?.message?.slice(0, 100));
    }
  }

  throw lastError;
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Analyze Speaking endpoint
app.post('/api/analyze-speaking', async (req: Request, res: Response) => {
  try {
    const {
      transcript,
      question,
      topic,
      targetBand,
      durationSeconds,
      previousWeaknesses,
      attemptNumber,
    } = req.body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Nội dung transcript không được để trống.' });
    }

    const wordCount = transcript.trim().split(/\s+/).length;
    const estWpm = durationSeconds && durationSeconds > 0
      ? Math.round((wordCount / durationSeconds) * 60)
      : Math.round(wordCount * 1.5);

    const prompt = `
You are SpeakBetter AI, a world-class English speaking examiner, IELTS coach, and pronunciation linguist.
Evaluate the following spoken English response given by a Vietnamese learner.

QUESTION/TOPIC:
Topic: "${topic || 'General Speaking'}"
Question: "${question || 'Tell me about yourself.'}"

USER'S SPOKEN TRANSCRIPT:
"${transcript}"

RECORDED DURATION: ${durationSeconds || 15} seconds (Approx ${estWpm} words per minute).
ATTEMPT NUMBER: ${attemptNumber || 1}
TARGET BAND: ${targetBand || '6.5-7.5'}
PREVIOUS WEAKNESSES OF LEARNER: ${JSON.stringify(previousWeaknesses || [])}

Analyze thoroughly across 5 core dimensions:
1. OVERALL EVALUATION:
   - IELTS Band Score (e.g. 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5)
   - CEFR Level (A2, B1, B2, C1, C2)
   - Overall Score (0 - 100)
   - Summary evaluation in Vietnamese (encouraging yet precise)

2. FLUENCY & COHERENCE:
   - Score (0-100)
   - Estimated WPM and whether the pace is too slow, ideal (110-150 WPM), or rushed
   - Hesitations count, awkward pauses, and list of filler words used (e.g., "um", "uh", "you know", "like")
   - Detailed feedback in Vietnamese on linking words, transitions, and flow

3. GRAMMAR & ACCURACY:
   - Score (0-100)
   - Specific errors detected with:
     * exact original text
     * suggested correction
     * rule category (e.g., "Tenses: Past Simple vs Present Perfect", "Subject-Verb Agreement", "Preposition", "Articles a/an/the", "Plural/Singular Suffix")
     * explanation in Vietnamese
     * severity: "minor" | "moderate" | "critical"
   - Grammar strengths noticed

4. VOCABULARY & LEXICAL RESOURCE:
   - Score (0-100)
   - Repeated/overused simple words (e.g., "good", "very", "happy", "like")
   - Suggested vocabulary upgrades (word -> advanced alternative -> collocation -> example sentence in context)
   - Idiomatic phrasing suggestions

5. PRONUNCIATION & ACOUSTICS (Phonetics & Stress):
   - Score (0-100)
   - Flagged words commonly mispronounced by Vietnamese speakers (e.g., missing ending consonants /s/, /z/, /t/, /d/, confusion between /θ/ and /s/ or /t/, silent letters, misplaced word stress like 'comfortable', 'photographer', 'develop')
   - Word, IPA notation, problem area, and detailed guide in Vietnamese on how to position mouth/tongue/vocal cords
   - Intonation & rhythm commentary

6. IMPROVED MODEL ANSWERS:
   - Conversational Version (Band ~6.5 - 7.0): Natural, everyday native speaking style, easy to memorize. Include Vietnamese translation and key highlights.
   - Advanced Version (Band ~8.0 - 8.5): High-scoring IELTS style with rich collocations and complex sentence structures. Include Vietnamese translation and key highlights.

7. IDENTIFIED WEAKNESSES TO TRACK:
   - Extract 1 to 3 distinct weakness categories that the user showed in this attempt (e.g., "Missing ending sound /s/", "Confusion between Past Simple and Present Perfect", "Filler word addiction: 'like/um'").
   - Actionable tip in Vietnamese.

8. RETRY DRILL:
   - A short prompt or specific challenge for the user to re-record this answer right now to fix the #1 mistake.
`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER, description: 'Score out of 100' },
            ieltsBand: { type: Type.NUMBER, description: 'IELTS Band (e.g. 6.5)' },
            cefrLevel: { type: Type.STRING, description: 'CEFR Level e.g. B2' },
            summaryVi: { type: Type.STRING, description: 'Summary feedback in Vietnamese' },
            fluency: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                wpm: { type: Type.NUMBER },
                paceStatus: { type: Type.STRING, description: 'Slow, Good, or Too Fast' },
                hesitationsCount: { type: Type.NUMBER },
                fillerWords: { type: Type.ARRAY, items: { type: Type.STRING } },
                feedbackVi: { type: Type.STRING },
              },
              required: ['score', 'wpm', 'paceStatus', 'hesitationsCount', 'fillerWords', 'feedbackVi'],
            },
            grammar: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                errors: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      original: { type: Type.STRING },
                      correction: { type: Type.STRING },
                      ruleCategory: { type: Type.STRING },
                      explanationVi: { type: Type.STRING },
                      severity: { type: Type.STRING },
                    },
                    required: ['original', 'correction', 'ruleCategory', 'explanationVi', 'severity'],
                  },
                },
                feedbackVi: { type: Type.STRING },
              },
              required: ['score', 'errors', 'feedbackVi'],
            },
            vocabulary: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                repeatedWords: { type: Type.ARRAY, items: { type: Type.STRING } },
                upgrades: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      basicWord: { type: Type.STRING },
                      advancedAlternative: { type: Type.STRING },
                      collocation: { type: Type.STRING },
                      contextExample: { type: Type.STRING },
                    },
                    required: ['basicWord', 'advancedAlternative', 'collocation', 'contextExample'],
                  },
                },
                feedbackVi: { type: Type.STRING },
              },
              required: ['score', 'repeatedWords', 'upgrades', 'feedbackVi'],
            },
            pronunciation: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                intonationFeedbackVi: { type: Type.STRING },
                flaggedWords: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING },
                      ipa: { type: Type.STRING },
                      problemArea: { type: Type.STRING },
                      guideVi: { type: Type.STRING },
                    },
                    required: ['word', 'ipa', 'problemArea', 'guideVi'],
                  },
                },
              },
              required: ['score', 'intonationFeedbackVi', 'flaggedWords'],
            },
            improvedVersions: {
              type: Type.OBJECT,
              properties: {
                conversational: {
                  type: Type.OBJECT,
                  properties: {
                    band: { type: Type.STRING },
                    text: { type: Type.STRING },
                    vietnameseMeaning: { type: Type.STRING },
                    keyHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['band', 'text', 'vietnameseMeaning', 'keyHighlights'],
                },
                advanced: {
                  type: Type.OBJECT,
                  properties: {
                    band: { type: Type.STRING },
                    text: { type: Type.STRING },
                    vietnameseMeaning: { type: Type.STRING },
                    keyHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['band', 'text', 'vietnameseMeaning', 'keyHighlights'],
                },
              },
              required: ['conversational', 'advanced'],
            },
            weaknessesToTrack: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: 'Grammar, Pronunciation, Fluency, or Vocabulary' },
                  key: { type: Type.STRING, description: 'Short unique tag like past_vs_present_perf' },
                  titleVi: { type: Type.STRING },
                  descriptionVi: { type: Type.STRING },
                  actionableTipVi: { type: Type.STRING },
                },
                required: ['category', 'key', 'titleVi', 'descriptionVi', 'actionableTipVi'],
              },
            },
            retryDrill: {
              type: Type.OBJECT,
              properties: {
                focusPointVi: { type: Type.STRING },
                challengeTextVi: { type: Type.STRING },
                targetPhraseToUse: { type: Type.STRING },
              },
              required: ['focusPointVi', 'challengeTextVi', 'targetPhraseToUse'],
            },
          },
          required: [
            'overallScore',
            'ieltsBand',
            'cefrLevel',
            'summaryVi',
            'fluency',
            'grammar',
            'vocabulary',
            'pronunciation',
            'improvedVersions',
            'weaknessesToTrack',
            'retryDrill',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing speaking:', error);
    return res.status(500).json({
      error: 'Không thể phân tích bài nói lúc này. Vui lòng thử lại.',
      details: error?.message,
    });
  }
});

// Targeted Drill Generator for Personal Weaknesses
app.post('/api/generate-targeted-drill', async (req: Request, res: Response) => {
  try {
    const { weaknessKey, weaknessTitle, weaknessCategory } = req.body;

    const prompt = `
Create a targeted English speaking drill to help a learner conquer their specific weakness:
Weakness Category: "${weaknessCategory || 'Grammar'}"
Weakness: "${weaknessTitle || 'Common error'}" (Key: "${weaknessKey}")

Provide 3 carefully crafted speaking questions that specifically force the learner to use the correct patterns and avoid their mistake.
Include:
1. Drill Title & Objective in Vietnamese
2. Rule explanation & Cheat sheet tip
3. 3 Practice Questions with sample answer snippet and target keywords
4. A 1-sentence mini challenge
`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titleVi: { type: Type.STRING },
            objectiveVi: { type: Type.STRING },
            ruleTipVi: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  questionEn: { type: Type.STRING },
                  questionVi: { type: Type.STRING },
                  targetStructure: { type: Type.STRING },
                  hintVi: { type: Type.STRING },
                  exampleOpening: { type: Type.STRING },
                },
                required: ['id', 'questionEn', 'questionVi', 'targetStructure', 'hintVi', 'exampleOpening'],
              },
            },
            quickChallengeVi: { type: Type.STRING },
          },
          required: ['titleVi', 'objectiveVi', 'ruleTipVi', 'questions', 'quickChallengeVi'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating drill:', error);
    return res.status(500).json({ error: 'Không thể tạo bài luyện tập lúc này.', details: error?.message });
  }
});

// Shadowing Analysis endpoint
app.post('/api/analyze-shadowing', async (req: Request, res: Response) => {
  try {
    const { targetSentence, userTranscript, userDurationSeconds, expectedDurationSeconds } = req.body;

    const prompt = `
You are a precision speech and shadowing coach for English learners.
Compare the user's spoken attempt against the model target sentence.

TARGET SENTENCE:
"${targetSentence}"

USER TRANSCRIPT:
"${userTranscript}"

EXPECTED DURATION: ${expectedDurationSeconds || 5}s
USER DURATION: ${userDurationSeconds || 5}s

Evaluate:
1. Alignment score (0-100)
2. Rhythm & Intonation match (0-100)
3. Pronunciation accuracy (0-100)
4. Overall Shadowing Score (0-100)
5. Word-by-word comparison: an array of words in the target sentence with status: "perfect" | "acceptable" | "missed" | "distorted", and IPA + feedback for problematic ones.
6. Practical feedback in Vietnamese on rhythm, pauses, and linking words (connected speech).
`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            rhythmScore: { type: Type.NUMBER },
            pronunciationScore: { type: Type.NUMBER },
            completenessScore: { type: Type.NUMBER },
            feedbackVi: { type: Type.STRING },
            wordBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  status: { type: Type.STRING, description: 'perfect, acceptable, missed, or distorted' },
                  ipa: { type: Type.STRING },
                  noteVi: { type: Type.STRING },
                },
                required: ['word', 'status'],
              },
            },
            stressAndLinkingAdviceVi: { type: Type.STRING },
          },
          required: [
            'overallScore',
            'rhythmScore',
            'pronunciationScore',
            'completenessScore',
            'feedbackVi',
            'wordBreakdown',
            'stressAndLinkingAdviceVi',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing shadowing:', error);
    return res.status(500).json({ error: 'Không thể phân tích bài Shadowing.', details: error?.message });
  }
});

// Text-to-Speech (TTS) endpoint using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore', style } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }

    // Limit text length to avoid high latency
    const safeText = text.slice(0, 400);

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: safeText,
              speechMetadata: {
                style: style || 'Clear, natural, native English speaker pronunciation with natural cadence and pauses.',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Audio generation returned empty result.' });
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.warn('Gemini TTS fallback:', error?.message);
    return res.status(500).json({ error: 'TTS service error', details: error?.message });
  }
});

// Vite Middleware Setup for Development & Static Serving for Production
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`SpeakBetter AI server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
