import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { BookOpen, Award, Target, Star, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const StudentProgress: React.FC = () => {
  const { user } = useAuth();
  const { electives, getStudentElectives } = useData();

  if (!user || user.role !== 'student') return null;

  const studentElectives = getStudentElectives(user.id);
  
  // Calculate basic statistics
  const totalElectivesCompleted = studentElectives.length;
  const totalCredits = studentElectives.reduce((sum, se) => {
    const elective = electives.find(e => e.id === se.electiveId);
    return sum + (elective?.credits || 3);
  }, 0);

  // Categorize completed electives
  const categorizedElectives = {
    Departmental: studentElectives.filter(se => {
      const elective = electives.find(e => e.id === se.electiveId);
      return elective?.category === 'Departmental';
    }),
    Humanities: studentElectives.filter(se => {
      const elective = electives.find(e => e.id === se.electiveId);
      return elective?.category === 'Humanities';
    }),
    Open: studentElectives.filter(se => {
      const elective = electives.find(e => e.id === se.electiveId);
      return elective?.category === 'Open';
    })
  };

  // Calculate progress percentages (assuming requirements)
  const requirements = {
    Departmental: 4,  // Example: 4 departmental electives required
    Humanities: 2,    // Example: 2 humanities electives required
    Open: 2          // Example: 2 open electives required
  };

  const progressData = Object.entries(categorizedElectives).map(([category, completed]) => {
    const required = requirements[category as keyof typeof requirements];
    const percentage = Math.min((completed.length / required) * 100, 100);
    return {
      category,
      completed: completed.length,
      required,
      percentage: Math.round(percentage),
      remaining: Math.max(0, required - completed.length)
    };
  });

  // Recent electives
  const recentElectives = studentElectives
    .map(se => {
      const elective = electives.find(e => e.id === se.electiveId);
      return { ...se, elective };
    })
    .filter(item => item.elective)
    .sort((a, b) => b.semester - a.semester)
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          My Progress
        </h1>
        <p className="text-gray-600 mt-2">
          Track your elective journey and academic progress
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Electives</p>
              <p className="text-3xl font-bold text-blue-600">{totalElectivesCompleted}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Credits Earned</p>
              <p className="text-3xl font-bold text-green-600">{totalCredits}</p>
            </div>
            <Award className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Semester</p>
              <p className="text-3xl font-bold text-purple-600">{user.semester || 5}</p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Progress by Category */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Progress by Category</h2>
        
        <div className="space-y-6">
          {progressData.map((category) => {
            const categoryConfig = {
              'Departmental': { color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
              'Humanities': { color: 'bg-purple-500', textColor: 'text-purple-600', bgLight: 'bg-purple-50' },
              'Open': { color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-50' }
            };
            
            const config = categoryConfig[category.category as keyof typeof categoryConfig];
            
            return (
              <div key={category.category} className={`p-4 rounded-lg ${config.bgLight}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold ${config.textColor}`}>
                    {category.category} Electives
                  </h3>
                  <span className="text-sm text-gray-600">
                    {category.completed}/{category.required} completed
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${config.color}`}
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{category.percentage}% complete</span>
                  <span>
                    {category.remaining > 0 ? `${category.remaining} more needed` : 'Requirements met!'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Electives */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recently Completed</h2>
        
        {recentElectives.length > 0 ? (
          <div className="space-y-4">
            {recentElectives.map((item) => (
              <div key={item.electiveId} className="flex items-center p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500 mr-4" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.elective?.name}</h3>
                  <p className="text-sm text-gray-600">
                    {item.elective?.code} • Semester {item.semester} • {item.elective?.credits} credits
                  </p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                    item.elective?.category === 'Departmental' ? 'bg-blue-100 text-blue-800' :
                    item.elective?.category === 'Humanities' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.elective?.category}
                  </span>
                </div>
                {item.feedback && (
                  <div className="flex items-center ml-4">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-gray-600">{item.feedback.rating}/5</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No electives completed yet</p>
            <p className="text-sm text-gray-500 mt-1">Start selecting electives to track your progress</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProgress;
