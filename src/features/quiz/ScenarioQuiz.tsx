import { useState } from 'react';
import { quizzes } from '@/data/quizzes';
import type { LessonLevel } from '@/types';

interface ScenarioQuizProps {
  level?: LessonLevel;
  quizIds?: string[];
}

export function ScenarioQuiz({ level, quizIds }: ScenarioQuizProps) {
  const filtered = quizzes.filter((q) => {
    if (quizIds?.length) return quizIds.includes(q.id);
    if (level) return q.level === level;
    return true;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  if (filtered.length === 0) {
    return <p className="text-splendor-muted font-serif">暂无测验题目</p>;
  }

  const question = filtered[currentIndex];
  const isCorrect = selected === question.correctOptionId;

  const handleSelect = (optionId: string) => {
    if (showResult) return;
    setSelected(optionId);
    setShowResult(true);
  };

  const handleNext = () => {
    setSelected(null);
    setShowResult(false);
    setCurrentIndex((i) => (i + 1) % filtered.length);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-splendor-muted font-serif">
        <span>
          题目 {currentIndex + 1} / {filtered.length}
        </span>
        <span>{question.title}</span>
      </div>

      <div className="panel p-5">
        <p className="text-splendor-ink leading-relaxed mb-4 font-body">
          {question.scenario}
        </p>
        <div className="space-y-2">
          {question.options.map((opt) => {
            let style =
              'border-splendor-line hover:border-splendor-accent bg-white text-splendor-ink';
            if (showResult) {
              if (opt.id === question.correctOptionId) {
                style = 'border-gem-emerald bg-gem-emerald/10 text-splendor-ink';
              } else if (opt.id === selected) {
                style = 'border-gem-ruby bg-gem-ruby/10 text-splendor-ink';
              } else {
                style = 'border-splendor-line/50 bg-splendor-bg/50 text-splendor-muted';
              }
            } else if (selected === opt.id) {
              style = 'border-splendor-accent bg-splendor-gold/10 text-splendor-ink';
            }

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className={`w-full text-left px-4 py-3 border font-serif transition-colors ${style}`}
              >
                {opt.text}
              </button>
            );
          })}
        </div>
      </div>

      {showResult && (
        <div className="space-y-3 animate-fade-up">
          <p
            className={`font-display tracking-wide ${
              isCorrect ? 'text-gem-emerald' : 'text-gem-ruby'
            }`}
          >
            {isCorrect ? '回答正确' : '回答错误'}
          </p>
          <div className="panel-soft p-4">
            <p className="text-xs text-splendor-accent mb-1 font-display tracking-wider">
              休闲建议
            </p>
            <p className="text-sm text-splendor-ink/90 font-body">
              {question.casualAdvice}
            </p>
          </div>
          <div className="panel-soft p-4">
            <p className="text-xs text-splendor-accent mb-1 font-display tracking-wider">
              竞技建议
            </p>
            <p className="text-sm text-splendor-ink/90 font-body">
              {question.competitiveAdvice}
            </p>
          </div>
          <button type="button" onClick={handleNext} className="btn-gilt">
            下一题
          </button>
        </div>
      )}
    </div>
  );
}

export function ChapterQuiz({ quizIds }: { quizIds?: string[] }) {
  if (!quizIds?.length) return null;

  return (
    <section className="mt-10 pt-8 border-t border-splendor-line">
      <h2 className="font-serif text-xl text-splendor-velvet mb-4 text-center tracking-wide">
        本章自测
      </h2>
      <ScenarioQuiz quizIds={quizIds} />
    </section>
  );
}
