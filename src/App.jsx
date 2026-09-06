// ══════════════════════════════════════════════════════════
// App.jsx — التوجيه (Router) بين الشاشات
// ══════════════════════════════════════════════════════════
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Today from './pages/Today';
import Week from './pages/Week';
import Progress from './pages/Progress';
import TaskDetail from './pages/TaskDetail';
import NewTask from './pages/NewTask';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Today />} />
        <Route path="/week" element={<Week />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/task/:id" element={<TaskDetail />} />
        <Route path="/task/new" element={<NewTask />} />
        <Route path="/task/:id/edit" element={<NewTask />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}