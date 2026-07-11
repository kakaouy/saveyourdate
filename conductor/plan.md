# Implementation Plan: Private Admin Dashboard Module

## Background & Motivation
Currently, "Save Your Date" offers premium plans (Silver and Gold) where users manage their RSVPs via a Google Sheet. The new requirement introduces a "Private Admin Dashboard" specifically for the Gold plan (or all premium plans). This dashboard provides a secure, passwordless entry (Email/Phone + Validation Code) to access an interactive control panel where hosts can view real-time metrics, arrange tables, and send WhatsApp reminders directly from the application.

## Scope & Impact
- **App.tsx**: Add new states for authentication (`isAdminLoggedIn`, `adminLoginStep`). Implement the Login UI and the full-screen Admin Dashboard View. Add new translation keys for the dashboard to ES, EN, and PT.
- **App.css**: Add new styles for the admin dashboard layout, sidebar/navigation, metric cards, table arrangement drag-and-drop/dropdown UI, and guest lists.
- **Data/Models**: Add mock RSVP guest data and table structure to simulate the dashboard experience since no backend exists.

## Proposed Solution (App Takeover View)
We will implement an App Takeover approach. When the user successfully authenticates using their validation code, the main application view will be completely replaced by the Admin Dashboard.

### 1. Authentication View
- Accessible via a new "Ingresar / Mi Evento" button in the main navigation.
- Shows a clean form requesting: Email/Phone and Validation Code (e.g., WEDDING2026).
- Successful validation sets `isAdminLoggedIn = true`.

### 2. Dashboard Layout
- **Sidebar/Header**: Contains the event name (e.g., "Boda de Sofía & Mateo"), a menu to switch between "Vista General", "Invitados", and "Mesas", and a "Cerrar Sesión / Volver" button to exit back to the landing page.
- **Vista General (Overview)**: High-level metric cards showing total confirmed, pending, adults, kids, and special diets.
- **Invitados (Guest List)**: A table of guests with their RSVP status and a "WhatsApp" button to send reminders to pending guests.
- **Mesas (Table Assignment)**: A visual area to group confirmed guests into "Mesa 1", "Mesa 2", etc.

## Alternatives Considered
- **Full-Screen Modal Overlay**: Considered opening the admin panel as a modal over the landing page. Rejected by user preference in favor of a clean, dedicated app-takeover view.

## Implementation Plan

### Phase 1: Authentication & Navigation Setup
1. Add the "Ingresar" button to the desktop and mobile navigation menus.
2. Add new states `showAdminLogin` and `isAdminLoggedIn` to `App.tsx`.
3. Create the Login Form UI that replaces the main content or opens before takeover.
4. Add the translation keys for the new module.

### Phase 2: Mock Data & Dashboard Structure
1. Create mock guest list data with various statuses (confirmed, pending, declined, adults, kids, diets) in `App.tsx` state.
2. Create the main wrapper for the `<AdminDashboard>` functional component (or render block) to replace the landing page when `isAdminLoggedIn` is true.

### Phase 3: Dashboard Views UI
1. **Overview Tab**: Implement the summary cards with dynamic metric counts.
2. **Guests Tab**: Implement the guest list table and the WhatsApp action button.
3. **Tables Tab**: Implement a simplified drag-and-drop or dropdown-based table assignment UI.
4. Update `App.css` with sleek, modern, and responsive styles for these components.

## Verification
- Test passwordless login with mock code `WEDDING2026`.
- Verify the app correctly transitions from the landing page to the dashboard.
- Check that the metrics correctly aggregate the mock data.
- Ensure the table assignment interface is functional and responsive on mobile devices.
- Verify the "Volver al Inicio" (Logout) button returns to the landing page safely without breaking styles.

## Migration & Rollback
- Since there is no backend, all changes are front-end state additions. If issues arise, we can rollback the Git commit. The existing `App.tsx` state will not be broken as the new view is conditionally rendered cleanly alongside the main layout.