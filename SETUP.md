# MongoDB & Auth Integration Setup

This project has been updated to use MongoDB as the database with JWT authentication.

## Prerequisites

1. **MongoDB**: You need MongoDB installed locally or use MongoDB Atlas (cloud)
2. **Node.js**: v18 or higher

## Setup Instructions

### Option 1: Local MongoDB
1. Install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

### Option 2: MongoDB Atlas (Recommended)
1. Go to https://cloud.mongodb.com
2. Create a free account and cluster
3. Get your connection string
4. Update `.env` file with your MongoDB URI

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/elective-selection
   # OR for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/elective-selection
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   ```

## Running the Application

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Seed the database** (creates sample data):
   ```bash
   npm run seed
   ```

3. **Start the backend server**:
   ```bash
   npm run server:dev
   ```

4. **Start the frontend** (in a new terminal):
   ```bash
   npm run dev
   ```

## Login Credentials

After seeding, you can login with:

- **Admin**: admin@college.edu / admin123
- **Student**: student@college.edu / student123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)

### Electives
- `GET /api/electives` - Get all electives
- `POST /api/electives` - Create elective (admin only)
- `PUT /api/electives/:id` - Update elective (admin only)
- `DELETE /api/electives/:id` - Delete elective (admin only)
- `POST /api/electives/select` - Select elective (student only)
- `DELETE /api/electives/unselect/:id` - Unselect elective (student only)
- `GET /api/electives/my-selections` - Get student's selections

## Features Implemented

✅ **MongoDB Integration**: Complete database integration with Mongoose
✅ **JWT Authentication**: Secure token-based authentication
✅ **User Management**: Registration, login, profile management
✅ **Elective Management**: CRUD operations for electives
✅ **Student Selections**: Students can select/unselect electives
✅ **Image Support**: Electives can have associated images
✅ **Deadline Management**: Selection deadlines with enforcement
✅ **Role-based Access**: Different features for students and admins
✅ **Semester Filtering**: Shows only current semester electives

## Deployment Ready

The application is configured for easy deployment to:
- **Vercel** (Frontend)
- **Railway/Render** (Backend)
- **MongoDB Atlas** (Database)

## File Structure

```
├── src/                    # Frontend React app
│   ├── services/api.ts     # API client
│   ├── contexts/           # React contexts (Auth, Data)
│   └── pages/              # Application pages
├── server/                 # Backend Express app
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   └── server.js           # Main server file
└── .env                    # Environment variables
```
