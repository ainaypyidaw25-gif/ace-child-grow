import { Routes, Route, Navigate } from 'react-router-dom';
import { Authenticated, Unauthenticated, AuthLoading, useQuery } from 'convex/react';
import { Layout } from '../components/Layout';
import { useAppState } from './AppState';
import { decideRoute } from './bootstrap';
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
import { ContentLibrary } from '../screens/ContentLibrary';
import { ContentDetail } from '../screens/ContentDetail';
import { LibraryAdmin } from '../screens/LibraryAdmin';
import { EvidenceAdmin } from '../screens/EvidenceAdmin';
import { AdminTeam } from '../screens/AdminTeam';
import { AcceptAdminInvite } from '../screens/AcceptAdminInvite';
import { AdminDirectory } from '../screens/AdminDirectory';
import { AdminBilling } from '../screens/AdminBilling';
import { SubscriptionPlans } from '../screens/SubscriptionPlans';
import { api } from '../../convex/_generated/api';
import { useEffect } from 'react';
import { getPortalMode, setPortalMode } from './portalMode';

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

// Bootstrap gate for the index route. Decides where an authenticated user lands
// based on SERVER state (consent + children), and never redirects while those
// queries are still loading. This is the fix for returning users being asked to
// add a child again on every login.
function Bootstrap() {
  const { ready, hasChild, state } = useAppState();
  const wantsStaffPortal = getPortalMode() === 'staff';
  const staffAccess = useQuery(api.admin.myAccess, wantsStaffPortal ? {} : 'skip');
  if (wantsStaffPortal && staffAccess === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-soft" role="status" aria-live="polite">
        <span className="animate-pulse">…</span>
      </div>
    );
  }
  if (wantsStaffPortal) {
    return staffAccess?.isStaff
      ? <Navigate to="/admin" replace />
      : (
        <ResetStaffPortalMode>
          <Layout showNav={false}>
            <div className="rounded-card border border-line bg-white p-5 shadow-card">
              <h1 className="font-bold text-ink">စီမံခန့်ခွဲရေးဝင်ခွင့် မရှိသေးပါ</h1>
              <p className="mt-2 text-sm text-ink-soft">
                ပိုင်ရှင်ထံမှ ဖိတ်ကြားလင့်ခ်ကို လက်ခံပြီးမှ အဖွဲ့ဝင် သို့မဟုတ် ပညာရှင်စာမျက်နှာသို့ ဝင်နိုင်ပါသည်။
              </p>
              <a href="/" className="mt-4 inline-block rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white">
                မိဘစာမျက်နှာသို့ သွားမည်
              </a>
            </div>
          </Layout>
        </ResetStaffPortalMode>
      );
  }
  const route = decideRoute({
    ready,
    consentAccepted: Boolean(state.consentAcceptedAt),
    hasChild,
  });
  switch (route) {
    case 'loading':
      return (
        <div className="flex min-h-screen items-center justify-center text-ink-soft" role="status" aria-live="polite">
          <span className="animate-pulse">…</span>
        </div>
      );
    case 'home':
      return <Navigate to="/home" replace />;
    case 'add-child':
      return <Navigate to="/add-child" replace />;
    case 'welcome':
    default:
      return <Layout showNav={false}><Welcome /></Layout>;
  }
}

function ResetStaffPortalMode({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setPortalMode('parent');
  }, []);
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Bootstrap />} />
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
      <Route path="/subscription" element={<Layout><SubscriptionPlans /></Layout>} />
      <Route path="/offline" element={<Layout><OfflineDownloads /></Layout>} />
      <Route path="/favorites" element={<Layout><Favorites /></Layout>} />
      <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
      <Route path="/directory" element={<Layout><HealthcareDirectory /></Layout>} />
      <Route path="/child-profile" element={<Layout><ChildProfile /></Layout>} />
      <Route path="/library" element={<Layout><ContentLibrary /></Layout>} />
      <Route path="/content/:slug" element={<Layout><ContentDetail /></Layout>} />
      <Route path="/admin" element={<Layout><AdminReviewQueue /></Layout>} />
      <Route path="/admin/library" element={<Layout><LibraryAdmin /></Layout>} />
      <Route path="/admin/evidence" element={<Layout><EvidenceAdmin /></Layout>} />
      <Route path="/admin/team" element={<Layout><AdminTeam /></Layout>} />
      <Route path="/admin/directory" element={<Layout><AdminDirectory /></Layout>} />
      <Route path="/admin/billing" element={<Layout><AdminBilling /></Layout>} />
      <Route path="/admin/accept-invite" element={<Layout><AcceptAdminInvite /></Layout>} />
      <Route path="/audit" element={<Layout><AuditLog /></Layout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
