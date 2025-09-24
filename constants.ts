

import { VocabularyWord } from './types';

export const LOCAL_STORAGE_KEY = 'toeic_vocabulary_words';
export const TOPIC_PACKS_KEY = 'toeic_topic_packs';
export const DAILY_WORD_KEY = 'daily_word_history';
export const DAILY_GRAMMAR_KEY = 'daily_grammar_history';
export const LEARNING_STREAK_KEY = 'learning_streak_data';
export const DAILY_TASKS_KEY = 'daily_tasks_progress';
export const GROUP_TITLES_KEY = 'topic_pack_group_titles';
export const READING_COMPREHENSION_KEY = 'daily_reading_comprehension';
export const LEARNING_ACTIVITY_LOG_KEY = 'learning_activity_log';
export const AI_STUDY_PLAN_KEY = 'ai_daily_study_plan';
export const DAILY_QUOTE_KEY = 'daily_famous_quote';


// Fix: Corrected the type to reflect that initial data does not include 'familiarity'.
export const INITIAL_VOCABULARY: Omit<VocabularyWord, 'id' | 'familiarity' | 'dueDate' | 'interval'>[] = [
  { word: "acquire", phonetic: "əˈkwaɪər", definition: "To gain possession of something.", chineseDefinition: "獲得，取得", exampleSentence: "The company plans to acquire several smaller firms this year." },
  { word: "allocate", phonetic: "ˈæləˌkeɪt", definition: "To distribute for a particular purpose.", chineseDefinition: "分配，配置", exampleSentence: "The manager will allocate resources for the new project." },
  { word: "agenda", phonetic: "əˈdʒɛndə", definition: "A list of items to be discussed at a meeting.", chineseDefinition: "議程", exampleSentence: "Please review the agenda before our conference call." },
  { word: "audit", phonetic: "ˈɔdɪt", definition: "An official inspection of an organization's accounts.", chineseDefinition: "審計，查帳", exampleSentence: "An external firm will conduct the annual financial audit." },
  { word: "benchmark", phonetic: "ˈbɛntʃˌmɑrk", definition: "A standard against which things may be compared.", chineseDefinition: "基準，標準", exampleSentence: "Our new product's performance set a new industry benchmark." },
  { word: "collaborate", phonetic: "kəˈlæbəˌreɪt", definition: "To work jointly on an activity.", chineseDefinition: "合作", exampleSentence: "The marketing and sales teams will collaborate on the campaign." },
  { word: "delegate", phonetic: "ˈdɛləˌɡeɪt", definition: "To entrust a task or responsibility to another person.", chineseDefinition: "委派，授權", exampleSentence: "A good leader knows when to delegate tasks." },
  { word: "leverage", phonetic: "ˈlɛvərɪdʒ", definition: "To use something to maximum advantage.", chineseDefinition: "利用", exampleSentence: "We can leverage our brand recognition to enter new markets." },
  { word: "negotiate", phonetic: "nəˈɡoʊʃiˌeɪt", definition: "To have a formal discussion to reach an agreement.", chineseDefinition: "協商，談判", exampleSentence: "They were able to negotiate a favorable contract." },
  { word: "outsource", phonetic: "ˈaʊtˌsɔrs", definition: "To obtain goods or a service from an outside supplier.", chineseDefinition: "外包", exampleSentence: "Many companies outsource their customer support services." },
  { word: "recruit", phonetic: "rɪˈkrut", definition: "To enlist someone as a new employee.", chineseDefinition: "招募", exampleSentence: "We need to recruit a new software developer for the team." },
  { word: "streamline", phonetic: "ˈstrimˌlaɪn", definition: "To make an organization or system more efficient.", chineseDefinition: "簡化，使效率更高", exampleSentence: "The new software will help streamline our workflow." },
  { word: "incentive", phonetic: "ɪnˈsɛntɪv", definition: "A thing that motivates or encourages one to do something.", chineseDefinition: "激勵，誘因", exampleSentence: "The company offers a performance bonus as an incentive." },
  { word: "itinerary", phonetic: "aɪˈtɪnəˌrɛri", definition: "A planned route or journey.", chineseDefinition: "行程表", exampleSentence: "The travel agent sent over the detailed itinerary for our business trip." },
  { word: "liability", phonetic: "ˌlaɪəˈbɪləti", definition: "The state of being legally responsible for something.", chineseDefinition: "責任，負債", exampleSentence: "The company has a significant liability for its debts." }
];