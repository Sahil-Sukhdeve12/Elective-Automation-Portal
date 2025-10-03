# 🎓 Elective Management System

A complete web-based system for managing student elective course selection, built with React, TypeScript, Node.js, and MongoDB.

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start-3-steps)
- [Prerequisites](#-prerequisites)
- [Installation Guide](#-installation-guide)
- [Deployment](#-deployment)
- [Default Admin Account](#-default-admin-account)
- [Troubleshooting](#-troubleshooting)
- [Tech Stack](#-tech-stack)

---

## ✨ Features

### For Students:
- 📝 Browse and select electives
- 📊 View personalized recommendations
- 📈 Track academic progress
- 💬 Submit feedback on electives
- 🔔 Receive notifications and alerts

### For Administrators:
- 👥 Manage students and electives
- 📧 Send alerts and announcements
- 📊 View analytics and reports
- 📚 Upload syllabus documents (PDF)
- 🔧 System configuration management
- 📝 Review student feedback

---

## 🚀 Quick Start (3 Steps)

### Step 1: Get MongoDB Database URL
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a **FREE** account
3. Create a new cluster (free tier available)
4. Create a database user with password
5. Get your connection string (looks like `mongodb+srv://username:password@...`)

### Step 2: Configure Environment
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and update:
   ```bash
   MONGODB_URI=your-mongodb-url-from-step-1
   JWT_SECRET=any-random-secret-string-here
   ```

### Step 3: Install and Run
```bash
npm install
npm start
```

**That's it!** 🎉

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 📦 Prerequisites

Make sure you have these installed:

1. **Node.js** (v20.x or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **npm** (comes with Node.js)
   - Verify: `npm --version`

3. **MongoDB Atlas Account** (FREE)
   - Sign up: https://www.mongodb.com/cloud/atlas

---

## 📖 Installation Guide

### For Windows:

1. **Install Node.js**:
   ```powershell
   # Download and install from https://nodejs.org/
   # Or use winget:
   winget install OpenJS.NodeJS
   ```

2. **Clone or Download Project**:
   ```powershell
   # If using git:
   git clone <repository-url>
   cd project
   
   # Or extract the downloaded ZIP file
   ```

3. **Install Dependencies**:
   ```powershell
   npm install
   ```

4. **Configure Environment**:
   ```powershell
   # Copy the example file
   copy .env.example .env
   
   # Edit .env with Notepad
   notepad .env
   ```
   
   Update these values:
   ```
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/elective-system
   JWT_SECRET=my-college-project-2025-secret-key
   ```

5. **Start the Application**:
   ```powershell
   npm start
   ```

6. **Open in Browser**:
   - Main App: http://localhost:5173
   - Login with default admin (see below)

### For Mac/Linux:

```bash
# Install Node.js (if not installed)
# Mac: brew install node
# Linux: sudo apt install nodejs npm

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # or use any text editor

# Start application
npm start
```

---

## 🔐 Default Admin Account

On first run, the system automatically creates a default admin account:

```
📧 Email: admin@college.edu
🔑 Password: admin123
```

**⚠️ IMPORTANT**: Change this password immediately after first login!

### How to Change Admin Password:
1. Login with default credentials
2. Go to Profile → Change Password
3. Enter a strong new password

---

## 🌐 Deployment

### Option 1: Render.com (Recommended - Easiest)

1. **Create Account**: https://render.com
2. **New Web Service** → Connect GitHub repository
3. **Configure**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. **Add Environment Variables**:
   ```
   MONGODB_URI=your-mongodb-url
   JWT_SECRET=your-secret-key
   FRONTEND_URL=https://your-app-name.onrender.com
   NODE_ENV=production
   ```
5. **Deploy** → Your app will be live!

### Option 2: Vercel (Frontend) + Render (Backend)

**Frontend on Vercel:**
```bash
npm install -g vercel
vercel
```

**Backend on Render:**
- Follow Option 1 steps above

### Environment Variables Needed for Production:

```bash
# Required
MONGODB_URI=your-production-mongodb-url
JWT_SECRET=strong-random-secret-key
FRONTEND_URL=https://your-frontend-url.com
NODE_ENV=production

# Optional (for email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to MongoDB"

**Solution**:
- Check your `.env` file has correct `MONGODB_URI`
- Verify MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for testing)
- Ensure database user password is correct

### Problem: "Port 5000 already in use"

**Solution**:
```bash
# Windows:
netstat -ano | findstr :5000
taskkill /PID <process-id> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

Or change port in `.env`:
```bash
PORT=3000
```

### Problem: "npm install fails"

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Problem: "Forgot password not working"

**Solution**:
- Email configuration is OPTIONAL
- If email not configured, password reset link will be logged to server console
- Check terminal output for reset URL
- Copy URL and send to user manually

### Problem: "No admin account exists"

**Solution**:
- Delete `.env` and recreate from `.env.example`
- Restart server: `npm start`
- Default admin will be created automatically

---

## 🛠️ Tech Stack

### Frontend:
- ⚛️ **React 18** - UI Framework
- 📘 **TypeScript** - Type Safety
- ⚡ **Vite** - Build Tool
- 🎨 **TailwindCSS** - Styling
- 🔀 **React Router** - Navigation

### Backend:
- 🟢 **Node.js** - Runtime
- 🚂 **Express** - Web Framework
- 🍃 **MongoDB** - Database
- 🔐 **JWT** - Authentication
- 📧 **Nodemailer** - Email (Optional)

### Libraries:
- 🔒 `bcryptjs` - Password Hashing
- 📄 `jspdf` - PDF Generation
- 📊 `xlsx` - Excel Export
- 🎨 `lucide-react` - Icons

---

## 📝 Scripts

```bash
# Development
npm run dev          # Start frontend dev server
npm run server:dev   # Start backend with auto-reload

# Production
npm run build        # Build frontend for production
npm start            # Start production server

# Both (Development)
npm run start:local  # Build frontend + start backend

# Linting
npm run lint         # Check code quality
```

---

## 📧 Email Configuration (Optional)

Email is **NOT required** for the system to work. If you want to enable email notifications:

### Gmail Setup:
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `.env`:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   EMAIL_FROM="Elective System <noreply@college.edu>"
   ```

Without email configured:
- System works normally
- Password reset links logged to console
- Manually send links to users

---

## 📄 License

This project is developed for educational purposes.

---

## 🤝 Support

If you encounter any issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Verify all environment variables in `.env`
3. Check server console for error messages
4. Ensure MongoDB connection is active

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Install | `npm install` |
| Start Dev | `npm run dev` |
| Start Server | `npm start` |
| Build | `npm run build` |
| Check Logs | Check terminal output |

---

**Made with ❤️ for efficient elective management**
