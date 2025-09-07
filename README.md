# 🎓 Elective Selection System

A comprehensive web application for managing student elective course selections with MongoDB integration, JWT authentication, and admin dashboard capabilities.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [User Roles & Permissions](#user-roles--permissions)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [Contributing](#contributing)

## ✨ Features

### 🎯 Core Functionality
- **Student Registration & Authentication** - JWT-based secure login system
- **Elective Course Management** - Complete CRUD operations for courses
- **Roll Number Tracking** - Student identification with roll numbers
- **Multi-Role Support** - Admin and Student role-based access
- **Real-time Dashboard** - Interactive dashboards for both roles

### 📊 Admin Features
- **Student Management** - View all registered students with roll numbers
- **Course Management** - Add, edit, delete elective courses
- **Analytics Dashboard** - Student enrollment statistics
- **Data Export** - Excel/PDF reports with student data
- **User Administration** - Manage student accounts and permissions

### 👨‍🎓 Student Features
- **Course Selection** - Browse and select from available electives
- **Profile Management** - Update personal information and preferences
- **Progress Tracking** - View selected courses and academic progress
- **Dashboard Overview** - Personal academic summary

### 📈 Advanced Features
- **Data Export** - Multiple format support (Excel, PDF, CSV)
- **Real-time Updates** - Dynamic content updates
- **Responsive Design** - Mobile-friendly interface
- **Security** - Password hashing, JWT tokens, input validation

## 🛠 Technology Stack

### Frontend
- **React 18** - Modern React with hooks and context
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and development server
- **Lucide React** - Modern icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB Atlas** - Cloud database service
- **Mongoose** - MongoDB object modeling

### Authentication & Security
- **JWT (JSON Web Tokens)** - Stateless authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Development & Deployment
- **ESLint** - Code linting and formatting
- **Vercel** - Deployment platform
- **Git** - Version control

## 📁 Project Structure

```
elective-selection-system/
├── 📁 api/                          # Vercel serverless functions
│   └── index.js                     # Main API handler
├── 📁 server/                       # Backend server files
│   ├── models/                      # Database models
│   │   ├── User.js                  # User schema with roll numbers
│   │   └── Elective.js              # Elective course schema
│   ├── routes/                      # API route handlers
│   │   ├── auth.js                  # Authentication routes
│   │   └── electives.js             # Elective management routes
│   ├── middleware/                  # Custom middleware
│   │   └── auth.js                  # JWT authentication middleware
│   ├── seed.js                      # Database seeding script
│   └── server.js                    # Express server setup
├── 📁 src/                          # Frontend source code
│   ├── components/                  # Reusable UI components
│   │   ├── common/                  # Shared components
│   │   │   ├── LoadingSpinner.tsx   # Loading indicator
│   │   │   ├── NotificationToast.tsx # Toast notifications
│   │   │   └── ProgressBar.tsx      # Progress indicators
│   │   └── layout/                  # Layout components
│   │       └── Navbar.tsx           # Navigation bar
│   ├── contexts/                    # React Context providers
│   │   ├── AuthContext.tsx          # Authentication state
│   │   ├── DataContext.tsx          # Application data state
│   │   ├── FeedbackContext.tsx      # Feedback system
│   │   └── NotificationContext.tsx  # Notification system
│   ├── pages/                       # Page components
│   │   ├── admin/                   # Admin-only pages
│   │   │   ├── AdminDashboard.tsx   # Admin main dashboard
│   │   │   ├── AdminElectives.tsx   # Course management
│   │   │   ├── AdminStudents.tsx    # Student management
│   │   │   └── AdminAnalytics.tsx   # Analytics and reports
│   │   ├── student/                 # Student-only pages
│   │   │   ├── StudentDashboard.tsx # Student main dashboard
│   │   │   ├── StudentElectives.tsx # Course selection
│   │   │   ├── StudentProfile.tsx   # Profile management
│   │   │   ├── StudentProgress.tsx  # Academic progress
│   │   │   └── StudentRoadmap.tsx   # Academic roadmap
│   │   ├── Login.tsx                # Login page
│   │   └── Register.tsx             # Registration page
│   ├── services/                    # API service layer
│   │   └── api.ts                   # HTTP client and API calls
│   ├── utils/                       # Utility functions
│   │   └── seedData.ts              # Frontend data seeding
│   ├── App.tsx                      # Main application component
│   ├── main.tsx                     # Application entry point
│   └── index.css                    # Global styles
├── 📁 Configuration Files
│   ├── .env                         # Environment variables
│   ├── .nvmrc                       # Node.js version specification
│   ├── package.json                 # Dependencies and scripts
│   ├── vercel.json                  # Vercel deployment config
│   ├── vite.config.ts               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── tsconfig.json                # TypeScript configuration
│   └── eslint.config.js             # ESLint configuration
├── 📁 Utility Scripts
│   └── view-users.cjs               # Database user viewer script
└── README.md                        # Project documentation
```

## 🚀 Installation & Setup

### Prerequisites
- **Node.js 20.x** or higher
- **npm** package manager
- **MongoDB Atlas** account
- **Git** for version control

### 1. Clone the Repository
```bash
git clone https://github.com/Sahil-Sukhdeve12/major_project.git
cd major_project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
# Environment Variables
NODE_ENV=development
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/elective-selection?retryWrites=true&w=majority

# JWT Secret (change in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Client URL
CLIENT_URL=http://localhost:5173
```

### 4. Database Setup
```bash
# Seed the database with initial data
npm run seed
```

### 5. Development Server
```bash
# Start frontend development server
npm run dev

# Start backend server (if running locally)
npm run server
```

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` / `production` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `your_secret_key` |
| `CLIENT_URL` | Frontend URL | `http://localhost:5173` |

## 🗄 Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,               // Full name
  email: String,              // Unique email address
  password: String,           // Hashed password
  rollNumber: String,         // Student roll number (required for students)
  role: String,               // 'student' | 'admin'
  department: String,         // Student department
  semester: Number,           // Current semester
  createdAt: Date,           // Registration date
  updatedAt: Date            // Last modified date
}
```

### Elective Collection
```javascript
{
  _id: ObjectId,
  name: String,               // Course name
  code: String,               // Course code (e.g., 'CS501')
  description: String,        // Course description
  credits: Number,            // Credit hours
  semester: Number,           // Offered semester
  department: String,         // Offering department
  track: String,              // Course track/specialization
  category: String,           // Course category
  maxStudents: Number,        // Maximum enrollment
  enrolledStudents: [ObjectId], // Enrolled student IDs
  createdAt: Date,           // Creation date
  updatedAt: Date            // Last modified date
}
```

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
GET  /api/auth/me          # Get current user info
```

### User Management (`/api/users`)
```
GET  /api/users            # Get all users (admin only)
GET  /api/users/:id        # Get specific user
PUT  /api/users/:id        # Update user info
```

### Elective Management (`/api/electives`)
```
GET  /api/electives        # Get all electives
POST /api/electives        # Create new elective (admin only)
PUT  /api/electives/:id    # Update elective (admin only)
DELETE /api/electives/:id  # Delete elective (admin only)
```

### Health Check
```
GET  /api/health          # API health status
```

## 👥 User Roles & Permissions

### 🔴 Admin Role
- **User Management**: View all students with roll numbers
- **Course Management**: Full CRUD operations on electives
- **Analytics**: Access to enrollment statistics and reports
- **Data Export**: Generate Excel/PDF reports
- **System Administration**: Manage application settings

### 🔵 Student Role
- **Profile Management**: Update personal information
- **Course Selection**: Browse and select available electives
- **Progress Tracking**: View academic progress and selected courses
- **Dashboard Access**: Personal academic overview

## 🌐 Deployment

### Vercel Deployment

1. **Connect Repository**
   ```bash
   vercel
   ```

2. **Set Environment Variables** in Vercel Dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Manual Deployment
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📜 Scripts

```json
{
  "dev": "vite",                    // Start development server
  "build": "vite build",            // Build for production
  "lint": "eslint .",               // Run code linting
  "preview": "vite preview",        // Preview production build
  "seed": "node server/seed.js",    // Seed database
  "view-users": "node view-users.cjs", // View database users
  "start": "npm run build && npm run server" // Production start
}
```

## 📊 Default Users

After running `npm run seed`:

### Admin Account
- **Email**: `admin@college.edu`
- **Password**: `admin123`
- **Role**: Administrator

### Student Account
- **Email**: `student@college.edu`
- **Password**: `student123`
- **Roll Number**: `2021CS001`
- **Role**: Student

## 🔍 Data Management

### View Users
```bash
npm run view-users
```

### Export Data
Access admin dashboard → Reports → Export (Excel/PDF)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email sahilsukhdeve25@gmail.com or create an issue on GitHub.

---

**Built with ❤️ for academic excellence**
- **Future Roadmap**: See what electives become available based on current choices
- **Feedback System**: Share feedback on completed electives to help future students
- **Deadline Tracking**: Real-time deadline monitoring for elective selections
- **Progress Tracking**: Visual roadmap of academic progress

### For Admins:
- **Elective Management**: Full CRUD operations for electives
- **Image Upload**: Upload curriculum images for each elective
- **Deadline Management**: Set selection deadlines for electives
- **Export Functionality**: Export data in Excel and PDF formats
- **Future Pathway Setup**: Define which electives unlock after completion
- **Analytics Dashboard**: View selection statistics and trends

## Technology Stack

### Frontend:
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons

### Backend:
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing

### Export Libraries:
- **xlsx** for Excel export
- **jsPDF** with autotable for PDF export

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Git

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/Sahil-Sukhdeve12/major_project.git
cd major_project
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Environment Configuration
Create a \`.env\` file in the root directory:
\`\`\`env
# Environment Variables
NODE_ENV=development
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/elective-selection

# JWT Secret (change this to a secure random string in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Client URL
CLIENT_URL=http://localhost:5173
\`\`\`

### 4. MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB Community Edition from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   - **Windows**: Start MongoDB as a service or run \`mongod\`
   - **macOS**: \`brew services start mongodb/brew/mongodb-community\`
   - **Linux**: \`sudo systemctl start mongod\`

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string and replace \`MONGODB_URI\` in \`.env\`
4. Example: \`mongodb+srv://username:password@cluster.mongodb.net/elective-selection\`

### 5. Run the Application

#### Development Mode (Frontend + Backend)
\`\`\`bash
# Terminal 1: Start the backend server
npm run server:dev

# Terminal 2: Start the frontend development server
npm run dev
\`\`\`

#### Production Mode
\`\`\`bash
# Build and start
npm start
\`\`\`

### 6. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## Default Admin Account

For initial setup, you can create an admin account through the registration page:
- Set role to "admin" during registration
- No department/semester required for admin accounts

## API Endpoints

### Authentication
- \`POST /api/auth/register\` - Register new user
- \`POST /api/auth/login\` - User login
- \`GET /api/auth/me\` - Get current user
- \`PUT /api/auth/profile\` - Update user profile

### Electives
- \`GET /api/electives\` - Get all electives (with filters)
- \`GET /api/electives/:id\` - Get elective by ID
- \`POST /api/electives\` - Create elective (admin only)
- \`PUT /api/electives/:id\` - Update elective (admin only)
- \`DELETE /api/electives/:id\` - Delete elective (admin only)
- \`POST /api/electives/:id/select\` - Select elective (student only)
- \`GET /api/electives/student/my-electives\` - Get student's electives
- \`POST /api/electives/feedback\` - Submit elective feedback
- \`POST /api/electives/recommendations\` - Get personalized recommendations

## Database Schema

### Users Collection
\`\`\`javascript
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
  }
}
\`\`\`

### Electives Collection
\`\`\`javascript
{
  name: String,
  code: String (unique),
  semester: Number,
  track: String,
  description: String,
  prerequisites: [ObjectId],
  credits: Number,
  department: String,
  category: 'Theory' | 'Practical',
  electiveCategory: 'Humanities' | 'Departmental' | 'Open Elective',
  infoImage: String (base64),
  selectionDeadline: Date,
  futureOptions: [ObjectId],
  isActive: Boolean,
  createdBy: ObjectId
}
\`\`\`

### Student Electives Collection
\`\`\`javascript
{
  student: ObjectId,
  elective: ObjectId,
  semester: Number,
  track: String,
  status: 'selected' | 'completed' | 'dropped',
  grade: String,
  feedback: {
    rating: Number,
    comment: String,
    submittedAt: Date
  },
  selectedAt: Date,
  completedAt: Date
}
\`\`\`

## Features in Detail

### Smart Elective Recommendations
The system provides personalized recommendations based on:
- Student's interests and track preferences
- Career goals alignment
- Learning difficulty preferences
- Previous elective completion patterns

### Future Roadmap Visualization
- Shows which electives become available after completing current ones
- Helps students plan their academic journey
- Provides clear pathways for specialization

### Feedback System
- Students provide feedback on completed electives
- Helps future students make informed decisions
- Includes rating, comments, and improvement suggestions

### Export Functionality
- **Excel Export**: Comprehensive data with multiple sheets
- **PDF Export**: Professional reports with tables and summaries
- Includes elective data, student selections, and analytics

## Deployment

### Production Deployment
1. Set \`NODE_ENV=production\` in environment variables
2. Use a secure \`JWT_SECRET\`
3. Configure production MongoDB URI
4. Build the application: \`npm run build\`
5. Start the server: \`npm run server\`

### Recommended Platforms
- **Backend**: Heroku, Railway, DigitalOcean
- **Database**: MongoDB Atlas
- **Frontend**: Vercel, Netlify (for separate frontend deployment)

## Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature-name\`
3. Commit changes: \`git commit -am 'Add feature'\`
4. Push to branch: \`git push origin feature-name\`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Email: sahilsukhdeve12@gmail.com

## Roadmap

Future enhancements planned:
- [ ] Email notifications for deadlines
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Integration with university systems
- [ ] Machine learning for better recommendations
- [ ] Real-time collaboration features
