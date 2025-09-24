

export interface VocabularyWord {
  id: string;
  word: string;
  phonetic: string;
  definition: string;
  chineseDefinition: string;
  exampleSentence: string;
  familiarity: number; // New: Score from 0 to 5
  tags?: string[];
  additionalExamples?: string[];
  // AI Analysis Fields
  sentenceAnalysis?: string;
  similarWordAnalysis?: {
    comparisonTarget: string;
    phonetic: string;
    definition: string;
    example: string;
    usageDifference: string;
  };
  structureAnalysis?: {
    prefix?: { part: string; meaning: string };
    root?: { part: string; meaning: string };
    suffix?: { part: string; meaning: string };
  };
  // Practice Fields
  writingPractice?: {
    sentence: string;
    feedback: string;
  }[];
  // SRS Fields
  dueDate: string; // YYYY-MM-DD
  interval: number; // in days
}

export interface DialogueLine {
  speaker: string;
  line: string;
  translation: string;
}

export interface TopicPack {
  id: string;
  title: string;
  chineseTitle: string;
  description: string;
  category: string;
  words: Omit<VocabularyWord, 'id' | 'familiarity' | 'tags' | 'additionalExamples' | 'writingPractice' | 'dueDate' | 'interval'>[];
  dialogue: DialogueLine[];
}

export interface DailyWord {
  date: string; // YYYY-MM-DD
  slang: string;
  phonetic: string;
  definition: string;
  example: string;
  chineseExample: string;
  trivia: string;
}

export interface ReadingQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface VocabularyHighlight {
  wordOrPhrase: string;
  definition: string;
  example: string;
}

export interface ReadingComprehensionTest {
  date: string; // YYYY-MM-DD
  article: string;
  title: string;
  questions: ReadingQuestion[];
  vocabulary: VocabularyHighlight[];
}

export interface EtymologyQuizQuestion {
  word: string;
  morpheme: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface WordUsageQuizQuestion {
  questionSentence: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
}

export interface DailyGrammarQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface DailyGrammar {
  date: string; // YYYY-MM-DD
  topic: string;
  explanation: string;
  examples: string[];
  quiz: DailyGrammarQuizQuestion[];
}

export interface StudyPlanTask {
  id: string;
  title: string;
  description: string;
  actionType: View; // The view to navigate to
  isCompleted: boolean;
  icon: 'flashcard' | 'reading' | 'topic' | 'quiz' | 'listening' | 'writing';
}

export interface StudyPlan {
  date: string; // YYYY-MM-DD
  planTitle: string;
  tasks: StudyPlanTask[];
}

export interface DailyQuote {
  date: string; // YYYY-MM-DD
  quote: string;
  author: string;
  authorTranslation: string;
  chineseTranslation: string;
}


export type View = 'dashboard' | 'list' | 'quiz' | 'inventory' | 'topic-learning' | 'flashcard' | 'reading-comprehension' | 'etymology-quiz' | 'learning-dashboard' | 'word-usage-quiz' | 'listening-quiz' | 'writing-assistant';
