import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { GraduationCap, LogOut, User, BarChart3, BookOpen, Map, Moon, Sun, MessageSquare } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { getActiveFeedbackTemplates } = useData();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  // Get active feedback templates for students
  const activeFeedbackTemplates = user.role === 'student' ? getActiveFeedbackTemplates() : [];

  const studentNavItems = [
    { path: '/electives', label: 'Electives', icon: BookOpen },
    { path: '/progress', label: 'Progress', icon: BarChart3 },
    { path: '/roadmap', label: 'Roadmap', icon: Map },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/feedback', label: 'Feedback', icon: MessageSquare }
  ];

  const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: BarChart3 },
    { path: '/admin/electives', label: 'Manage Electives', icon: BookOpen },
    { path: '/admin/students', label: 'Students', icon: User },
    { path: '/admin/system', label: 'System Management', icon: BarChart3 },
  ];

  const navItems = user.role === 'admin' ? adminNavItems : studentNavItems;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg fixed w-full top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Elective </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">{user.name}</span>
              {user.role === 'student' && (
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {user.department} - Sem {user.semester}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;