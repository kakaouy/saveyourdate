import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import OrderStatusPage from './components/OrderStatusPage.tsx'
import PaymentValidationPage from './components/PaymentValidationPage.tsx'

const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
const Page = pathname === '/estado'
  ? OrderStatusPage
  : pathname === '/validar-pago'
    ? PaymentValidationPage
    : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
