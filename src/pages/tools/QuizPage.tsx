import { ScenarioQuiz } from '@/features/quiz/ScenarioQuiz';

export function QuizPage() {
  return (
    <div>
      <header className="mb-8 animate-fade-up">
        <p className="font-display text-[10px] tracking-[0.35em] uppercase text-splendor-accent/80 mb-2">
          Trials
        </p>
        <h1 className="page-title">情景决策测验</h1>
        <div className="ornament-line my-4 max-w-sm" />
        <p className="text-splendor-muted text-sm font-serif">
          共 8 题，涵盖拿指示物、购买、保留、贵族与终局。每题提供休闲与竞技双视角解析。
        </p>
      </header>
      <ScenarioQuiz />
    </div>
  );
}
