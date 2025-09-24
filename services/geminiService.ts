

import { GoogleGenAI, Type } from "@google/genai";
import { VocabularyWord, TopicPack, DailyWord, ReadingComprehensionTest, EtymologyQuizQuestion, WordUsageQuizQuestion, DailyGrammar, StudyPlan, DailyQuote } from "../types";

// Singleton instance for the AI client
let ai: GoogleGenAI | null = null;
// Store initialization error to avoid repeated checks and failures
let initializationError: Error | null = null;

/**
 * Lazily initializes and returns the GoogleGenAI client.
 * It only attempts to initialize once. If it fails, it stores the error,
 * and subsequent calls will fail immediately with the same user-friendly error message.
 * This prevents the app from crashing on start and provides clear feedback to the user.
 */
const getAiClient = (): GoogleGenAI => {
    // If an initialization error occurred on a previous attempt, throw it again immediately.
    if (initializationError) {
        throw initializationError;
    }

    // If the client is already initialized successfully, return it.
    if (ai) {
        return ai;
    }

    // This is the one-time initialization block.
    try {
        // Use a safe way to access environment variables that works in various JS environments.
        // @ts-ignore - We expect 'process' might not be defined in all environments.
        const apiKey = typeof process !== 'undefined' ? process.env?.API_KEY : undefined;

        if (!apiKey) {
            console.error("API_KEY environment variable not set. Gemini features will be disabled.");
            // Create and store the error for subsequent calls.
            initializationError = new Error("無法使用 AI 功能，因為缺少 API 金鑰設定。");
            throw initializationError;
        }

        // If key exists, initialize the client. This happens only once.
        ai = new GoogleGenAI({ apiKey });
        return ai;

    } catch (error: any) {
        // If any other error occurs during initialization, capture it as well.
        initializationError = error instanceof Error ? error : new Error('An unexpected error occurred during AI client initialization.');
        throw initializationError;
    }
};


export const generateDefinitionAndExample = async (word: string): Promise<Omit<VocabularyWord, 'id' | 'familiarity'>> => {
  try {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `For the English word "${word}", provide its phonetic transcription (IPA), a simple English definition, a Traditional Chinese (繁體中文) definition, and an example sentence.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: "The word itself." },
            phonetic: { type: Type.STRING, description: "The phonetic transcription (IPA) of the word." },
            definition: {
              type: Type.STRING,
              description: "A concise definition of the word, suitable for an English learner.",
            },
            chineseDefinition: {
              type: Type.STRING,
              description: "The definition of the word in Traditional Chinese (繁體中文)."
            },
            exampleSentence: {
              type: Type.STRING,
              description: "An example sentence demonstrating the usage of the word.",
            },
          },
          required: ["word", "phonetic", "definition", "chineseDefinition", "exampleSentence"],
        },
      },
    });
    
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (result && typeof result.word === 'string' && typeof result.phonetic === 'string' && typeof result.definition === 'string' && typeof result.chineseDefinition === 'string' && typeof result.exampleSentence === 'string') {
        return result;
    } else {
        throw new Error("從 AI 收到的格式無效。");
    }
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    // Forward the specific error from getAiClient or a generic one for other issues.
    throw new Error(error.message || "生成內容時發生錯誤。請檢查您的網路連線。");
  }
};

export const generateMoreWords = async (existingWords: string[]): Promise<Omit<VocabularyWord, 'id' | 'familiarity'>[]> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate 10 new high-frequency and commonly used intermediate-level TOEIC vocabulary words. These should be words that frequently appear on the TOEIC test. Do NOT include any of the following words: ${existingWords.join(', ')}. For each word, provide its phonetic transcription (IPA), a concise English definition, a Traditional Chinese (繁體中文) definition, and a simple example sentence.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            word: {
                                type: Type.STRING,
                                description: "The new vocabulary word.",
                            },
                            phonetic: {
                                type: Type.STRING,
                                description: "The phonetic transcription (IPA) of the word.",
                            },
                            definition: {
                                type: Type.STRING,
                                description: "A concise English definition.",
                            },
                            chineseDefinition: {
                                type: Type.STRING,
                                description: "The definition in Traditional Chinese (繁體中文)."
                            },
                            exampleSentence: {
                                type: Type.STRING,
                                description: "An example sentence using the word.",
                            },
                        },
                        required: ["word", "phonetic", "definition", "chineseDefinition", "exampleSentence"],
                    },
                },
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        
        if (Array.isArray(result) && result.every(item => 'word' in item && 'definition' in item && 'phonetic' in item)) {
            return result as Omit<VocabularyWord, 'id' | 'familiarity'>[];
        } else {
            throw new Error("從 AI 收到的陣列格式無效。");
        }

    } catch (error: any) {
        console.error("Error calling Gemini API for generating more words:", error);
        throw new Error(error.message || "從 AI 生成新單字時失敗。");
    }
};

export const explainSentence = async (word: string, sentence: string): Promise<string> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `針對多益單字 "${word}"，請用繁體中文「簡潔扼要」地解釋它在以下例句中的用法與文法重點。如果句子中有特殊的俚語或用法，請特別說明。\n\n例句：'${sentence}'\n\n你的輸出必須是純文字，不包含任何 Markdown 格式。`,
        });

        return response.text.trim();
    } catch (error: any) {
        console.error("Error calling Gemini API for sentence explanation:", error);
        throw new Error(error.message || "無法從 AI 取得解釋。");
    }
};

export const generateMoreExamples = async (word: string, existingExample: string): Promise<string[]> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate 3 new and distinct example sentences for the TOEIC vocabulary word "${word}". The sentences should be suitable for English learners. Do not repeat the existing example: "${existingExample}".`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        examples: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "An array of 3 new example sentences."
                        }
                    },
                    required: ["examples"]
                },
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (result && Array.isArray(result.examples)) {
            return result.examples;
        } else {
            throw new Error("從 AI 收到的例句格式無效。");
        }
    } catch (error: any) {
        console.error("Error calling Gemini API for more examples:", error);
        throw new Error(error.message || "從 AI 生成更多例句時失敗。");
    }
};


export const findSimilarWord = async (wordToCompare: string): Promise<VocabularyWord['similarWordAnalysis']> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find one common and easily confused word similar to the English word "${wordToCompare}". Provide its phonetic (IPA), Chinese and English definitions, an example sentence, and a "usage difference" (用法區別) in Traditional Chinese comparing it with "${wordToCompare}".`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        comparisonTarget: { type: Type.STRING, description: "The similar word to compare with." },
                        phonetic: { type: Type.STRING, description: "The phonetic transcription (IPA) of the similar word." },
                        definition: { type: Type.STRING, description: "The English definition of the similar word." },
                        example: { type: Type.STRING, description: "An example sentence for the similar word." },
                        usageDifference: { type: Type.STRING, description: `A detailed comparison in Traditional Chinese explaining the difference in usage between "${wordToCompare}" and the similar word.` },
                    },
                    required: ["comparisonTarget", "phonetic", "definition", "example", "usageDifference"],
                },
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error: any) {
        console.error("Error calling Gemini API for similar word:", error);
        throw new Error(error.message || "從 AI 尋找相似字時失敗。");
    }
};

export const analyzeWordStructure = async (word: string): Promise<VocabularyWord['structureAnalysis']> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the structure of the English word "${word}" into its prefix, root, and suffix. For each part that exists, provide the part itself and its meaning in Traditional Chinese. If a part doesn't exist, omit it from the result.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        prefix: {
                            type: Type.OBJECT,
                            properties: {
                                part: { type: Type.STRING },
                                meaning: { type: Type.STRING }
                            }
                        },
                        root: {
                            type: Type.OBJECT,
                            properties: {
                                part: { type: Type.STRING },
                                meaning: { type: Type.STRING }
                            }
                        },
                        suffix: {
                            type: Type.OBJECT,
                            properties: {
                                part: { type: Type.STRING },
                                meaning: { type: Type.STRING }
                            }
                        }
                    },
                },
            },
        });
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        // --- NEW VALIDATION ---
        const isMorphemeValid = (morpheme: any): boolean => {
            return morpheme && 
                   typeof morpheme === 'object' &&
                   !Array.isArray(morpheme) &&
                   typeof morpheme.part === 'string' && morpheme.part.trim() !== '' &&
                   typeof morpheme.meaning === 'string' && morpheme.meaning.trim() !== '';
        };

        const validatedResult: VocabularyWord['structureAnalysis'] = {};
        if (isMorphemeValid(result.prefix)) {
            validatedResult.prefix = result.prefix;
        }
        if (isMorphemeValid(result.root)) {
            validatedResult.root = result.root;
        }
        if (isMorphemeValid(result.suffix)) {
            validatedResult.suffix = result.suffix;
        }

        // If after validation, the object is empty, it means Gemini returned junk.
        if (Object.keys(validatedResult).length === 0) {
            return { root: { part: word, meaning: "無法分析結構" } };
        }

        return validatedResult;
    } catch (error: any) {
        console.error("Error calling Gemini API for word structure:", error);
        throw new Error(error.message || "從 AI 分析單字結構時失敗。");
    }
};

export const getWritingFeedback = async (word: string, sentence: string): Promise<string> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Act as an English writing coach. The user is practicing the word "${word}". \nPlease review their sentence: "${sentence}". \nProvide concise feedback in Traditional Chinese, focusing on grammar, word choice, and naturalness. If the sentence is good, praise it and perhaps suggest a more advanced alternative. Your output must be pure text.`,
        });

        return response.text.trim();
    } catch (error: any) {
        console.error("Error calling Gemini API for writing feedback:", error);
        throw new Error(error.message || "無法從 AI 取得寫作回饋。");
    }
};

export const generateTopicPack = async (topic: string, existingPackTitles: string[]): Promise<Omit<TopicPack, 'id' | 'category'>> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a business English learning pack for the topic "${topic}". Do not use a title from this list of existing packs: ${existingPackTitles.join(', ')}. The pack must include: 
1. An engaging 'title' in English.
2. A corresponding 'chineseTitle' in Traditional Chinese.
3. A short 'description' in Traditional Chinese. 
4. A 'words' array of 5-7 relevant vocabulary words, each with phonetic (IPA), English definition, Traditional Chinese definition, and an example sentence. 
5. A 'dialogue' array representing a short conversation between two speakers (e.g., Mark, Sarah) that naturally uses most of these vocabulary words. Each object in the array should have a 'speaker', the English 'line', and a Traditional Chinese 'translation'.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        chineseTitle: { type: Type.STRING },
                        description: { type: Type.STRING },
                        words: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    word: { type: Type.STRING },
                                    phonetic: { type: Type.STRING },
                                    definition: { type: Type.STRING },
                                    chineseDefinition: { type: Type.STRING },
                                    exampleSentence: { type: Type.STRING },
                                },
                                required: ["word", "phonetic", "definition", "chineseDefinition", "exampleSentence"],
                            }
                        },
                        dialogue: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    speaker: { type: Type.STRING },
                                    line: { type: Type.STRING },
                                    translation: { type: Type.STRING },
                                },
                                required: ["speaker", "line", "translation"],
                            }
                        }
                    },
                    required: ["title", "chineseTitle", "description", "words", "dialogue"],
                },
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (result && result.title && result.words && result.dialogue) {
            return result as Omit<TopicPack, 'id' | 'category'>;
        } else {
            throw new Error("從 AI 收到的主題學習包格式無效。");
        }

    } catch (error: any) {
        console.error("Error calling Gemini API for topic pack generation:", error);
        throw new Error(error.message || "從 AI 生成主題學習包時失敗。");
    }
};

export const summarizeTopicGroup = async (titles: string[]): Promise<string> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Given the following list of business English learning pack titles: "${titles.join('", "')}". Generate a single, concise, and appealing group title in Traditional Chinese (繁體中文) that summarizes them all. The title should be 4-8 characters long. Your output must be the title text only, without any quotes or extra formatting.`,
            config: { 
                thinkingConfig: { thinkingBudget: 0 } 
            }
        });
        return response.text.trim().replace(/["'「」]/g, ''); // Clean up quotes just in case
    } catch (error: any) {
        console.error("Error calling Gemini API for group summarization:", error);
        throw new Error(error.message || "無法從 AI 取得摘要標題。");
    }
};

export const generateDailySlang = async (existingSlangs: string[]): Promise<Omit<DailyWord, 'date'>> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a popular, interesting, and modern English slang word or phrase. Do NOT include any of the following words: ${existingSlangs.join(', ')}. Provide its phonetic transcription (IPA), a main definition in Traditional Chinese (繁體中文), an English example sentence, the Traditional Chinese translation for the example sentence, and a "trivia" (小知識) section in Traditional Chinese about its origin or usage.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        slang: { type: Type.STRING, description: "The English slang word or phrase." },
                        phonetic: { type: Type.STRING, description: "The phonetic transcription (IPA)." },
                        definition: { type: Type.STRING, description: "The main definition in Traditional Chinese." },
                        example: { type: Type.STRING, description: "An English example sentence using the slang." },
                        chineseExample: { type: Type.STRING, description: "The Traditional Chinese translation of the example sentence." },
                        trivia: { type: Type.STRING, description: "A fun fact or trivia about the slang in Traditional Chinese." },
                    },
                    required: ["slang", "phonetic", "definition", "example", "chineseExample", "trivia"],
                },
            },
        });
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        if (result && result.slang && result.definition && result.example && result.chineseExample && result.trivia) {
            return result as Omit<DailyWord, 'date'>;
        } else {
             throw new Error("從 AI 收到的每日俚語格式無效。");
        }
    } catch (error: any) {
        console.error("Error calling Gemini API for daily slang:", error);
        throw new Error(error.message || "從 AI 生成每日俚語時失敗。");
    }
};

export const generateDailyGrammar = async (existingTopics: string[]): Promise<Omit<DailyGrammar, 'date'>> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a daily grammar lesson for a TOEIC learner (B1-B2 level). Do NOT use any of the following topics: ${existingTopics.join(', ')}. The lesson must include:
1. A concise 'topic' in English (e.g., "Present Perfect vs. Past Simple").
2. A clear 'explanation' in Traditional Chinese (繁體中文).
3. An array of 3 'examples' sentences in English.
4. A 'quiz' array of 2-3 fill-in-the-blank multiple-choice questions. Each question should have a 'question' sentence with a blank (___), an array of 4 string 'options', the 'correctAnswer' string, and a clear 'explanation' in Traditional Chinese.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topic: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                        examples: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                        quiz: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    options: {
                                        type: Type.ARRAY,
                                        items: { type: Type.STRING },
                                    },
                                    correctAnswer: { type: Type.STRING },
                                    explanation: { type: Type.STRING },
                                },
                                required: ["question", "options", "correctAnswer", "explanation"],
                            },
                        },
                    },
                    required: ["topic", "explanation", "examples", "quiz"],
                },
            },
        });
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        if (result && result.topic && result.explanation && Array.isArray(result.examples) && Array.isArray(result.quiz)) {
            return result as Omit<DailyGrammar, 'date'>;
        } else {
            throw new Error("從 AI 收到的每日文法格式無效。");
        }
    } catch (error: any) {
        console.error("Error calling Gemini API for daily grammar:", error);
        throw new Error(error.message || "從 AI 生成每日文法時失敗。");
    }
};

export const generateDailyQuote = async (existingAuthors: string[]): Promise<Omit<DailyQuote, 'date'>> => {
  try {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate an inspiring and famous quote suitable for a language learner. Do NOT use a quote from any of the following authors: ${existingAuthors.join(', ')}. The quote should be in English. Provide the quote, the author's name, the author's name translated into Traditional Chinese (繁體中文), and a corresponding Traditional Chinese translation of the quote.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING, description: "The inspiring quote in English." },
            author: { type: Type.STRING, description: "The name of the author." },
            authorTranslation: { type: Type.STRING, description: "The author's name in Traditional Chinese." },
            chineseTranslation: { type: Type.STRING, description: "The Traditional Chinese translation of the quote." },
          },
          required: ["quote", "author", "authorTranslation", "chineseTranslation"],
        },
      },
    });
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    if (result && result.quote && result.author && result.authorTranslation && result.chineseTranslation) {
      return result as Omit<DailyQuote, 'date'>;
    } else {
      throw new Error("從 AI 收到的每日名言格式無效。");
    }
  } catch (error: any) {
    console.error("Error calling Gemini API for daily quote:", error);
    throw new Error(error.message || "從 AI 生成每日名言時失敗。");
  }
};

export const generateReadingComprehensionTest = async (): Promise<Omit<ReadingComprehensionTest, 'date'>> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a reading comprehension test for a TOEIC learner at the B1-B2 level. The test must include:
1.  An engaging 'title' for the article.
2.  A short 'article' of about 200-250 words on a business or daily life topic.
3.  An array of 3 multiple-choice 'questions' based on the article.
4.  A 'vocabulary' array of 5-7 key words or phrases from the article that are useful for TOEIC.

For each question, provide:
a. The 'question' text.
b. An array of 4 string 'options'.
c. The 'correctAnswerIndex' (0-3).
d. A clear 'explanation' in Traditional Chinese (繁體中文) for why the correct answer is right.

For each vocabulary item, provide:
a. The 'wordOrPhrase' itself.
b. A concise 'definition' in Traditional Chinese (繁體中文).
c. The 'example' sentence from the article where it appears.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        article: { type: Type.STRING },
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    options: {
                                        type: Type.ARRAY,
                                        items: { type: Type.STRING },
                                    },
                                    correctAnswerIndex: { type: Type.INTEGER },
                                    explanation: { type: Type.STRING },
                                },
                                required: ["question", "options", "correctAnswerIndex", "explanation"],
                            },
                        },
                        vocabulary: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    wordOrPhrase: { type: Type.STRING },
                                    definition: { type: Type.STRING },
                                    example: { type: Type.STRING },
                                },
                                required: ["wordOrPhrase", "definition", "example"],
                            },
                        },
                    },
                    required: ["title", "article", "questions", "vocabulary"],
                },
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (result && result.title && result.article && Array.isArray(result.questions) && Array.isArray(result.vocabulary)) {
            return result as Omit<ReadingComprehensionTest, 'date'>;
        } else {
            throw new Error("從 AI 收到的閱讀測驗格式無效。");
        }

    } catch (error: any) {
        console.error("Error calling Gemini API for reading comprehension test:", error);
        throw new Error(error.message || "從 AI 生成閱讀測驗時失敗。");
    }
};

export const generateEtymologyQuiz = async (
  analyzedWords: VocabularyWord[]
): Promise<EtymologyQuizQuestion[]> => {
  try {
    const aiClient = getAiClient();
    
    const wordStructures = analyzedWords.map(word => ({
      word: word.word,
      structure: word.structureAnalysis
    }));

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Based on the following list of English words and their structural analysis (prefix, root, suffix), generate a 5-question multiple-choice quiz about the meaning of these morphemes. The quiz must be in Traditional Chinese (繁體中文).

For each question:
1.  Randomly select one word from the list.
2.  Randomly pick either its prefix, root, or suffix to ask about.
3.  Formulate a 'question' in Traditional Chinese, like '字根 "-quire" 的意思是什麼？'. This should identify the morpheme type (字首, 字根, 字尾) and the morpheme itself.
4.  Provide one correct 'option' which is the meaning of the chosen morpheme.
5.  Generate three plausible but incorrect 'options' (distractors). These distractors should be meanings of other common morphemes.
6.  Provide the 'correctAnswerIndex' (0-3).
7.  Write a brief 'explanation' in Traditional Chinese explaining why the answer is correct and how it relates to the word's meaning.

Here is the list of analyzed words:
${JSON.stringify(wordStructures)}

Ensure the output is a valid JSON array matching the specified schema.
`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING, description: "The source word for the question, e.g., 'acquire'." },
              morpheme: { type: Type.STRING, description: "The specific morpheme being tested, e.g., '-quire'." },
              question: { type: Type.STRING, description: "The quiz question, e.g., '字根 \"-quire\" 的意思是什麼？'" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of 4 possible answers in Traditional Chinese."
              },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING, description: "An explanation for the correct answer in Traditional Chinese." }
            },
            required: ["word", "morpheme", "question", "options", "correctAnswerIndex", "explanation"],
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (Array.isArray(result) && result.length > 0 && result.every(q => q.question && q.options && q.options.length === 4)) {
        return result as EtymologyQuizQuestion[];
    } else {
        throw new Error("從 AI 收到的測驗格式無效。");
    }

  } catch (error: any) {
    console.error("Error calling Gemini API for etymology quiz:", error);
    throw new Error(error.message || "從 AI 生成字根字首測驗時失敗。");
  }
};

export const generateWordUsageQuiz = async (
  easyWords: VocabularyWord[]
): Promise<WordUsageQuizQuestion[]> => {
  try {
    const aiClient = getAiClient();
    const wordList = easyWords.map(w => w.word);
    
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a quiz with exactly ${wordList.length} multiple-choice questions, based on the following list of English words: ${wordList.join(', ')}.
Each word from the provided list must be the correct answer for exactly one question.

For each question, do the following:
1. Create a 'questionSentence' with a blank ('___') where the correct answer should go. The sentence should clearly test the meaning or usage of the word in a typical TOEIC context.
2. Provide the 'correctAnswer' (which must be one of the words from the list).
3. Create an array of 4 'options'. This array must include the 'correctAnswer' and three other plausible but incorrect words (distractors) chosen *only* from the provided list of words. Ensure the options are shuffled and that no question has duplicate options.
4. Write a brief 'explanation' in Traditional Chinese explaining why the correct answer is the best fit for the sentence.

Ensure the output is a valid JSON array matching the specified schema with exactly ${wordList.length} items.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionSentence: { type: Type.STRING },
              correctAnswer: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              explanation: { type: Type.STRING }
            },
            required: ["questionSentence", "correctAnswer", "options", "explanation"]
          }
        }
      }
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (Array.isArray(result) && result.length > 0 && result.every(q => q.questionSentence && q.options?.length === 4)) {
        return result as WordUsageQuizQuestion[];
    } else {
        throw new Error("從 AI 收到的用法測驗格式無效。");
    }
  } catch (error: any)
  {
    console.error("Error calling Gemini API for word usage quiz:", error);
    throw new Error(error.message || "從 AI 生成單字用法測驗時失敗。");
  }
};

export const getSpellingCorrectionHelp = async (correctWord: string, userAttempt: string): Promise<string> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `As an English phonetics coach, a user was asked to spell a word they heard.
- Correct word: "${correctWord}"
- User's spelling: "${userAttempt}"

In Traditional Chinese (繁體中文), provide a concise, friendly explanation for the likely phonetic confusion. Focus on similar-sounding vowels or consonants. For example, '您可能將 'p' 的音聽成 'b' 了' or '聽起來很像，但 'ea' 在這裡發短音 /ɛ/，而不是長音 /i:/。'. Keep it under 60 words. Your output must be pure text.`,
            config: {
                thinkingConfig: { thinkingBudget: 0 } // For faster response
            }
        });

        return response.text.trim();
    } catch (error: any) {
        console.error("Error calling Gemini API for spelling help:", error);
        throw new Error(error.message || "無法從 AI 取得拼寫建議。");
    }
};

export const rewriteSentenceForBusiness = async (originalText: string): Promise<{ rewrittenText: string; explanation: string }> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Act as a professional business English communication coach. The user wants to improve their writing for work communication.
Rewrite the following text to be more fluent, professional, and grammatically correct.
Also, provide a concise explanation in Traditional Chinese about the key changes and why they improve the text.

Original text: "${originalText}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        rewrittenText: {
                            type: Type.STRING,
                            description: "The improved, rewritten English text."
                        },
                        explanation: {
                            type: Type.STRING,
                            description: "A concise explanation of the changes in Traditional Chinese."
                        }
                    },
                    required: ["rewrittenText", "explanation"],
                },
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (result && typeof result.rewrittenText === 'string' && typeof result.explanation === 'string') {
            return result;
        } else {
            throw new Error("從 AI 收到的格式無效。");
        }
    } catch (error: any) {
        console.error("Error calling Gemini API for sentence rewriting:", error);
        throw new Error(error.message || "無法從 AI 取得寫作建議。");
    }
};

export const getAiErrorAnalysis = async (
    question: string,
    options: string[],
    correctAnswer: string,
    userAnswer: string
): Promise<string> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `As a helpful TOEIC tutor, a student has answered a multiple-choice question incorrectly.
- The question is: "${question}"
- The options were: [${options.join(', ')}]
- The student incorrectly chose: "${userAnswer}"
- The correct answer is: "${correctAnswer}"

In Traditional Chinese (繁體中文), please provide a concise and encouraging explanation.
Focus on explaining:
1. Why the student's choice ("${userAnswer}") is incorrect in this context.
2. Why the correct answer ("${correctAnswer}") is the best fit.
Keep the tone friendly and helpful, like a personal coach. Your output must be pure text.`,
            config: {
                thinkingConfig: { thinkingBudget: 0 } // For faster response
            }
        });

        return response.text.trim();
    } catch (error: any) {
        console.error("Error calling Gemini API for error analysis:", error);
        throw new Error(error.message || "無法從 AI 取得錯題分析。");
    }
};

export const generateStudyPlan = async (
  wordsToReview: VocabularyWord[],
  weakWords: VocabularyWord[],
  totalWords: number
): Promise<Omit<StudyPlan, 'date'>> => {
  try {
    const aiClient = getAiClient();
    
    // Create a concise summary of the user's status
    let userStatus = `The user has ${totalWords} total words in their vocabulary.\n`;
    if (wordsToReview.length > 0) {
      userStatus += `- They have ${wordsToReview.length} words due for review today: ${wordsToReview.slice(0, 5).map(w => w.word).join(', ')}.\n`;
    } else {
      userStatus += `- They have completed all their reviews for today.\n`;
    }
    if (weakWords.length > 0) {
      userStatus += `- They have ${weakWords.length} weak words (low familiarity): ${weakWords.slice(0, 5).map(w => w.word).join(', ')}.\n`;
    }

    const prompt = `Act as a friendly and motivational TOEIC learning coach. Based on the user's current progress, create a personalized study plan for today with 3-4 actionable tasks.

User's status:
${userStatus}

Your task is to generate a JSON object for the study plan. The plan should include:
1.  A creative and encouraging 'planTitle' in Traditional Chinese.
2.  An array of 3-4 'tasks'. Each task must have:
    - 'id': A unique string identifier for the task (e.g., "review_flashcards", "weakness_quiz").
    - 'title': The task title in Traditional Chinese.
    - 'description': A brief task description in Traditional Chinese.
    - 'actionType': The corresponding view in the app. Choose from: 'flashcard', 'reading-comprehension', 'topic-learning', 'word-usage-quiz', 'etymology-quiz', 'listening-quiz'.
    - 'icon': A string representing the icon. Choose from: 'flashcard', 'reading', 'topic', 'quiz', 'listening', 'writing'.
    - 'isCompleted': Must be 'false'.

Prioritize tasks based on the user's needs. If there are words to review, a 'flashcard' task is essential. If there are many weak words, suggest a 'listening-quiz' or 'word-usage-quiz'. If the user is doing well, suggest learning a new 'topic-learning' or trying 'reading-comprehension'. Be creative and vary the plan.`;
    
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  actionType: { type: Type.STRING },
                  icon: { type: Type.STRING },
                  isCompleted: { type: Type.BOOLEAN },
                },
                required: ["id", "title", "description", "actionType", "icon", "isCompleted"],
              },
            },
          },
          required: ["planTitle", "tasks"],
        },
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (result && result.planTitle && Array.isArray(result.tasks)) {
        return result as Omit<StudyPlan, 'date'>;
    } else {
        throw new Error("從 AI 收到的學習計畫格式無效。");
    }
  } catch (error: any) {
    console.error("Error calling Gemini API for study plan:", error);
    throw new Error(error.message || "從 AI 生成學習計畫時失敗。");
  }
};