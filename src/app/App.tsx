import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Welcome } from '../screens/Welcome';
import { Home } from '../screens/Home';
import { MilestoneDemo } from '../screens/MilestoneDemo';
import { Placeholder } from '../screens/Placeholder';

// Routes implemented in this foundation build are wired to real logic.
// Remaining routes render an honest "in progress" placeholder (never fake success).
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout showNav={false}><Welcome /></Layout>} />
      <Route path="/home" element={<Layout><Home /></Layout>} />
      <Route path="/journey" element={<Layout><MilestoneDemo /></Layout>} />
      <Route
        path="/activities"
        element={<Layout><Placeholder note="Activities — foundation in progress" /></Layout>}
      />
      <Route
        path="/learn"
        element={<Layout><Placeholder note="Parent Learning Library — foundation in progress" /></Layout>}
      />
      <Route
        path="/profile"
        element={<Layout><Placeholder note="Profile & Settings — foundation in progress" /></Layout>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
