# Dayflow — HR Management System
_Every workday, perfectly aligned._

A fully working front-end HRMS prototype built for your hackathon: authentication, role-based
dashboards, attendance with live check-in/out, leave workflow with approvals, and payroll —
wrapped in a distinctive, animated UI (see the **Day Arc** — the live workday timeline on the
sign-in screen and every dashboard).

Original requirements doc referenced: `Dayflow - Human Resource Management System.pdf`
Wireframe reference: https://link.excalidraw.com/l/65VNwvy7c4X/58RLEJ4oOwh

## Run it
No build step, no install. Just open it:
1. Unzip the folder.
2. Double-click `index.html` (or serve it: `python3 -m http.server 8000` then visit `http://localhost:8000`).
3. Sign in with a demo account below, or sign up as a new Employee/HR user.

> Serving over `http://` (rather than `file://`) is recommended so the Google Fonts load correctly.

## Demo credentials
| Role | Email | Password |
|---|---|---|
| HR / Admin | `ananya.hr@dayflow.io` | `Admin@123` |
| Employee | `rahul.mehta@dayflow.io` | `Employee@123` |

Data (users, attendance, leave, payroll) is seeded on first load and persisted in your browser's
`localStorage`, so anything you do — check in, apply for leave, approve a request, edit salary —
sticks around on refresh. To reset to a clean demo state, open the browser console and run:
```js
Store.reset(); location.reload();
```

## What's implemented (mapped to the spec)
- **3.1 Authentication** — Sign up (Employee ID, email, password, role, live password-strength
  checklist, simulated email verification) and sign in (error states, redirect to dashboard).
- **3.2 Dashboard** — Separate Employee and Admin/HR overviews: quick-access cards, recent
  activity feed, live "Day Arc," and role-specific stats.
- **3.3 Profile management** — View personal/job details, documents; employees edit limited
  fields (phone, address, photo), admins can edit any employee's job details.
- **3.4 Attendance** — Daily/weekly view, check-in/check-out with a live progress ring,
  present/absent/half-day/leave status coding, admin can view any employee's history and switch
  between employees.
- **3.5 Leave & time-off** — Apply for Paid/Sick/Unpaid leave with date range and remarks;
  pending/approved/rejected states; admin approves/rejects with a comment, reflected instantly.
- **3.6 Payroll** — Read-only payslip + net-pay trend chart for employees; admin table of all
  salaries with an edit-salary modal, plus aggregate payroll stats.

## Tech
Plain HTML/CSS/JS (no framework, no build tools) so it runs anywhere instantly — ideal for a
hackathon demo. `localStorage` acts as the mock backend. Fonts: Space Grotesk, Inter, JetBrains
Mono via Google Fonts CDN (falls back to system fonts offline).

## File structure
```
dayflow/
├── index.html          Sign in / sign up
├── app.html             Main application shell (sidebar + routed sections)
├── css/
│   ├── style.css        Design tokens & shared components
│   ├── auth.css         Sign in/up screen
│   └── app.css          Dashboard shell & section layouts
├── js/
│   ├── store.js         Mock data + localStorage persistence
│   ├── dayarc.js         Signature "Day Arc" live widget
│   ├── icons.js          Inline SVG icon set
│   ├── toast.js          Toast notifications
│   ├── auth.js           Sign in/up logic
│   └── app.js            Routing + all dashboard sections
└── README.md
```

## Ideas if you have more hackathon time left
- Swap `localStorage` for a real backend (Firebase/Supabase are fastest to wire up).
- Add push/email notifications for leave decisions.
- Export payslips as PDF (there's a `pdf` generation pattern you can reuse from Claude).
- Add a calendar heatmap view for yearly attendance.
