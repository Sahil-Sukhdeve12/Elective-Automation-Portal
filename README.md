# 🎓 Elective Selection System

A modern, full-stack web application for managing student elective course selections with role-based access control.

## ✨ Features

### 👨‍🎓 Student Features
- **Course Selection**: Browse and select from available electives
- **Progress Tracking**: Monitor academic progress and requirements
- **Personalized Dashboard**: View selected courses and recommendations
- **Profile Management**: Update personal information and preferences

### 👨‍💼 Admin Features
- **Student Management**: View and manage all registered students
- **Course Management**: Add, edit, and remove elective courses
- **Analytics Dashboard**: Track enrollment statistics and trends
- **System Management**: Configure system settings and parameters

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based access control (Student/Admin)
- Secure password hashing with bcrypt
- Protected API endpoints

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for state management

### Backend
- **Node.js** with Express.js
- **MongoDB Atlas** for database
- **Mongoose** for ODM
- **JWT** for authentication
- **bcrypt** for password hashing

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sahil-Sukhdeve12/major_project.git
   cd major_project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Start backend server
   npm run server

   # Terminal 2: Start frontend development server
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📦 Deployment

### Production Build
```bash
npm run build
npm start
```

### Deployment Platforms
The application is ready for deployment on:
- **Render.com** (Recommended)
- **Railway.app**
- **Heroku**
- **DigitalOcean App Platform**

#### Render.com Deployment
1. Connect your GitHub repository
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Add environment variables: `MONGODB_URI`, `JWT_SECRET`

## 📁 Project Structure

```
project/
├── src/                     # Frontend source code
│   ├── components/          # Reusable React components
│   ├── contexts/           # React context providers
│   ├── pages/              # Route components
│   ├── services/           # API services
│   └── utils/              # Utility functions
├── server/                 # Legacy server components
├── simple-server.cjs       # Development server
├── universal-server.js     # Production server
└── package.json           # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run server` - Start backend server
- `npm run server:dev` - Start backend with nodemon
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data
- `npm run lint` - Run ESLint

## 🌟 Key Features Implementation

### Authentication Flow
1. User registration with role selection
2. JWT token generation and validation
3. Protected routes based on user roles
4. Persistent login sessions

### Data Management
- MongoDB collections for Users, Electives
- Relationship management between students and courses
- Real-time data synchronization

### UI/UX
- Responsive design for all devices
- Dark/light theme support
- Loading states and error handling
- Intuitive navigation and user feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Sahil Sukhdeve**
- GitHub: [@Sahil-Sukhdeve12](https://github.com/Sahil-Sukhdeve12)

---

🎯 **Ready for deployment!** This application is production-ready and can be deployed to any modern hosting platform.
