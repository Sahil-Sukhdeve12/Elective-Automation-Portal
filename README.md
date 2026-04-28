# Elective Automation Portal

A full-stack web platform for managing student elective course selection, built with the MERN stack.

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green)](https://nodejs.org/) [![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/) [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/)

---

## Features

**Student Portal**
- Browse and select electives by category (Departmental, Open, Humanities)
- View personalized recommendations and track academic progress
- Submit feedback on completed electives
- Receive system alerts and notifications

**Admin Dashboard**
- Manage students, electives, and tracks
- Create and manage feedback templates
- Send targeted alerts and view analytics
- Export data (CSV/PDF) and upload syllabus documents (PDF)
- Configure departments, sections, and semesters

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Utilities | Multer, Nodemailer, jsPDF, xlsx, Lucide React |

---

## Getting Started

### Prerequisites

- [Node.js v20+](https://nodejs.org/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier works)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Sahil-Sukhdeve12/Elective-Automation-Portal.git
cd Elective-Automation-Portal

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values (see below)

# 4. Start the application
npm start
```

App will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Required
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/elective-system
JWT_SECRET=your-random-secret-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Optional — Email (password reset links log to console if not set)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

> **Gmail users:** Generate an [App Password](https://myaccount.google.com/apppasswords) instead of using your account password.

---

## Default Admin Account

On first run, a default admin account is created automatically:

```
Email:    admin@college.edu
Password: admin123
```

> **Change this password immediately after first login.**

To promote a user to admin manually: update their `role` field to `"admin"` in the `users` MongoDB collection.

---

## Available Scripts

```bash
npm run dev          # Start frontend dev server (Vite)
npm run server:dev   # Start backend with auto-reload (nodemon)
npm start            # Start production server
npm run build        # Build frontend for production
npm run lint         # Run ESLint
```

---

## Project Structure

```
elective-automation-portal/
├── src/                    # Frontend (React + TypeScript)
│   ├── components/         # Reusable UI components
│   ├── contexts/           # Auth, Data, and Theme contexts
│   ├── pages/
│   │   ├── admin/          # Admin dashboard pages
│   │   └── student/        # Student portal pages
│   ├── services/           # API service layer
│   └── App.tsx
│
├── server/                 # Backend (Node.js + Express)
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express route handlers
│   └── middleware/         # Auth and error middleware
│
├── simple-server.cjs       # Server entry point
├── .env.example            # Environment variables template
└── vite.config.ts
```

---

## Deployment

### Render (Recommended)

**Backend:**
1. Create a new **Web Service** → connect your GitHub repo
2. Set Build Command: `npm install`, Start Command: `node simple-server.cjs`
3. Add all required environment variables

**Frontend:**
1. Create a new **Static Site** → same repo
2. Set Build Command: `npm install && npm run build`, Publish Directory: `dist`
3. Set `VITE_API_BASE_URL=https://your-backend.onrender.com/api`

### Vercel (Frontend only)

```bash
npm install -g vercel
vercel --prod
```

Set `VITE_API_BASE_URL` to your backend URL in Vercel project settings.

---

## Common Issues

| Problem | Fix |
|---------|-----|
| MongoDB auth error | Verify credentials in `MONGODB_URI`; whitelist `0.0.0.0/0` in Atlas Network Access |
| Port already in use | Change `PORT` in `.env`, or kill the process using that port |
| `npm install` fails | Run `npm cache clean --force`, delete `node_modules`, reinstall |
| Password reset not working | Email config is optional — check server console for reset URL |

---

## License

This project was developed for educational purposes as part of college coursework.
