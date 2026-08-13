import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'

const App = lazy(() => import('./App.tsx'))
const OrderStatusPage = lazy(() => import('./components/OrderStatusPage.tsx'))
const PaymentValidationPage = lazy(() => import('./components/PaymentValidationPage.tsx'))
const PreparationPreviewPage = lazy(() => import('./components/PreparationPreviewPage.tsx'))
const OrderLookupPage = lazy(() => import('./components/OrderLookupPage.tsx'))
const GuestRsvpPage = lazy(() => import('./components/GuestRsvpPage.tsx'))
const PublishedInvitationPage = lazy(() => import('./components/PublishedInvitationPage.tsx'))
const InvitationReviewPage = lazy(() => import('./components/InvitationReviewPage.tsx'))
const AdminPrototype = lazy(() => import('./components/AdminPrototype.tsx'))

const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
const Page = pathname === '/estado'
  ? OrderStatusPage
  : pathname === '/consultar'
    ? OrderLookupPage
  : pathname === '/admin'
    ? AdminPrototype
  : pathname === '/confirmar'
    ? GuestRsvpPage
  : pathname === '/validar-pago'
    ? PaymentValidationPage
    : pathname === '/preparando'
      ? PreparationPreviewPage
    : pathname.startsWith('/i/')
      ? PublishedInvitationPage
    : pathname === '/revision-invitacion'
      ? InvitationReviewPage
    : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<main className="route-loading" aria-live="polite">Cargando…</main>}>
      <Page />
    </Suspense>
  </StrictMode>,
)
