# 🎓 Elective Selection System - Complete User Data Summary

## 🏗️ System Architecture

**Technology Stack:**
- Frontend: React 18 + TypeScript + Tailwind CSS
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose ODM
- Authentication: JWT (JSON Web Tokens)
- Deployment: Ready for Vercel (Frontend) + Railway (Backend)

## 🔐 Authentication System

**User Roles:**
- **Admin**: Can manage electives, view analytics, manage students
- **Student**: Can select electives, view progress, submit feedback

**Login Credentials (After Seeding):**
```
Admin Account:
Email: admin@college.edu
Password: admin123

Student Account:
Email: student@college.edu  
Password: student123
```

## 📊 Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'student' | 'admin',
  department: String (for students),
  semester: Number (for students),
  isNewUser: Boolean,
  preferences: {
    interests: [String],
    careerGoals: String,
    difficulty: 'easy' | 'balanced' | 'challenging'
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Electives Collection
```javascript
{
  name: String,
  code: String (unique),
  semester: Number,
  track: String,
  description: String,
  credits: Number,
  department: String,
  category: 'Theory' | 'Practical',
  electiveCategory: 'Humanities' | 'Departmental' | 'Open Elective',
  image: String (URL),
  selectionDeadline: Date,
  prerequisites: [ObjectId],
  minEnrollment: Number,
  maxEnrollment: Number
}
```

### Student Selections Collection
```javascript
{
  studentId: ObjectId,
  electiveId: ObjectId,
  semester: Number,
  status: 'pending' | 'approved' | 'rejected',
  priority: Number,
  createdAt: Date
}
```

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Seed database with sample data
npm run seed

# Start backend server
npm run server:dev

# Start frontend (new terminal)
npm run dev

# Export all user data
npm run export-users

# Build for production
npm run build
npm start
```

## 📱 Core Features

### For Students:
✅ **Semester-Specific Filtering** - Only see current semester electives  
✅ **Deadline Enforcement** - Cannot select after deadline  
✅ **Image Display** - View elective images added by admin  
✅ **Real-time Feedback** - Instant notifications for actions  
✅ **Selection Management** - Select/unselect electives  
✅ **Progress Tracking** - View selected electives and status  

### For Admins:
✅ **Elective Management** - Create, edit, delete electives  
✅ **Image Upload** - Add images to electives  
✅ **Deadline Setting** - Set selection deadlines  
✅ **Student Overview** - View all student selections  
✅ **Analytics Dashboard** - System statistics and insights  
✅ **Notification System** - Send alerts to students  

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Electives
- `GET /api/electives` - Get all electives
- `POST /api/electives` - Create elective (admin)
- `PUT /api/electives/:id` - Update elective (admin)
- `DELETE /api/electives/:id` - Delete elective (admin)
- `POST /api/electives/select` - Select elective (student)
- `DELETE /api/electives/unselect/:id` - Unselect elective (student)
- `GET /api/electives/my-selections` - Get student selections

## 📈 Sample Data (After Seeding)

**Electives Created:**
1. Machine Learning (CS501) - Semester 5, AI Track
2. Web Development (CS502) - Semester 5, Web Dev Track  
3. Data Visualization (CS503) - Semester 5, Data Science Track
4. Psychology of Learning (HU501) - Semester 5, Humanities
5. Digital Marketing (MK501) - Semester 5, Open Elective
6. Mobile App Development (CS504) - Semester 6, Mobile Track

**All electives include:**
- High-quality stock images
- Detailed descriptions
- Selection deadlines (20-45 days from creation)
- Proper categorization (Departmental/Humanities/Open)

## 🛠️ Development Tools

### Available Scripts:
- `npm run dev` - Start frontend development server
- `npm run server:dev` - Start backend with auto-reload
- `npm run seed` - Populate database with sample data
- `npm run export-users` - Export all data to JSON
- `npm run build` - Build for production
- `npm run start` - Run production build

### Environment Variables:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/elective-selection
JWT_SECRET=your_jwt_secret
VITE_API_URL=http://localhost:5000/api
```

## 🔄 Data Export Features

Run `npm run export-users` to get:
- Complete user list with roles and details
- All electives with metadata
- Student selection records
- Summary statistics
- JSON export file with timestamp

## 🚀 Deployment Ready

**Frontend (Vercel):**
- Optimized build with Vite
- Environment variables configured
- API proxy setup for development
- CORS handling for production

**Backend (Railway/Render):**
- MongoDB Atlas integration
- JWT authentication
- Error handling and logging
- Health check endpoints

**Database (MongoDB Atlas):**
- Cloud-ready schema
- Indexed fields for performance
- Backup and scaling support

## 📞 Support & Maintenance

**For issues:**
1. Check server logs: `npm run server:dev`
2. Test with seed data: `npm run seed`
3. Export current data: `npm run export-users`
4. Review deployment docs: `DEPLOYMENT.md`

**System is production-ready with:**
- Complete authentication system
- Full CRUD operations
- Data validation and security
- Responsive design
- Error handling
- Export capabilities

---

**Status**: ✅ Complete & Deployment Ready  
**Last Updated**: September 7, 2025  
**Version**: 1.0.0
