# 🚀 Elective Selection System - Deployment Guide

## 📋 System Overview

This is a full-stack elective selection system with:
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB + JWT Authentication
- **Database**: MongoDB with Mongoose ODM
- **Features**: Student/Admin roles, elective management, deadline enforcement, image support

## 🔧 Prerequisites

1. **Node.js** v18 or higher
2. **MongoDB** (local or MongoDB Atlas)
3. **Git** for version control

## 📁 Project Structure

```
├── src/                    # React frontend
│   ├── services/api.ts     # API client
│   ├── contexts/           # React contexts
│   └── pages/              # App pages
├── server/                 # Express backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   └── server.js           # Main server
└── dist/                   # Built frontend (after build)
```

## 🛠️ Local Development Setup

### 1. Clone and Install
```bash
git clone <your-repo>
cd elective-selection-system
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Update `.env` with your values:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/elective-selection
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Database Setup
```bash
# Seed the database with sample data
npm run seed
```

### 4. Run Development Servers
```bash
# Terminal 1: Backend server
npm run server:dev

# Terminal 2: Frontend development server  
npm run dev
```

Access at: http://localhost:5173

## 👥 Default Login Credentials

- **Admin**: admin@college.edu / admin123
- **Student**: student@college.edu / student123

## 📊 Export User Data

```bash
# Export all user data to JSON
npm run export-users
```

## 🌐 Production Deployment

### Option 1: Railway (Backend) + Vercel (Frontend)

#### Backend on Railway:
1. Go to [Railway](https://railway.app)
2. Create new project from GitHub repo
3. Set environment variables:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/elective-selection
   JWT_SECRET=your_production_jwt_secret
   ```
4. Deploy command: `npm run server`

#### Frontend on Vercel:
1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repo
3. Set environment variables:
   ```env
   VITE_API_URL=https://your-railway-app.railway.app/api
   ```
4. Deploy automatically builds with `npm run build`

### Option 2: Single Server Deployment

For VPS/dedicated server:

```bash
# Build frontend
npm run build

# Start production server (serves both API and frontend)
npm start
```

## 💾 Database Options

### Option 1: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free cluster
3. Get connection string
4. Update MONGODB_URI in environment

### Option 2: Local MongoDB
```bash
# Install MongoDB
# Windows: Download from mongodb.com
# macOS: brew install mongodb-community
# Ubuntu: sudo apt install mongodb

# Start MongoDB service
mongod
```

## 🔐 Security Configuration

### Production Environment Variables:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=use_a_very_strong_random_secret_key_here
CORS_ORIGIN=https://your-frontend-domain.com
```

### Security Best Practices:
- Use strong JWT secret (32+ random characters)
- Enable CORS only for your frontend domain
- Use HTTPS in production
- Keep dependencies updated

## 📈 Performance Optimization

### Frontend:
- Images optimized and lazy-loaded
- Code splitting with React.lazy
- Tailwind CSS purged for production

### Backend:
- MongoDB indexes on frequently queried fields
- JWT token caching
- Error handling and logging

## 🚨 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**:
   - Check MONGODB_URI format
   - Verify database credentials
   - Ensure MongoDB service is running

2. **API 404 Errors**:
   - Check VITE_API_URL in frontend
   - Verify backend server is running
   - Check CORS configuration

3. **Authentication Issues**:
   - Verify JWT_SECRET matches between requests
   - Check token expiration
   - Clear browser localStorage

### Debug Commands:
```bash
# Check backend health
curl http://localhost:5000/api/health

# View logs
npm run server:dev  # Shows detailed logs

# Test database connection
npm run seed  # Will fail if DB connection issues
```

## 📋 Feature Checklist

✅ User Authentication (JWT)
✅ Role-based Access (Student/Admin)
✅ Elective CRUD Operations
✅ Image Upload Support
✅ Selection Deadline Management
✅ Semester-based Filtering
✅ Student Selection Tracking
✅ Responsive Design
✅ Real-time Notifications
✅ Data Export Functionality

## 🔄 Maintenance

### Regular Tasks:
- Monitor MongoDB storage usage
- Update dependencies monthly
- Backup database regularly
- Review user feedback and analytics

### Scaling Considerations:
- Add Redis for session caching
- Implement file storage (AWS S3) for images
- Add search functionality (Elasticsearch)
- Implement email notifications

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review server logs
3. Test with sample data using `npm run seed`
4. Export user data with `npm run export-users`

---

**Deployment Status**: ✅ Ready for Production
**Last Updated**: September 2025
