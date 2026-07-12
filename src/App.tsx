import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { LevelPage, LessonPage } from '@/pages/LessonPage';
import { ReferencePage } from '@/pages/ReferencePage';
import { CalculatorPage } from '@/pages/tools/CalculatorPage';
import { NoblesPage } from '@/pages/tools/NoblesPage';
import { CardValuePage } from '@/pages/tools/CardValuePage';
import { ReplayPage } from '@/pages/tools/ReplayPage';
import {
  SoloDicePage,
  SoloFixedPage,
  SoloPracticeHubPage,
} from '@/pages/tools/SoloPracticePage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="learn/:level" element={<LevelPage />} />
        <Route path="learn/:level/:lessonId" element={<LessonPage />} />
        <Route
          path="reference/rules"
          element={<ReferencePage lessonId="appendix-rules-reference" />}
        />
        <Route
          path="reference/solo"
          element={<ReferencePage lessonId="appendix-solo-modes" />}
        />
        <Route
          path="reference/expansions"
          element={<ReferencePage lessonId="appendix-expansions" />}
        />
        <Route path="tools/calculator" element={<CalculatorPage />} />
        <Route path="tools/nobles" element={<NoblesPage />} />
        <Route path="tools/card-value" element={<CardValuePage />} />
        <Route path="tools/replay" element={<ReplayPage />} />
        <Route path="tools/solo" element={<SoloPracticeHubPage />} />
        <Route path="tools/solo/fixed" element={<SoloFixedPage />} />
        <Route path="tools/solo/dice" element={<SoloDicePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
