# Jwas Front

React/Vite web console for the Red Flag fraud detection system.

This frontend provides the main user and administrator interface for login, signup, live monitoring, report viewing, user pages, and the admin dashboard.

## Features

- Home page with entry point into the monitoring flow
- Login and signup screens
- Live monitoring page for transaction and detection status
- Report page for reviewing generated fraud results
- My page for user-facing account and transaction information
- Admin dashboard for fraud operations and suspicious transaction review

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- CSS
- html2pdf.js

## Project Structure

```text
src/
  lib/
    api.ts
  pages/
    AdminDashboard.tsx
    Home.tsx
    Login.tsx
    Monitor.tsx
    MyPage.tsx
    Report.tsx
    Signup.tsx
  styles/
    admin.css
    home.css
    login.css
    monitor.css
    mypage.css
    report.css
    signup.css
```

## Getting Started

```bash
npm install
npm run dev
```

The Vite development server usually starts at:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

## Related Repositories

- `fds-backend-node`: main API server used by the dashboard
- `Jwas_AI`: AI policy service used by backend workflows
- `RL_Back`: Spring Boot backend prototype
- `Jwas_Playwright`: browser automation and exploration support
