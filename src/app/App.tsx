import { Routes, Route, Navigate } from 'react-router-dom';
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';
import { Layout } from '../components/Layout';
import { SignIn } from '../screens/SignIn';
import { Welcome } from '../screens/Welcome';
import { Consent } from '../screens/Consent';
import { AddChild } from '../screens/AddChild';
import { EditChild } from '../screens/EditChild';
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
import { Favorites } from '../screens/Favorites';
import { Notifications } from '../screens/Notifications';
import { HealthcareDirectory } from '../screens/HealthcareDirectory';
import { ChildProfile } from '../screens/ChildProfile';
import { AuditLog } from '../screens/AuditLog';
import { AdminReviewQueue } from '../screens/AdminReviewQueue';

// Authentication gate: unauthenticated visitors see sign-in; the app (and all
// child data) is only reachable once signed in.
export function App() {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center text-ink-soft">…</div>
      </AuthLoading>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
      <Authenticated>
        <AppRoutes />
      </Authenticated>
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout showNav={false}><Welcome /></Layout>} />
      <Route path="/consent" element={<Layout showNav={false}><Consent /></Layout>} />
      <Route path="/add-child" element={<Layout showNav={false}><AddChild /></Layout>} />
      <Route path="/edit-child" element={<Layout showNav={false}><EditChild /></Layout>} />
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
      <Route path="/favorites" element={<Layout><Favorites /></Layout>} />
      <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
      <Route path="/directory" element={<Layout><HealthcareDirectory /></Layout>} />
      <Route path="/child-profile" element={<Layout><ChildProfile /></Layout>} />
      <Route path="/admin" element={<Layout><AdminReviewQueue /></Layout>} />
      <Route path="/audit" element={<Layout><AuditLog /></Layout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
