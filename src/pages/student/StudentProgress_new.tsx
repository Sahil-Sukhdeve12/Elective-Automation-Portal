import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { BookOpen, Award, TrendingUp, Star, Target, Zap, ArrowRight, Clock } from 'lucide-react';
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
  const nextSemester = currentSemester + 1;
  
  // Get current track (most common domain in completed electives)
  const trackAnalysis = domains.map(domain => ({
    domain: domain.name,
    count: studentElectives.filter(se => se.domain === domain.name).length,
    color: domain.color
  })).sort((a, b) => b.count - a.count);
  
  const currentTrack = trackAnalysis[0]?.domain || '';
  
  // Recommend electives for next semester based on current track
  const nextSemesterElectives = electives.filter(e => 
    e.semester === nextSemester && 
    !studentElectives.some(se => se.electiveId === e.id)
  );
  
  const recommendedElectives = nextSemesterElectives.filter(e => e.domain === currentTrack);
  const otherElectives = nextSemesterElectives.filter(e => e.domain !== currentTrack);

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

      {/* Next Semester Recommendations */}
      {nextSemesterElectives.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Semester {nextSemester} Recommendations
          </h2>
          
          {currentTrack && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Your Current Track: {currentTrack}</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Based on your completed electives, these recommendations align with your learning path.
              </p>
            </div>
          )}

          {recommendedElectives.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                Recommended for You
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedElectives.map(elective => (
                  <div key={elective.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{elective.name}</h4>
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{elective.code} • {elective.credits} Credits</p>
                    <p className="text-sm text-gray-700 mb-3">{elective.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getDomainColor(elective.domain)}`}>
                        {elective.domain}
                      </span>
                      <span className="text-xs text-gray-500">{elective.electiveCategory}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherElectives.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Available Electives</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherElectives.map(elective => (
                  <div key={elective.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">{elective.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{elective.code} • {elective.credits} Credits</p>
                    <p className="text-sm text-gray-700 mb-3">{elective.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getDomainColor(elective.domain)}`}>
                        {elective.domain}
                      </span>
                      <span className="text-xs text-gray-500">{elective.electiveCategory}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Domain Progress Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Domain Progress Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {domainProgress.map(domain => (
            <div key={domain.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${domain.color}`}></div>
                  <h3 className="text-lg font-semibold text-gray-900">{domain.name}</h3>
                </div>
                <span className="text-sm text-gray-600">
                  {domain.completed}/{domain.total} completed
                </span>
              </div>
              
              <ProgressBar 
                progress={(domain.completed / Math.max(domain.total, 1)) * 100} 
                className="mb-4"
              />
              
              {domain.electives.length > 0 ? (
                <div className="space-y-2">
                  {domain.electives.map(se => (
                    <div key={`${se.studentId}-${se.electiveId}`} className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">{se.elective?.name}</span>
                      <span className="text-gray-500">• Sem {se.semester}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No electives completed in this domain yet</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Academic Timeline */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Academic Timeline</h2>
        {electiveHistory.length > 0 ? (
          <div className="space-y-4">
            {electiveHistory.map((se) => (
              <div key={`${se.studentId}-${se.electiveId}`} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{se.elective?.name}</h4>
                  <p className="text-sm text-gray-600">
                    {se.elective?.code} • Semester {se.semester} • {se.domain}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{se.elective?.credits} Credits</span>
                  <p className="text-xs text-gray-500">
                    {new Date(se.completedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No electives completed yet</h3>
            <p className="text-gray-600">Start your elective journey to see your progress here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProgress;
