import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { BookOpen, Calendar, Award, TrendingUp, Check, Star, Target, Zap } from 'lucide-react';
import ProgressBar from '../../components/common/ProgressBar';

const StudentProgress: React.FC = () => {
  const { user } = useAuth();
  const { electives, domains, getStudentElectives } = useData();

  if (!user || user.role !== 'student') return null;

  const studentElectives = getStudentElectives(user.id);
  
  // Categorize electives by electiveCategory
  const electiveCategories = ['Humanities', 'Departmental', 'Open Elective'] as const;
  
  // Domain expertise by category
  const domainExpertiseByCategory = electiveCategories.map(category => {
    const categoryElectives = electives.filter(e => e.electiveCategory === category);
    const studentCategoryElectives = studentElectives.filter(se => {
      const elective = electives.find(e => e.id === se.electiveId);
      return elective?.electiveCategory === category;
    });
    
    const domainStats = domains.map(domain => {
      const domainCategoryElectives = categoryElectives.filter(e => e.domain === domain.name);
      const studentDomainElectives = studentCategoryElectives.filter(se => se.domain === domain.name);
      const totalAvailable = domainCategoryElectives.length;
      const completed = studentDomainElectives.length;
      const percentage = totalAvailable > 0 ? (completed / totalAvailable) * 100 : 0;
      
      return {
        ...domain,
        completed,
        totalAvailable,
        percentage: Math.round(percentage),
        level: percentage >= 80 ? 'Expert' : percentage >= 50 ? 'Intermediate' : percentage >= 20 ? 'Beginner' : 'None'
      };
    }).filter(d => d.totalAvailable > 0);

    return {
      category,
      domainStats,
      totalCompleted: studentCategoryElectives.length,
      totalAvailable: categoryElectives.length
    };
  });
  
  const domainProgress = domains.map(domain => {
    const domainElectives = studentElectives.filter(se => se.domain === domain.name);
    const totalInDomain = electives.filter(e => e.domain === domain.name).length;
    const electiveDetails = domainElectives.map(se => {
      const elective = electives.find(e => e.id === se.electiveId);
      return { ...se, elective };
    });
    
    return {
      ...domain,
      completed: domainElectives.length,
      total: totalInDomain,
      electives: electiveDetails
    };
  });

  const totalElectivesCompleted = studentElectives.length;
  const totalCredits = studentElectives.reduce((sum, se) => {
    const elective = electives.find(e => e.id === se.electiveId);
    return sum + (elective?.credits || 0);
  }, 0);

  const electiveHistory = studentElectives
    .map(se => {
      const elective = electives.find(e => e.id === se.electiveId);
      return { ...se, elective };
    })
    .sort((a, b) => a.semester - b.semester);

  // Current semester recommendations
  const currentSemester = user.semester || 5;
  const hasSelectedThisSemester = studentElectives.some(se => se.semester === currentSemester);
  const availableElectives = electives.filter(e => 
    e.semester === currentSemester && 
    !studentElectives.some(se => se.electiveId === e.id)
  );

  // Get expertise level icon and color
  const getExpertiseIcon = (level: string) => {
    switch (level) {
      case 'Expert': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'Intermediate': return <Target className="w-4 h-4 text-blue-500" />;
      case 'Beginner': return <Zap className="w-4 h-4 text-green-500" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getExpertiseColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Intermediate': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Beginner': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDomainColor = (domain: string) => {
    const domainObj = domains.find(d => d.name === domain);
    return domainObj?.color || 'bg-gray-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Academic Progress</h1>
        <p className="text-gray-600 mt-2">
          Track your elective journey and domain expertise across all categories
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{totalElectivesCompleted}</p>
              <p className="text-gray-600">Electives Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Award className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{totalCredits}</p>
              <p className="text-gray-600">Credits Earned</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {domainProgress.filter(d => d.completed > 0).length}
              </p>
              <p className="text-gray-600">Domains Explored</p>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Expertise by Category */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Domain Expertise by Category</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {domainExpertiseByCategory.map(({ category, domainStats, totalCompleted, totalAvailable }) => (
            <div key={category} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                <span className="text-sm text-gray-600">
                  {totalCompleted}/{totalAvailable} completed
                </span>
              </div>
              
              <div className="space-y-3">
                {domainStats.map(domain => (
                  <div key={domain.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${domain.color}`}></div>
                      <span className="text-sm font-medium text-gray-900">{domain.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getExpertiseColor(domain.level)}`}>
                        {getExpertiseIcon(domain.level)}
                        <span className="ml-1">{domain.level}</span>
                      </span>
                      <span className="text-xs text-gray-500">{domain.completed}/{domain.totalAvailable}</span>
                    </div>
                  </div>
                ))}
                {domainStats.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No domains available in this category</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
              <p className="text-gray-600">Domains Explored</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Domain Progress */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Domain Expertise</h2>
          <div className="space-y-6">
            {domainProgress.map(domain => (
              <div key={domain.id} className="space-y-3">
                <ProgressBar
                  progress={domain.completed}
                  total={domain.total}
                  label={domain.name}
                  color={domain.color}
                />
                <div className="ml-4 space-y-2">
                  {domain.electives.map(se => (
                    <div key={se.electiveId} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-gray-700">
                        {se.elective?.name} ({se.elective?.code}) - Sem {se.semester}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Elective Timeline */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Elective Timeline</h2>
          {electiveHistory.length > 0 ? (
            <div className="space-y-4">
              {electiveHistory.map((se, index) => (
                <div key={se.electiveId} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{index + 1}</span>
                    </div>
                    {index !== electiveHistory.length - 1 && (
                      <div className="w-px h-6 bg-gray-300 mx-auto mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{se.elective?.name}</h3>
                    <p className="text-sm text-gray-600">
                      {se.elective?.code} • Semester {se.semester} • {se.elective?.domain}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{se.elective?.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No electives completed yet</p>
              <p className="text-sm text-gray-500 mt-1">Start selecting electives to see your timeline</p>
            </div>
          )}
        </div>
      </div>

      {/* Current Semester Recommendations */}
      {!hasSelectedThisSemester && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Available for Semester {currentSemester}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableElectives.map(elective => (
              <div key={elective.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{elective.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getDomainColor(elective.domain)}`}>
                    {elective.domain}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{elective.code} • {elective.credits} Credits</p>
                <p className="text-gray-700 mb-4">{elective.description}</p>
                
                <button
                  onClick={() => handleElectiveSelect(elective.id)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Select This Elective
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProgress;