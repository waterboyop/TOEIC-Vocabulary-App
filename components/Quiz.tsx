
import React, { useState, useEffect, useCallback } from 'react';
import { VocabularyWord } from '../types';

interface QuizProps {
  words: VocabularyWord[];
}

const Quiz: React.FC<QuizProps> = ({ words }) => {
  const [currentQuestion, setCurrentQuestion] = useState<VocabularyWord | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const generateNewQuestion = useCallback(() => {
    if (words.length < 4) {
      return;
    }

    const shuffledWords = [...words].sort(() => 0.5 - Math.random());
    const [correctAnswer, ...distractors] = shuffledWords;
    const currentOptions = [correctAnswer.word, ...distractors.slice(0, 3).map(w => w.word)];
    
    setCurrentQuestion(correctAnswer);
    setOptions(currentOptions.sort(() => 0.5 - Math.random()));
    setSelectedAnswer(null);
    setFeedback(null);
    setFeedbackMessage(null);
  }, [words]);

  useEffect(() => {
    generateNewQuestion();
  }, [generateNewQuestion]);

  const handleAnswer = (answer: string) => {
    if (feedback) return; // Prevent changing answer after feedback

    setSelectedAnswer(answer);
    if (answer === currentQuestion?.word) {
      setFeedback('correct');
      setFeedbackMessage('答對了！');
    } else {
      setFeedback('incorrect');
      setFeedbackMessage(`答錯了！正確答案是 "${currentQuestion?.word}"`);
    }

    setTimeout(() => {
      generateNewQuestion();
    }, 2000);
  };

  const getButtonClass = (option: string) => {
    if (!feedback) {
      return 'bg-white hover:bg-slate-100 text-slate-700';
    }
    if (option === currentQuestion?.word) {
      return 'bg-green-500 text-white';
    }
    if (option === selectedAnswer) {
      return 'bg-red-500 text-white';
    }
    return 'bg-white text-slate-700 opacity-60';
  };

  if (words.length < 4) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold">單字數量不足，無法進行測驗。</h2>
        <p className="text-slate-600 mt-2">請至少新增 4 個單字至列表以開始測驗。</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="text-center">載入測驗中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-lg font-semibold text-indigo-700 mb-2">這個單字是什麼？</h2>
      <p className="text-xl text-slate-800 mb-6 text-center bg-slate-50 p-4 rounded-lg">
        {currentQuestion.definition}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleAnswer(option)}
            disabled={!!feedback}
            className={`w-full p-4 rounded-lg shadow-sm text-left font-semibold transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${getButtonClass(option)} ${feedback ? 'cursor-not-allowed' : 'hover:-translate-y-1'}`}
          >
            {option}
          </button>
        ))}
      </div>
      {feedbackMessage && (
        <div className={`mt-6 text-center text-lg font-bold ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
          {feedbackMessage}
        </div>
      )}
    </div>
  );
};

export default Quiz;
