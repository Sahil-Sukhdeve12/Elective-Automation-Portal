# ElectivePro - Advanced Elective Selection System

A comprehensive elective selection and management system built with React, TypeScript, and MongoDB.

## Features

### For Students:
- **3-Category Elective System**: Departmental (Core), Humanities, and Open Electives
- **Smart Recommendations**: AI-powered elective suggestions based on interests and career goals
- **Info Modals**: View detailed curriculum images and elective information
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
  domain: String,
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
  domain: String,
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
- Student's interests and domain preferences
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
