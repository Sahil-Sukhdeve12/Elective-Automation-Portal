# 🚀 Deployment Checklist for College Team

## ✅ Pre-Deployment Preparation (Complete)

- [x] All documentation files removed
- [x] Test and debug files removed
- [x] README.md updated with deployment instructions
- [x] .env.example file ready with all required variables

---

## 📋 Deployment Steps

### Step 1: MongoDB Atlas Setup

1. **Create MongoDB Atlas Account** (if not already done)
   - Go to: https://www.mongodb.com/cloud/atlas
   - Sign up for FREE account
   
2. **Create Database Cluster**
   - Click "Build a Database"
   - Select FREE "M0 Sandbox" tier
   - Choose your preferred cloud provider and region
   - Click "Create"

3. **Create Database User**
   - Go to "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Username: `admin` (or your choice)
   - Password: Generate strong password (SAVE THIS!)
   - Database User Privileges: "Read and write to any database"

4. **Configure Network Access**
   - Go to "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add your deployment server's IP
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string:
   ```
   mongodb+srv://username:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual database password
   - Add database name: `mongodb+srv://username:password@cluster.mongodb.net/elective-system?retryWrites=true&w=majority`

---

### Step 2: Local Environment Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   # Copy example file
   cp .env.example .env
   ```

3. **Edit .env File**
   ```env
   # REQUIRED: Your MongoDB Connection String
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/elective-system?retryWrites=true&w=majority
   
   # REQUIRED: Random Secret Key (change this!)
   JWT_SECRET=your-college-project-secret-2025-random-string
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

4. **Test Locally**
   ```bash
   npm start
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000/api
   - Test login with: `admin@elective.com` / `admin123`

---

### Step 3: Deployment (Choose One Platform)

## Option A: Render (Recommended - Easiest)

### Backend Deployment:
1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** `elective-system-backend`
   - **Branch:** `main`
   - **Root Directory:** (leave empty)
   - **Build Command:** `npm install`
   - **Start Command:** `node simple-server.cjs`
   - **Environment:**
     ```
     MONGODB_URI = <your-mongodb-connection-string>
     JWT_SECRET = <your-random-secret>
     PORT = 5000
     NODE_ENV = production
     FRONTEND_URL = https://<your-frontend-name>.onrender.com
     ```
5. Click "Create Web Service"
6. Wait for deployment (5-10 minutes)
7. Copy the backend URL (e.g., `https://elective-system-backend.onrender.com`)

### Frontend Deployment:
1. In Render dashboard, click "New +" → "Static Site"
2. Connect same GitHub repository
3. Configure:
   - **Name:** `elective-system-frontend`
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Environment Variables:**
     ```
     VITE_API_BASE_URL = https://elective-system-backend.onrender.com/api
     ```
4. Click "Create Static Site"
5. Wait for deployment
6. Your app will be live at: `https://elective-system-frontend.onrender.com`

---

## Option B: Railway (Alternative)

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables in Railway dashboard
6. Railway will auto-detect Node.js and deploy
7. Get the deployment URL

---

## Option C: Heroku

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Login: `heroku login`
3. Create app: `heroku create elective-system`
4. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI=<your-mongodb-uri>
   heroku config:set JWT_SECRET=<your-secret>
   heroku config:set NODE_ENV=production
   ```
5. Deploy: `git push heroku main`
6. Open: `heroku open`

---

### Step 4: Post-Deployment Configuration

1. **Login as Admin**
   - Email: `admin@elective.com`
   - Password: `admin123`
   - **⚠️ CHANGE PASSWORD IMMEDIATELY!**

2. **Configure System Settings** (Admin → System Management)
   - Add Departments (e.g., CSE, ECE, ME, EEE, Civil)
   - Add Sections (e.g., A, B, C, D)
   - Add Semesters (e.g., 5, 6, 7, 8)

3. **Add Elective Tracks** (Admin → System Management → Tracks)
   - Category: Departmental
     - Add tracks like: Data Science, Web Development, Cloud Computing
   - Category: Open
     - Add tracks like: Programming, Databases, Networks
   - Category: Humanities
     - Add tracks like: Communication, Ethics, Management

4. **Add Electives** (Admin → Electives)
   - Click "Add New Elective"
   - Fill in details:
     - Course Code (e.g., CS501)
     - Name (e.g., Machine Learning)
     - Credits (e.g., 3)
     - Department
     - Semester
     - Category & Track
     - Min/Max Enrollment
     - Selection Deadline

5. **Upload Syllabi** (Admin → Syllabus)
   - Upload PDF files for each elective

6. **Create Admin Users**
   - Option 1: Register new user → Manually change role in MongoDB
   - Option 2: In MongoDB Atlas:
     - Navigate to Collections → `users`
     - Find user document
     - Edit: Change `role: "student"` to `role: "admin"`

---

## 🔧 Important Configuration Notes

### MongoDB Database Name
- The system uses database name: `elective-system`
- Collections are created automatically on first use
- No manual collection creation needed

### Collections Created Automatically:
- `users` - Student and admin accounts
- `electives` - Available courses
- `tracks` - Elective tracks
- `studentelectiveselections` - Student selections
- `feedbackresponses` - Feedback submissions
- `feedbacktemplates` - Feedback forms
- `syllabi` - PDF documents
- `systemconfigs` - System settings
- `alerts` - Notifications

### Email Configuration (Optional):
If you want password reset emails to work:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-college-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM="College Elective System <noreply@yourcollege.edu>"
```

If NOT configured, password reset tokens will be logged to server console (admin can manually share tokens).

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution:**
- Check MongoDB URI is correct
- Verify database password (no special characters issues)
- Whitelist IP (0.0.0.0/0) in MongoDB Network Access

### Issue: "Port already in use"
**Solution:**
- Change PORT in .env file
- Or: `killall node` (Mac/Linux) / `taskkill /F /IM node.exe` (Windows)

### Issue: "Module not found"
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "CORS Error"
**Solution:**
- Ensure FRONTEND_URL in backend .env matches your frontend URL
- Check backend API URL in frontend .env.production

### Issue: "404 API Not Found"
**Solution:**
- Verify VITE_API_BASE_URL includes `/api` at the end
- Example: `https://backend-url.com/api` (not just `https://backend-url.com`)

---

## 📊 Default Admin Credentials

```
Email: admin@elective.com
Password: admin123
```

**⚠️ SECURITY: Change this password immediately after first login!**

---

## 🎯 Quick Verification Checklist

After deployment, verify:

- [ ] Can access frontend URL
- [ ] Can access backend URL/api/health (should return "OK")
- [ ] Can login as admin
- [ ] Can add departments/sections/semesters
- [ ] Can create electives
- [ ] Can create student account
- [ ] Student can select electives
- [ ] Admin can view student selections
- [ ] PDF syllabus upload works
- [ ] Analytics dashboard shows data

---

## 📱 System URLs After Deployment

Update these in your documentation:

- **Frontend:** `https://your-frontend-url.onrender.com`
- **Backend API:** `https://your-backend-url.onrender.com/api`
- **Admin Panel:** `https://your-frontend-url.onrender.com` (login as admin)

---

## 🔒 Security Recommendations

1. **Change Default Admin Password** - First priority!
2. **Use Strong JWT Secret** - Random 32+ character string
3. **Enable HTTPS** - Most hosting platforms provide this free
4. **Regular Backups** - MongoDB Atlas has automatic backups
5. **Monitor Logs** - Check for unusual activity

---

## 📞 Need Help?

### MongoDB Issues:
- Documentation: https://docs.mongodb.com/atlas/
- Support: https://www.mongodb.com/cloud/atlas/support

### Deployment Issues:
- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- Heroku Docs: https://devcenter.heroku.com

---

## ✅ Final Checklist Before Submission

- [ ] MongoDB Atlas database created and accessible
- [ ] `.env` file configured with production values
- [ ] Application tested locally
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Environment variables set on hosting platform
- [ ] Default admin password changed
- [ ] System configuration completed (departments, sections, semesters, tracks)
- [ ] Sample electives added
- [ ] Test student account created and can select electives
- [ ] All features tested and working

---

## 🎉 You're Ready to Deploy!

The system is designed to be **plug-and-play**. Just:
1. Add your MongoDB URI
2. Set a JWT secret
3. Deploy to your chosen platform

Everything else is configured through the admin interface after deployment!

---

**Good luck with your deployment! 🚀**
