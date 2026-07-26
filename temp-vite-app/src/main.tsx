import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import OrderStatusPage from './components/OrderStatusPage.tsx'
import PaymentValidationPage from './components/PaymentValidationPage.tsx'
import PreparationPreviewPage from './components/PreparationPreviewPage.tsx'
import OrderLookupPage from './components/OrderLookupPage.tsx'

const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
const Page = pathname === '/estado'
  ? OrderStatusPage
  : pathname === '/consultar'
    ? OrderLookupPage
  : pathname === '/validar-pago'
    ? PaymentValidationPage
    : pathname === '/preparando'
      ? PreparationPreviewPage
    : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
