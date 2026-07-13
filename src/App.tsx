import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { LevelPage, LessonPage } from '@/pages/LessonPage';
import { ReferencePage } from '@/pages/ReferencePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ReplayPage } from '@/pages/tools/ReplayPage';
import {
  SoloDicePage,
  SoloFixedPage,
  SoloCardAutomaPage,
  SoloPracticeHubPage,
} from '@/pages/tools/SoloPracticePage';
import { StandardPracticePage } from '@/pages/tools/StandardPracticePage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="learn/:level" element={<LevelPage />} />
        <Route path="learn/:level/:lessonId" element={<LessonPage />} />
        <Route
          path="reference/glossary"
          element={<ReferencePage lessonId="appendix-glossary" />}
        />
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
        <Route path="tools/replay" element={<ReplayPage />} />
        <Route path="tools/solo" element={<SoloPracticeHubPage />} />
        <Route path="tools/solo/fixed" element={<SoloFixedPage />} />
        <Route path="tools/solo/dice" element={<SoloDicePage />} />
        <Route path="tools/solo/card" element={<SoloCardAutomaPage />} />
        <Route path="tools/standard" element={<StandardPracticePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
