import { Routes, Route, Navigate } from 'react-router-dom';
import { Authenticated, Unauthenticated, AuthLoading, useQuery } from 'convex/react';
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Layout } from '../components/Layout';
import { useAppState } from './AppState';
import { decideRoute } from './bootstrap';
import { SignIn } from '../screens/SignIn';
import { api } from '../../convex/_generated/api';
import { getPortalMode, setPortalMode } from './portalMode';
import { decideStaffRoute } from './staffRoute';
import { isGooglePlayBuild, useNativeDeepLinks } from './platform';

const Welcome = lazy(() => import('../screens/Welcome').then((module) => ({ default: module.Welcome })));
const Consent = lazy(() => import('../screens/Consent').then((module) => ({ default: module.Consent })));
const AddChild = lazy(() => import('../screens/AddChild').then((module) => ({ default: module.AddChild })));
const EditChild = lazy(() => import('../screens/EditChild').then((module) => ({ default: module.EditChild })));
const Home = lazy(() => import('../screens/Home').then((module) => ({ default: module.Home })));
const MilestoneDemo = lazy(() => import('../screens/MilestoneDemo').then((module) => ({ default: module.MilestoneDemo })));
const Activities = lazy(() => import('../screens/Activities').then((module) => ({ default: module.Activities })));
const Growth = lazy(() => import('../screens/Growth').then((module) => ({ default: module.Growth })));
const Sleep = lazy(() => import('../screens/Sleep').then((module) => ({ default: module.Sleep })));
const Learn = lazy(() => import('../screens/Learn').then((module) => ({ default: module.Learn })));
const HopeCenter = lazy(() => import('../screens/HopeCenter').then((module) => ({ default: module.HopeCenter })));
const Report = lazy(() => import('../screens/Report').then((module) => ({ default: module.Report })));
const Profile = lazy(() => import('../screens/Profile').then((module) => ({ default: module.Profile })));
const OfflineDownloads = lazy(() => import('../screens/OfflineDownloads').then((module) => ({ default: module.OfflineDownloads })));
const Favorites = lazy(() => import('../screens/Favorites').then((module) => ({ default: module.Favorites })));
const Notifications = lazy(() => import('../screens/Notifications').then((module) => ({ default: module.Notifications })));
const HealthcareDirectory = lazy(() => import('../screens/HealthcareDirectory').then((module) => ({ default: module.HealthcareDirectory })));
const ChildProfile = lazy(() => import('../screens/ChildProfile').then((module) => ({ default: module.ChildProfile })));
const AuditLog = lazy(() => import('../screens/AuditLog').then((module) => ({ default: module.AuditLog })));
const AdminReviewQueue = lazy(() => import('../screens/AdminReviewQueue').then((module) => ({ default: module.AdminReviewQueue })));
const ContentLibrary = lazy(() => import('../screens/ContentLibrary').then((module) => ({ default: module.ContentLibrary })));
const ContentDetail = lazy(() => import('../screens/ContentDetail').then((module) => ({ default: module.ContentDetail })));
const LibraryAdmin = lazy(() => import('../screens/LibraryAdmin').then((module) => ({ default: module.LibraryAdmin })));
const EvidenceAdmin = lazy(() => import('../screens/EvidenceAdmin').then((module) => ({ default: module.EvidenceAdmin })));
const AdminTeam = lazy(() => import('../screens/AdminTeam').then((module) => ({ default: module.AdminTeam })));
const AcceptAdminInvite = lazy(() => import('../screens/AcceptAdminInvite').then((module) => ({ default: module.AcceptAdminInvite })));
const AdminDirectory = lazy(() => import('../screens/AdminDirectory').then((module) => ({ default: module.AdminDirectory })));
const AdminBilling = lazy(() => import('../screens/AdminBilling').then((module) => ({ default: module.AdminBilling })));
const ContentReviewWorkspace = lazy(() => import('../screens/ContentReviewWorkspace').then((module) => ({ default: module.ContentReviewWorkspace })));
const SubscriptionPlans = lazy(() => import('../screens/SubscriptionPlans').then((module) => ({ default: module.SubscriptionPlans })));
const PaymentStatus = lazy(() => import('../screens/PaymentStatus').then((module) => ({ default: module.PaymentStatus })));
const Appointments = lazy(() => import('../screens/Appointments').then((module) => ({ default: module.Appointments })));
const LegalPage = lazy(() => import('../screens/LegalPage').then((module) => ({ default: module.LegalPage })));

// Authentication gate: unauthenticated visitors see sign-in; the app (and all
// child data) is only reachable once signed in.
export function App() {
  useNativeDeepLinks();
  return (
    <Routes>
      <Route path="/privacy" element={<Suspense fallback={<div className="min-h-screen bg-surface" />}><LegalPage kind="privacy" /></Suspense>} />
      <Route path="/account-deletion" element={<Suspense fallback={<div className="min-h-screen bg-surface" />}><LegalPage kind="account-deletion" /></Suspense>} />
      <Route path="*" element={<>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center text-ink-soft">…</div>
      </AuthLoading>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
      <Authenticated>
        <AppRoutes />
      </Authenticated>
      </>} />
    </Routes>
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

function ResetStaffPortalMode({ children }: { children: ReactNode }) {
  useEffect(() => {
    setPortalMode('parent');
  }, []);
  return children;
}

function StaffOnlyRoute({ children }: { children: ReactNode }) {
  const access = useQuery(api.admin.myAccess);
  const decision = decideStaffRoute(access);

  if (decision === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-ink-soft" role="status" aria-live="polite">
        <span className="animate-pulse">…</span>
      </div>
    );
  }

  return decision === 'allow' ? children : <Navigate to="/home" replace />;
}

function AppRoutes() {
  const googlePlayBuild = isGooglePlayBuild();
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-ink-soft" role="status" aria-live="polite">…</div>}>
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
      <Route path="/appointments" element={<Layout><Appointments /></Layout>} />
      <Route path="/profile" element={<Layout><Profile /></Layout>} />
      <Route path="/subscription" element={<Layout><SubscriptionPlans /></Layout>} />
      <Route path="/payment/success/:orderId" element={googlePlayBuild ? <Navigate to="/home" replace /> : <Layout><PaymentStatus view="success" /></Layout>} />
      <Route path="/payment/cancel/:orderId" element={googlePlayBuild ? <Navigate to="/home" replace /> : <Layout><PaymentStatus view="cancel" /></Layout>} />
      <Route path="/payment/:orderId" element={googlePlayBuild ? <Navigate to="/home" replace /> : <Layout><PaymentStatus /></Layout>} />
      <Route path="/offline" element={<Layout><OfflineDownloads /></Layout>} />
      <Route path="/favorites" element={<Layout><Favorites /></Layout>} />
      <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
      <Route path="/directory" element={<Layout><HealthcareDirectory /></Layout>} />
      <Route path="/child-profile" element={<Layout><ChildProfile /></Layout>} />
      <Route path="/library" element={<Layout><ContentLibrary /></Layout>} />
      <Route path="/content/:slug" element={<Layout><ContentDetail /></Layout>} />
      <Route path="/admin" element={<StaffOnlyRoute><Layout><AdminReviewQueue /></Layout></StaffOnlyRoute>} />
      <Route path="/admin/library" element={<StaffOnlyRoute><Layout><LibraryAdmin /></Layout></StaffOnlyRoute>} />
      <Route path="/admin/reviews" element={<StaffOnlyRoute><Layout><ContentReviewWorkspace /></Layout></StaffOnlyRoute>} />
      <Route path="/admin/evidence" element={<StaffOnlyRoute><Layout><EvidenceAdmin /></Layout></StaffOnlyRoute>} />
      <Route path="/admin/team" element={<StaffOnlyRoute><Layout><AdminTeam /></Layout></StaffOnlyRoute>} />
      <Route path="/admin/directory" element={<StaffOnlyRoute><Layout><AdminDirectory /></Layout></StaffOnlyRoute>} />
      <Route path="/admin/billing" element={<StaffOnlyRoute><Layout><AdminBilling /></Layout></StaffOnlyRoute>} />
      <Route path="/admin/accept-invite" element={<Layout showNav={false}><AcceptAdminInvite /></Layout>} />
      <Route path="/admin/accept-invite/:inviteCode" element={<Layout showNav={false}><AcceptAdminInvite /></Layout>} />
      <Route path="/audit" element={<StaffOnlyRoute><Layout><AuditLog /></Layout></StaffOnlyRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
