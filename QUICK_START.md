# Quick Start - Email & Syllabus Features

## ✅ Installation Complete

Nodemailer has been installed successfully! All backend endpoints are ready to use.

---

## 🚀 Start Using Immediately (No Configuration Required!)

The system works **out of the box** in simulation mode - no email configuration needed!

### Start the Server

```bash
npm run server
```

The server will start on port 5000 with email simulation mode enabled.

---

## 📧 Send Your First Alert

1. **Open the app** in your browser (http://localhost:5173)
2. **Login as admin**:
   - Email: `admin@system.com`
   - Password: `admin123`
3. **Go to Admin Dashboard**
4. **Scroll to "Send Alerts" section**
5. **Select recipients**:
   - Choose department (e.g., "Computer Science")
   - Choose semester (e.g., "5")
   - Choose section (e.g., "A")
   - Or select "All" for any field
6. **Write your message**:
   - Title: "Important Notice"
   - Message: "This is a test alert"
7. **Click "Send Alert"**

### What Happens?

In **simulation mode** (current setup):
- ✅ System filters students based on your selection
- ✅ Console shows: "📧 Would send email to: [student emails]"
- ✅ You see success message in the app
- ⚠️ No actual emails sent (simulation only)

**Check the server console** to see:
```
⚠️ Email simulation mode - No SMTP configured
📧 Would send email to: john@example.com, jane@example.com
Subject: Important Notice
Recipients: 2 students
```

---

## 📚 Upload Your First Syllabus

1. **Stay logged in as admin**
2. **Click "Syllabus" in the top navigation**
3. **Select an elective** from the dropdown
4. **Click "Choose File"** and select a PDF
5. **Enter details**:
   - Title: "Course Syllabus 2024"
   - Version: "1.0"
6. **Click "Upload Syllabus"**

### What Happens?

- ✅ PDF is converted to base64
- ✅ Stored in MongoDB Atlas (cloud storage)
- ✅ Immediately available to students
- ✅ Students can view/download from "Roadmap" section

---

## 👨‍🎓 Student View

1. **Logout and login as a student**:
   - Use any student credentials from your database
2. **Go to "Roadmap" section**
3. **Find an elective with syllabus**
4. **Click "View Syllabus"**
5. **PDF opens in new window** - can download or print

---

## 🔧 Enable Real Emails (Optional)

### For Gmail (Easiest)

1. **Create `.env` file** in project root:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
EMAIL_FROM="Elective System <noreply@example.com>"
```

2. **Get Gmail App Password**:
   - Enable 2-Factor Authentication in Gmail
   - Go to: https://myaccount.google.com/apppasswords
   - Create password for "Mail"
   - Copy the 16-character password
   - Use it in `SMTP_PASSWORD`

3. **Restart server**:
```bash
# Stop current server (Ctrl+C)
npm run server
```

4. **Send alert again** - real emails will be sent!

---

## 📊 Features Available Right Now

### Email System
- ✅ Send alerts to students
- ✅ Filter by department/semester/section
- ✅ HTML email templates (professional design)
- ✅ Bulk email support
- ✅ Simulation mode (no SMTP needed)
- ✅ Error handling and logging

### Syllabus Management
- ✅ Upload PDF syllabi (up to 16MB)
- ✅ Cloud storage in MongoDB
- ✅ Version control
- ✅ Student download access
- ✅ Admin CRUD operations
- ✅ Automatic base64 encoding

---

## 🧪 Test the System

### Test Email in Simulation Mode

1. Login as admin
2. Go to Dashboard → Send Alerts
3. Select recipients
4. Write message
5. Click send
6. **Check server console** for simulation output

### Test Syllabus Upload

1. Login as admin
2. Go to Syllabus Management
3. Upload a PDF
4. Logout and login as student
5. Go to Roadmap
6. **View the uploaded syllabus**

---

## 📝 API Endpoints Available

All these endpoints are **already implemented and working**:

### Syllabus Endpoints
- `POST /api/syllabi` - Upload syllabus
- `GET /api/syllabi` - Get all syllabi
- `GET /api/syllabi/elective/:id` - Get by elective
- `PUT /api/syllabi/:id` - Update syllabus
- `DELETE /api/syllabi/:id` - Delete syllabus

### Email Endpoints
- `POST /api/notifications/send-email` - Send alert email
- `POST /api/notifications/send-to-users` - Send to specific users
- `POST /api/notifications/test-email` - Test email config

---

## 🎯 Current Status

### ✅ What's Working
- Backend server with all endpoints
- MongoDB integration for syllabus storage
- Email system (simulation mode)
- Student filtering logic
- PDF upload/download
- Admin authentication
- Error handling

### 🔧 Optional Configuration
- SMTP setup for real emails (see above)
- Custom email templates
- Email service (SendGrid, etc.)

---

## 📚 Documentation Files

For detailed information, see:
- **IMPLEMENTATION_COMPLETE.md** - Full feature list
- **BACKEND_EMAIL_SETUP.md** - Detailed setup guide
- **.env.example** - Configuration template

---

## 🎉 You're All Set!

**Everything is ready to use!**

Just run `npm run server` and start:
- Uploading syllabi ✅
- Sending alerts ✅
- Testing features ✅

**No configuration required** - simulation mode works perfectly for testing!

When you're ready for production, just add SMTP configuration and restart. 🚀
