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
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import { useLocale } from './LocaleContext';

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
const AdminReviewActivity = lazy(() => import('../screens/AdminReviewActivity').then((module) => ({ default: module.AdminReviewActivity })));
const SubscriptionPlans = lazy(() => import('../screens/SubscriptionPlans').then((module) => ({ default: module.SubscriptionPlans })));
const PaymentStatus = lazy(() => import('../screens/PaymentStatus').then((module) => ({ default: module.PaymentStatus })));
const Appointments = lazy(() => import('../screens/Appointments').then((module) => ({ default: module.Appointments })));
const HealthRecords = lazy(() => import('../screens/HealthRecords').then((module) => ({ default: module.HealthRecords })));
const LegalPage = lazy(() => import('../screens/LegalPage').then((module) => ({ default: module.LegalPage })));

// Authentication gate: unauthenticated visitors see sign-in; the app (and all
// child data) is only reachable once signed in.
export function App() {
  useNativeDeepLinks();
  return (
    <Routes>
      <Route path="/privacy" element={<StandaloneScreen><LegalPage kind="privacy" /></StandaloneScreen>} />
      <Route path="/account-deletion" element={<StandaloneScreen><LegalPage kind="account-deletion" /></StandaloneScreen>} />
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
      return <AppScreen showNav={false}><Welcome /></AppScreen>;
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

function PageLoading({ locale }: { locale: 'mm' | 'en' }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-5 text-center text-ink-soft" role="status" aria-live="polite">
      <span className="animate-pulse">
        {locale === 'mm' ? 'စာမျက်နှာ ဖွင့်နေပါသည်…' : 'Opening page…'}
      </span>
    </div>
  );
}

function AppScreen({ children, showNav = true }: { children: ReactNode; showNav?: boolean }) {
  const { locale } = useLocale();
  return (
    <Layout showNav={showNav}>
      <ScreenErrorBoundary locale={locale}>
        <Suspense fallback={<PageLoading locale={locale} />}>
          {children}
        </Suspense>
      </ScreenErrorBoundary>
    </Layout>
  );
}

function StandaloneScreen({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  return (
    <ScreenErrorBoundary locale={locale}>
      <Suspense fallback={<PageLoading locale={locale} />}>
        {children}
      </Suspense>
    </ScreenErrorBoundary>
  );
}

function AppRoutes() {
  const googlePlayBuild = isGooglePlayBuild();
  return (
    <Routes>
      <Route path="/" element={<Bootstrap />} />
      <Route path="/consent" element={<AppScreen showNav={false}><Consent /></AppScreen>} />
      <Route path="/add-child" element={<AppScreen showNav={false}><AddChild /></AppScreen>} />
      <Route path="/edit-child" element={<AppScreen showNav={false}><EditChild /></AppScreen>} />
      <Route path="/home" element={<AppScreen><Home /></AppScreen>} />
      <Route path="/journey" element={<AppScreen><MilestoneDemo /></AppScreen>} />
      <Route path="/activities" element={<AppScreen><Activities /></AppScreen>} />
      <Route path="/learn" element={<AppScreen><Learn /></AppScreen>} />
      <Route path="/hope" element={<AppScreen><HopeCenter /></AppScreen>} />
      <Route path="/growth" element={<AppScreen><Growth /></AppScreen>} />
      <Route path="/sleep" element={<AppScreen><Sleep /></AppScreen>} />
      <Route path="/report" element={<AppScreen><Report /></AppScreen>} />
      <Route path="/appointments" element={<AppScreen><Appointments /></AppScreen>} />
      <Route path="/health" element={<AppScreen><HealthRecords /></AppScreen>} />
      <Route path="/profile" element={<AppScreen><Profile /></AppScreen>} />
      <Route path="/subscription" element={<AppScreen><SubscriptionPlans /></AppScreen>} />
      <Route path="/payment/success/:orderId" element={googlePlayBuild ? <Navigate to="/home" replace /> : <AppScreen><PaymentStatus view="success" /></AppScreen>} />
      <Route path="/payment/cancel/:orderId" element={googlePlayBuild ? <Navigate to="/home" replace /> : <AppScreen><PaymentStatus view="cancel" /></AppScreen>} />
      <Route path="/payment/:orderId" element={googlePlayBuild ? <Navigate to="/home" replace /> : <AppScreen><PaymentStatus /></AppScreen>} />
      <Route path="/offline" element={<AppScreen><OfflineDownloads /></AppScreen>} />
      <Route path="/favorites" element={<AppScreen><Favorites /></AppScreen>} />
      <Route path="/notifications" element={<AppScreen><Notifications /></AppScreen>} />
      <Route path="/directory" element={<AppScreen><HealthcareDirectory /></AppScreen>} />
      <Route path="/child-profile" element={<AppScreen><ChildProfile /></AppScreen>} />
      <Route path="/library" element={<AppScreen><ContentLibrary /></AppScreen>} />
      <Route path="/content/:slug" element={<AppScreen><ContentDetail /></AppScreen>} />
      <Route path="/admin" element={<StaffOnlyRoute><AppScreen><AdminReviewQueue /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/library" element={<StaffOnlyRoute><AppScreen><LibraryAdmin /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/reviews" element={<StaffOnlyRoute><AppScreen><ContentReviewWorkspace /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/review-activity" element={<StaffOnlyRoute><AppScreen><AdminReviewActivity /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/evidence" element={<StaffOnlyRoute><AppScreen><EvidenceAdmin /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/team" element={<StaffOnlyRoute><AppScreen><AdminTeam /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/directory" element={<StaffOnlyRoute><AppScreen><AdminDirectory /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/billing" element={<StaffOnlyRoute><AppScreen><AdminBilling /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/accept-invite" element={<AppScreen showNav={false}><AcceptAdminInvite /></AppScreen>} />
      <Route path="/admin/accept-invite/:inviteCode" element={<AppScreen showNav={false}><AcceptAdminInvite /></AppScreen>} />
      <Route path="/audit" element={<StaffOnlyRoute><AppScreen><AuditLog /></AppScreen></StaffOnlyRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
