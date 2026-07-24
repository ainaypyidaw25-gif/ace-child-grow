import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Welcome } from '../screens/Welcome';
import { Consent } from '../screens/Consent';
import { AddChild } from '../screens/AddChild';
import { Home } from '../screens/Home';
import { MilestoneDemo } from '../screens/MilestoneDemo';
import { Activities } from '../screens/Activities';
import { Growth } from '../screens/Growth';
import { Sleep } from '../screens/Sleep';
import { Learn } from '../screens/Learn';
import { HopeCenter } from '../screens/HopeCenter';
import { Report } from '../screens/Report';
import { Profile } from '../screens/Profile';
import { OfflineDownloads } from '../screens/OfflineDownloads';
import { AdminReviewQueue } from '../screens/AdminReviewQueue';

// Every route is wired to real domain logic and state (no fake success screens).
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout showNav={false}><Welcome /></Layout>} />
      <Route path="/consent" element={<Layout showNav={false}><Consent /></Layout>} />
      <Route path="/add-child" element={<Layout showNav={false}><AddChild /></Layout>} />
      <Route path="/home" element={<Layout><Home /></Layout>} />
      <Route path="/journey" element={<Layout><MilestoneDemo /></Layout>} />
      <Route path="/activities" element={<Layout><Activities /></Layout>} />
      <Route path="/learn" element={<Layout><Learn /></Layout>} />
      <Route path="/hope" element={<Layout><HopeCenter /></Layout>} />
      <Route path="/growth" element={<Layout><Growth /></Layout>} />
      <Route path="/sleep" element={<Layout><Sleep /></Layout>} />
      <Route path="/report" element={<Layout><Report /></Layout>} />
      <Route path="/profile" element={<Layout><Profile /></Layout>} />
      <Route path="/offline" element={<Layout><OfflineDownloads /></Layout>} />
      <Route path="/admin" element={<Layout><AdminReviewQueue /></Layout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
