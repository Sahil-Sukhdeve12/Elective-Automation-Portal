import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { BookOpen, Check, Star, MessageSquare } from 'lucide-react';
import ElectiveFeedback from '../../components/common/ElectiveFeedback';

const StudentElectives: React.FC = () => {
  const { user, markUserAsExperienced } = useAuth();
  const { electives, getStudentElectives, selectElective, getRecommendations, getDomainsByDepartment } = useData();
  const { getAverageRating, hasUserRated, addFeedback } = useFeedback();
  const { addNotification } = useNotifications();
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedElective, setSelectedElective] = useState<string | null>(null);
  const [feedbackElective, setFeedbackElective] = useState<string | null>(null);

  if (!user || user.role !== 'student') return null;

  const currentSemester = user.semester || 5;
  const studentElectives = getStudentElectives(user.id);
  const completedElectiveIds = studentElectives.map(se => se.electiveId);
  const hasSelectedThisSemester = studentElectives.some(se => se.semester === currentSemester);
  
  // Get domains and electives specific to user's department
  const departmentDomains = getDomainsByDepartment(user.department || '');
  const recommendations = getRecommendations(user.id, currentSemester);
  const departmentElectives = recommendations.filter(e => e.department === user.department);
  
  const availableElectives = selectedDomain 
    ? departmentElectives.filter(e => e.domain === selectedDomain)
    : departmentElectives;

  const handleElectiveSelect = (electiveId: string) => {
    if (hasSelectedThisSemester) {
      addNotification({
        type: 'warning',
        title: 'Already Selected',
        message: 'You have already selected an elective for this semester.'
      });
      return;
    }

    selectElective(user.id, electiveId, currentSemester);
    
    // Mark user as experienced after their first elective selection
    if (user.isNewUser) {
      markUserAsExperienced();
    }
    
    addNotification({
      type: 'success',
      title: 'Elective Selected!',
      message: 'Your elective has been successfully registered for this semester.'
    });
    setSelectedElective(electiveId);
  };

  const handleFeedbackSubmit = (feedback: { rating: number; comment: string }) => {
    if (feedbackElective) {
      addFeedback({
        studentId: user.id,
        electiveId: feedbackElective,
        ...feedback
      });
      addNotification({
        type: 'success',
        title: 'Feedback Submitted',
        message: 'Thank you for your valuable feedback!'
      });
    }
  };

  const getDomainColor = (domainName: string) => {
    const domain = departmentDomains.find(d => d.name === domainName);
    return domain?.color || 'bg-gray-500';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-2">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Select Electives</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Choose your electives for Semester {currentSemester}
        </p>
        
        {user.isNewUser && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md">
            <h3 className="text-blue-800 dark:text-blue-200 font-semibold mb-2">Welcome to ElectivePro! 🎉</h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              This is your first time here. Browse through the available electives and select one that interests you. 
              After selecting an elective, you'll be able to track your progress and view your academic roadmap.
            </p>
          </div>
        )}
        
        {hasSelectedThisSemester && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md">
            <p className="text-green-800 dark:text-green-200 text-sm">
              ✓ You have already selected an elective for this semester.
            </p>
          </div>
        )}
      </div>

      {/* Domain Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDomain('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedDomain === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Domains
          </button>
          {departmentDomains.map(domain => (
            <button
              key={domain.id}
              onClick={() => setSelectedDomain(domain.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedDomain === domain.name
                  ? `${domain.color} text-white`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {domain.name}
            </button>
          ))}
        </div>
      </div>

      {/* Completed Electives Section */}
      {completedElectiveIds.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Completed Electives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentElectives.map(se => {
              const elective = electives.find(e => e.id === se.electiveId);
              const hasRated = hasUserRated(user.id, se.electiveId);
              const avgRating = getAverageRating(se.electiveId);
              
              if (!elective) return null;
              
              return (
                <div key={se.electiveId} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{elective.name}</h3>
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {elective.code} • Sem {se.semester} • {elective.domain}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                      elective.category === 'Practical' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {elective.category}
                    </span>
                  </div>
                  
                  {avgRating > 0 && (
                    <div className="mb-3">
                      {renderStars(avgRating)}
                    </div>
                  )}
                  
                  {!hasRated ? (
                    <button
                      onClick={() => setFeedbackElective(se.electiveId)}
                      className="flex items-center text-blue-600 hover:text-blue-500 text-sm font-medium"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Rate this elective
                    </button>
                  ) : (
                    <span className="text-green-600 text-sm font-medium">
                      ✓ Feedback submitted
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Electives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableElectives.map(elective => {
          const isCompleted = completedElectiveIds.includes(elective.id);
          const isRecommended = recommendations.slice(0, 3).includes(elective);
          const avgRating = getAverageRating(elective.id);
          
          return (
            <div
              key={elective.id}
              className={`bg-white p-6 rounded-lg shadow-sm border transition-all duration-200 ${
                isCompleted
                  ? 'border-green-300 bg-green-50'
                  : selectedElective === elective.id
                  ? 'border-blue-300 bg-blue-50'
                  : 'hover:shadow-md hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{elective.name}</h3>
                    {isRecommended && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{elective.code} • {elective.credits} Credits</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                      elective.category === 'Practical' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {elective.category}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getDomainColor(elective.domain)}`}>
                  {elective.domain}
                </span>
              </div>

              <p className="text-gray-700 mb-4">{elective.description}</p>

              {avgRating > 0 && (
                <div className="mb-4">
                  {renderStars(avgRating)}
                </div>
              )}

              {elective.prerequisites && elective.prerequisites.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Prerequisites:</p>
                  <div className="flex flex-wrap gap-1">
                    {elective.prerequisites.map(prereqId => {
                      const prereq = electives.find(e => e.id === prereqId);
                      const isPrereqMet = completedElectiveIds.includes(prereqId);
                      
                      return (
                        <span
                          key={prereqId}
                          className={`px-2 py-1 rounded text-xs ${
                            isPrereqMet
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {prereq?.code || prereqId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                {isCompleted ? (
                  <span className="flex items-center text-green-600 font-medium">
                    <Check className="w-4 h-4 mr-1" />
                    Completed
                  </span>
                ) : selectedElective === elective.id ? (
                  <span className="flex items-center text-blue-600 font-medium">
                    <Check className="w-4 h-4 mr-1" />
                    Selected
                  </span>
                ) : (
                  <button
                    onClick={() => handleElectiveSelect(elective.id)}
                    disabled={hasSelectedThisSemester || 
                      (elective.prerequisites && !elective.prerequisites.every(prereq => completedElectiveIds.includes(prereq)))}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Select Elective
                  </button>
                )}
                
                {isRecommended && (
                  <span className="text-yellow-600 text-sm font-medium">Recommended</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {availableElectives.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No electives available</h3>
          <p className="text-gray-600">
            {selectedDomain 
              ? `No electives found in the ${selectedDomain} domain for this semester.`
              : `No electives are available for semester ${currentSemester}.`
            }
          </p>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackElective && (
        <ElectiveFeedback
          electiveId={feedbackElective}
          electiveName={electives.find(e => e.id === feedbackElective)?.name || ''}
          isOpen={!!feedbackElective}
          onClose={() => setFeedbackElective(null)}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
};

export default StudentElectives;