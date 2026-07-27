import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import OrderStatusPage from './components/OrderStatusPage.tsx'
import PaymentValidationPage from './components/PaymentValidationPage.tsx'
import PreparationPreviewPage from './components/PreparationPreviewPage.tsx'
import OrderLookupPage from './components/OrderLookupPage.tsx'

const AdminPrototype = lazy(() => import('./components/AdminPrototype.tsx'))

const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
const Page = pathname === '/estado'
  ? OrderStatusPage
  : pathname === '/consultar'
    ? OrderLookupPage
  : pathname === '/admin'
    ? AdminPrototype
  : pathname === '/validar-pago'
    ? PaymentValidationPage
    : pathname === '/preparando'
      ? PreparationPreviewPage
    : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  </StrictMode>,
)
