import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Welcome } from '../screens/Welcome';
import { Home } from '../screens/Home';
import { MilestoneDemo } from '../screens/MilestoneDemo';
import { Activities } from '../screens/Activities';
import { Growth } from '../screens/Growth';
import { Sleep } from '../screens/Sleep';
import { Learn } from '../screens/Learn';
import { HopeCenter } from '../screens/HopeCenter';
import { Report } from '../screens/Report';
import { Placeholder } from '../screens/Placeholder';

// Routes implemented in this build are wired to real domain logic.
// Remaining routes render an honest "in progress" placeholder (never fake success).
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout showNav={false}><Welcome /></Layout>} />
      <Route path="/home" element={<Layout><Home /></Layout>} />
      <Route path="/journey" element={<Layout><MilestoneDemo /></Layout>} />
      <Route path="/activities" element={<Layout><Activities /></Layout>} />
      <Route path="/learn" element={<Layout><Learn /></Layout>} />
      <Route path="/hope" element={<Layout><HopeCenter /></Layout>} />
      <Route path="/growth" element={<Layout><Growth /></Layout>} />
      <Route path="/sleep" element={<Layout><Sleep /></Layout>} />
      <Route path="/report" element={<Layout><Report /></Layout>} />
      <Route
        path="/profile"
        element={<Layout><Placeholder note="Profile & Settings — foundation in progress" /></Layout>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
