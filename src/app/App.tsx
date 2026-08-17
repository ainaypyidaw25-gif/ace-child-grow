import { Routes, Route, Navigate } from 'react-router-dom';
import { Authenticated, Unauthenticated, AuthLoading, useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Layout } from '../components/Layout';
import { useAppState } from './AppState';
import { decideRoute } from './bootstrap';
import { SignIn } from '../screens/SignIn';
import { api } from '../../convex/_generated/api';
import { getPortalMode, setPortalMode } from './portalMode';
import { decideStaffRoute } from './staffRoute';
import { isAppleAppStoreBuild, isNativeStoreBuild, useNativeDeepLinks } from './platform';
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import { useLocale } from './LocaleContext';
import { useOfflineWithdrawal } from './useOfflineLibrary';

const Welcome = lazy(() => import('../screens/Welcome').then((module) => ({ default: module.Welcome })));
const Consent = lazy(() => import('../screens/Consent').then((module) => ({ default: module.Consent })));
const AddChild = lazy(() => import('../screens/AddChild').then((module) => ({ default: module.AddChild })));
const EditChild = lazy(() => import('../screens/EditChild').then((module) => ({ default: module.EditChild })));
const Home = lazy(() => import('../screens/Home').then((module) => ({ default: module.Home })));
const MilestoneDemo = lazy(() => import('../screens/MilestoneDemo').then((module) => ({ default: module.MilestoneDemo })));
const Activities = lazy(() => import('../screens/Activities').then((module) => ({ default: module.Activities })));
const APP_STORE_DISTRIBUTION = import.meta.env.VITE_DISTRIBUTION === 'app-store';
const WeeklyPlan = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/WeeklyPlan').then((module) => ({ default: module.WeeklyPlan })));
const Growth = lazy(() => import('../screens/Growth').then((module) => ({ default: module.Growth })));
const Sleep = lazy(() => import('../screens/Sleep').then((module) => ({ default: module.Sleep })));
const Learn = lazy(() => import('../screens/Learn').then((module) => ({ default: module.Learn })));
const HopeCenter = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/HopeCenter').then((module) => ({ default: module.HopeCenter })));
const Report = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/Report').then((module) => ({ default: module.Report })));
const Profile = lazy(() => import('../screens/Profile').then((module) => ({ default: module.Profile })));
const OfflineDownloads = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/OfflineDownloads').then((module) => ({ default: module.OfflineDownloads })));
const Favorites = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/Favorites').then((module) => ({ default: module.Favorites })));
const Notifications = lazy(() => import('../screens/Notifications').then((module) => ({ default: module.Notifications })));
const HealthcareDirectory = lazy(() => import('../screens/HealthcareDirectory').then((module) => ({ default: module.HealthcareDirectory })));
const ChildProfile = lazy(() => import('../screens/ChildProfile').then((module) => ({ default: module.ChildProfile })));
const MilestoneGallery = lazy(() => import('../screens/MilestoneGallery').then((module) => ({ default: module.MilestoneGallery })));
const MilestoneKeepsake = lazy(() => import('../screens/MilestoneKeepsake').then((module) => ({ default: module.MilestoneKeepsake })));
const AuditLog = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/AuditLog').then((module) => ({ default: module.AuditLog })));
const AdminReviewQueue = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/AdminReviewQueue').then((module) => ({ default: module.AdminReviewQueue })));
const ContentLibrary = lazy(() => import('../screens/ContentLibrary').then((module) => ({ default: module.ContentLibrary })));
const ContentDetail = lazy(() => import('../screens/ContentDetail').then((module) => ({ default: module.ContentDetail })));
const LibraryAdmin = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/LibraryAdmin').then((module) => ({ default: module.LibraryAdmin })));
const EvidenceAdmin = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/EvidenceAdmin').then((module) => ({ default: module.EvidenceAdmin })));
const AdminTeam = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/AdminTeam').then((module) => ({ default: module.AdminTeam })));
const AcceptAdminInvite = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/AcceptAdminInvite').then((module) => ({ default: module.AcceptAdminInvite })));
const AdminDirectory = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/AdminDirectory').then((module) => ({ default: module.AdminDirectory })));
const AdminBilling = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/AdminBilling').then((module) => ({ default: module.AdminBilling })));
const ContentReviewWorkspace = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/ContentReviewWorkspace').then((module) => ({ default: module.ContentReviewWorkspace })));
const AdminReviewActivity = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/AdminReviewActivity').then((module) => ({ default: module.AdminReviewActivity })));
const SubscriptionPlans = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/SubscriptionPlans').then((module) => ({ default: module.SubscriptionPlans })));
const PaymentStatus = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/PaymentStatus').then((module) => ({ default: module.PaymentStatus })));
const Appointments = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/Appointments').then((module) => ({ default: module.Appointments })));
const HealthRecords = lazy(() => import('../screens/HealthRecords').then((module) => ({ default: module.HealthRecords })));
const ObservationJournal = APP_STORE_DISTRIBUTION ? null : lazy(() => import('../screens/ObservationJournal').then((module) => ({ default: module.ObservationJournal })));
const LegalPage = lazy(() => import('../screens/LegalPage').then((module) => ({ default: module.LegalPage })));

// Authentication gate: unauthenticated visitors see sign-in; the app (and all
// child data) is only reachable once signed in.
export function App() {
  useNativeDeepLinks();
  return (
    <Routes>
      <Route path="/privacy" element={<StandaloneScreen><LegalPage kind="privacy" /></StandaloneScreen>} />
      <Route path="/account-deletion" element={<StandaloneScreen><LegalPage kind="account-deletion" /></StandaloneScreen>} />
      <Route path="/terms" element={<StandaloneScreen><LegalPage kind="terms" /></StandaloneScreen>} />
      <Route path="/support" element={<StandaloneScreen><LegalPage kind="support" /></StandaloneScreen>} />
      <Route path="*" element={<>
      <AuthLoading>
        <AuthSplash />
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

// The splash shown while Convex confirms a stored session. It normally lasts a
// moment, but a failed token refresh (deployment / auth-key rotation, an expired
// or already-consumed refresh token) or an offline launch can leave Convex
// unable to confirm the session — with no error and no timeout, the "…" would
// spin forever and the user could never even reach sign-in. After a short wait
// we surface an escape: reload, or sign out (clearing the stale token) and start
// over. This is the fix for the "opens but loads forever / can't get in" report.
function AuthSplash() {
  const { locale } = useLocale();
  const { signOut } = useAuthActions();
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setStuck(true), 8000);
    return () => clearTimeout(timer);
  }, []);
  if (!stuck) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-soft" role="status" aria-live="polite">
        <span className="animate-pulse">…</span>
      </div>
    );
  }
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <div aria-hidden className="text-4xl">🌱</div>
      <p className="text-sm text-ink-soft">
        {locale === 'mm'
          ? 'အချိန်အနည်းငယ် ကြာနေပါသည် — အင်တာနက် နှေးနေခြင်း သို့မဟုတ် အကောင့်ဝင်ချိန် သက်တမ်းကုန်နေခြင်း ဖြစ်နိုင်ပါသည်။'
          : 'This is taking longer than usual — your connection may be slow, or your session may have expired.'}
      </p>
      <div className="flex w-full flex-col gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-touch w-full rounded-pill bg-sky px-6 py-3 font-semibold text-white"
        >
          {locale === 'mm' ? 'ပြန်လည်စတင်မည်' : 'Reload'}
        </button>
        <button
          type="button"
          onClick={() => { void signOut().finally(() => window.location.assign('/')); }}
          className="min-h-touch w-full rounded-pill border border-line bg-white px-6 py-3 font-semibold text-ink"
        >
          {locale === 'mm' ? 'ထွက်ပြီး ပြန်ဝင်မည်' : 'Sign out and sign in again'}
        </button>
      </div>
    </div>
  );
}

// Bootstrap gate for the index route. Decides where an authenticated user lands
// based on SERVER state (consent + children), and never redirects while those
// queries are still loading. This is the fix for returning users being asked to
// add a child again on every login.
function Bootstrap() {
  const { locale } = useLocale();
  const { signOut } = useAuthActions();
  const { ready, hasChild, state } = useAppState();
  const wantsStaffPortal = !isAppleAppStoreBuild() && getPortalMode() === 'staff';
  const staffAccess = useQuery(api.admin.myAccess, wantsStaffPortal ? {} : 'skip');
  if (wantsStaffPortal && staffAccess === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-soft" role="status" aria-live="polite">
        <span className="animate-pulse">…</span>
      </div>
    );
  }
  if (wantsStaffPortal) {
    if (staffAccess?.isStaff) return <Navigate to="/admin" replace />;
    return (
      <ResetStaffPortalMode>
        <Layout showNav={false}>
          <div className="rounded-card border border-line bg-white p-5 shadow-card">
            <h1 className="font-bold text-ink">
              {locale === 'mm' ? 'ဤအကောင့်ဖြင့် စီမံခန့်ခွဲရေးဝင်ခွင့် မရှိပါ' : 'This sign-in has no staff access'}
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              {locale === 'mm'
                ? 'သင်သည် ပိုင်ရှင် သို့မဟုတ် သုံးသပ်သူဆိုပါက — ခွင့်ပြုထားသည့် နည်းလမ်းနှင့် မတူဘဲ ဝင်မိနိုင်ပါသည် (ဥပမာ — Google နှင့် အီးမေးလ်/PIN မတူ)။ ထွက်ပြီး အခြားနည်းဖြင့် ပြန်ဝင်ကြည့်ပါ။ မဟုတ်ပါက ပိုင်ရှင်ထံ ဤအီးမေးလ်ကို staff အဖြစ် သတ်မှတ်ပေးရန် အကြောင်းကြားပါ။'
                : 'If you are the owner or a reviewer, you may have signed in a different way than the one that was granted access (for example Google vs email/PIN). Sign out and try the other method. Otherwise, ask the owner to grant staff access to this email.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="/" className="inline-block rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white">
                {locale === 'mm' ? 'မိဘစာမျက်နှာသို့ သွားမည်' : 'Go to the parent app'}
              </a>
              <button
                type="button"
                onClick={() => { void signOut().finally(() => window.location.assign('/')); }}
                className="inline-block rounded-pill border border-line bg-white px-5 py-2 text-sm font-semibold text-ink"
              >
                {locale === 'mm' ? 'ထွက်ပြီး အခြားနည်းဖြင့် ဝင်မည်' : 'Sign out and try another sign-in'}
              </button>
            </div>
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
  const nativeStoreBuild = isNativeStoreBuild();
  const appleAppStoreBuild = isAppleAppStoreBuild();
  useOfflineWithdrawal();
  return (
    <Routes>
      <Route path="/" element={<Bootstrap />} />
      <Route path="/consent" element={<AppScreen showNav={false}><Consent /></AppScreen>} />
      <Route path="/add-child" element={<AppScreen showNav={false}><AddChild /></AppScreen>} />
      <Route path="/edit-child" element={<AppScreen showNav={false}><EditChild /></AppScreen>} />
      <Route path="/home" element={<AppScreen><Home /></AppScreen>} />
      <Route path="/journey" element={<AppScreen><MilestoneDemo /></AppScreen>} />
      <Route path="/activities" element={<AppScreen><Activities /></AppScreen>} />
      <Route path="/weekly-plan" element={appleAppStoreBuild || !WeeklyPlan ? <Navigate to="/home" replace /> : <AppScreen><WeeklyPlan /></AppScreen>} />
      <Route path="/learn" element={<AppScreen><Learn /></AppScreen>} />
      <Route path="/hope" element={appleAppStoreBuild || !HopeCenter ? <Navigate to="/home" replace /> : <AppScreen><HopeCenter /></AppScreen>} />
      <Route path="/growth" element={<AppScreen><Growth /></AppScreen>} />
      <Route path="/sleep" element={<AppScreen><Sleep /></AppScreen>} />
      <Route path="/report" element={appleAppStoreBuild || !Report ? <Navigate to="/home" replace /> : <AppScreen><Report /></AppScreen>} />
      <Route path="/appointments" element={appleAppStoreBuild || !Appointments ? <Navigate to="/home" replace /> : <AppScreen><Appointments /></AppScreen>} />
      <Route path="/health" element={<AppScreen><HealthRecords /></AppScreen>} />
      <Route path="/profile" element={<AppScreen><Profile /></AppScreen>} />
      <Route path="/subscription" element={nativeStoreBuild || !SubscriptionPlans ? <Navigate to="/home" replace /> : <AppScreen><SubscriptionPlans /></AppScreen>} />
      <Route path="/payment/success/:orderId" element={nativeStoreBuild || !PaymentStatus ? <Navigate to="/home" replace /> : <AppScreen><PaymentStatus view="success" /></AppScreen>} />
      <Route path="/payment/cancel/:orderId" element={nativeStoreBuild || !PaymentStatus ? <Navigate to="/home" replace /> : <AppScreen><PaymentStatus view="cancel" /></AppScreen>} />
      <Route path="/payment/:orderId" element={nativeStoreBuild || !PaymentStatus ? <Navigate to="/home" replace /> : <AppScreen><PaymentStatus /></AppScreen>} />
      <Route path="/offline" element={appleAppStoreBuild || !OfflineDownloads ? <Navigate to="/home" replace /> : <AppScreen><OfflineDownloads /></AppScreen>} />
      <Route path="/favorites" element={appleAppStoreBuild || !Favorites ? <Navigate to="/home" replace /> : <AppScreen><Favorites /></AppScreen>} />
      <Route path="/notifications" element={<AppScreen><Notifications /></AppScreen>} />
      <Route path="/directory" element={<AppScreen><HealthcareDirectory /></AppScreen>} />
      <Route path="/child-profile" element={<AppScreen><ChildProfile /></AppScreen>} />
      <Route path="/milestone-gallery" element={<AppScreen><MilestoneGallery /></AppScreen>} />
      <Route path="/milestone-gallery/:responseId/keepsake" element={<AppScreen><MilestoneKeepsake /></AppScreen>} />
      <Route path="/observations" element={appleAppStoreBuild || !ObservationJournal ? <Navigate to="/home" replace /> : <AppScreen><ObservationJournal /></AppScreen>} />
      <Route path="/library" element={<AppScreen><ContentLibrary /></AppScreen>} />
      <Route path="/content/:slug" element={<AppScreen><ContentDetail /></AppScreen>} />
      <Route path="/admin" element={appleAppStoreBuild || !AdminReviewQueue ? <Navigate to="/home" replace /> : <StaffOnlyRoute><AppScreen><AdminReviewQueue /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/library" element={appleAppStoreBuild || !LibraryAdmin ? <Navigate to="/home" replace /> : <StaffOnlyRoute><AppScreen><LibraryAdmin /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/reviews" element={appleAppStoreBuild || !ContentReviewWorkspace ? <Navigate to="/home" replace /> : <StaffOnlyRoute><AppScreen><ContentReviewWorkspace /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/review-activity" element={appleAppStoreBuild || !AdminReviewActivity ? <Navigate to="/home" replace /> : <StaffOnlyRoute><AppScreen><AdminReviewActivity /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/evidence" element={appleAppStoreBuild || !EvidenceAdmin ? <Navigate to="/home" replace /> : <StaffOnlyRoute><AppScreen><EvidenceAdmin /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/team" element={appleAppStoreBuild || !AdminTeam ? <Navigate to="/home" replace /> : <StaffOnlyRoute><AppScreen><AdminTeam /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/directory" element={appleAppStoreBuild || !AdminDirectory ? <Navigate to="/home" replace /> : <StaffOnlyRoute><AppScreen><AdminDirectory /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/billing" element={appleAppStoreBuild || !AdminBilling ? <Navigate to="/home" replace /> : <StaffOnlyRoute><AppScreen><AdminBilling /></AppScreen></StaffOnlyRoute>} />
      <Route path="/admin/accept-invite" element={appleAppStoreBuild || !AcceptAdminInvite ? <Navigate to="/home" replace /> : <AppScreen showNav={false}><AcceptAdminInvite /></AppScreen>} />
      <Route path="/admin/accept-invite/:inviteCode" element={appleAppStoreBuild || !AcceptAdminInvite ? <Navigate to="/home" replace /> : <AppScreen showNav={false}><AcceptAdminInvite /></AppScreen>} />
      <Route path="/audit" element={appleAppStoreBuild || !AuditLog ? <Navigate to="/home" replace /> : <StaffOnlyRoute><AppScreen><AuditLog /></AppScreen></StaffOnlyRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
