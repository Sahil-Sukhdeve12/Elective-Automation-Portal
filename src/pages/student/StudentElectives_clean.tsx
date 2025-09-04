import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { BookOpen, Check, Star, MessageSquare, Info, Clock, AlertCircle, Target } from 'lucide-react';
import ElectiveFeedback from '../../components/common/ElectiveFeedback';
import ElectiveInfoModal from '../../components/common/ElectiveInfoModal';
import PreviousElectiveFeedback from '../../components/common/PreviousElectiveFeedback';
import ElectiveRecommendation from '../../components/common/ElectiveRecommendation';

const StudentElectives: React.FC = () => {
  const { user, markUserAsExperienced } = useAuth();
  const { 
    electives, 
    getStudentElectives, 
    selectElective, 
    getDomainsByDepartment,
    isElectiveSelectionOpen,
    getFutureElectives,
    addElectiveFeedback,
    getElectiveRecommendation
  } = useData();
  const { getAverageRating, hasUserRated, addFeedback } = useFeedback();
  const { addNotification } = useNotifications();
  
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedElective, setSelectedElective] = useState<string | null>(null);
  const [feedbackElective, setFeedbackElective] = useState<string | null>(null);
  const [infoElective, setInfoElective] = useState<string | null>(null);
  const [showPreviousFeedback, setShowPreviousFeedback] = useState(false);
  const [previousSemesterElective, setPreviousSemesterElective] = useState<string | null>(null);

  // Check for previous semester elective to request feedback
  useEffect(() => {
    if (!user) return;
    
    const currentSemester = user.semester || 5;
    const studentElectives = getStudentElectives(user.id);
    const previousSemesterElectives = studentElectives.filter(se => se.semester === currentSemester - 1);
    
    if (previousSemesterElectives.length > 0 && !showPreviousFeedback) {
      const lastElective = previousSemesterElectives[previousSemesterElectives.length - 1];
      // Check if feedback already given
      const hasGivenFeedback = localStorage.getItem(`feedback_${user.id}_${lastElective.electiveId}`);
      if (!hasGivenFeedback) {
        setPreviousSemesterElective(lastElective.electiveId);
        setShowPreviousFeedback(true);
      }
    }
  }, [user, getStudentElectives, showPreviousFeedback]);

  if (!user || user.role !== 'student') return null;

  const currentSemester = user.semester || 5;
  const studentElectives = getStudentElectives(user.id);
  const completedElectiveIds = studentElectives.map(se => se.electiveId);
  const hasSelectedThisSemester = studentElectives.some(se => se.semester === currentSemester);
  
  // Get domains and electives specific to user's department
  const departmentDomains = getDomainsByDepartment(user.department || '');
  
  // Filter electives for current semester (considering user's updated semester)
  const currentSemesterElectives = electives.filter(e => 
    e.semester === currentSemester && 
    !completedElectiveIds.includes(e.id)
  );
  
  // Get current track for recommendations
  const trackAnalysis = departmentDomains.map(domain => ({
    domain: domain.name,
    count: studentElectives.filter(se => se.domain === domain.name).length
  })).sort((a, b) => b.count - a.count);
  
  const currentTrack = trackAnalysis[0]?.domain || '';
  
  // Categorize current semester electives
  const recommendedElectives = currentSemesterElectives.filter(e => e.domain === currentTrack);
  const otherElectives = currentSemesterElectives.filter(e => e.domain !== currentTrack);
  
  const availableElectives = selectedDomain 
    ? currentSemesterElectives.filter(e => e.domain === selectedDomain)
    : currentSemesterElectives;

  const handleElectiveSelect = (electiveId: string) => {
    if (hasSelectedThisSemester) {
      addNotification({
        type: 'warning',
        title: 'Already Selected',
        message: 'You have already selected an elective for this semester.'
      });
      return;
    }

    // Check if selection is still open
    if (!isElectiveSelectionOpen(electiveId)) {
      addNotification({
        type: 'error',
        title: 'Selection Closed',
        message: 'The deadline for selecting this elective has passed.'
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

  const handlePreviousFeedbackSubmit = (feedback: {
    rating: number;
    comment: string;
    wouldRecommend: boolean;
    improvements: string;
  }) => {
    if (previousSemesterElective) {
      addElectiveFeedback({
        studentId: user.id,
        previousElectiveId: previousSemesterElective,
        semester: currentSemester - 1,
        feedback,
        submittedAt: new Date()
      });
      
      // Mark feedback as given
      localStorage.setItem(`feedback_${user.id}_${previousSemesterElective}`, 'true');
      
      addNotification({
        type: 'success',
        title: 'Feedback Submitted',
        message: 'Thank you for sharing your experience! This will help other students.'
      });
      
      setShowPreviousFeedback(false);
      setPreviousSemesterElective(null);
    }
  };

  const handleGetRecommendations = (preferences: {
    interests: string[];
    careerGoals: string;
    difficulty: string;
  }) => {
    return getElectiveRecommendation(user.id, preferences);
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
        <h1 className="text-3xl font-bold text-gray-900">Select Electives</h1>
        <p className="text-gray-600 mt-2">
          Choose your electives for Semester {currentSemester}
        </p>
        
        {user.isNewUser && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-blue-800 font-semibold mb-2">Welcome to ElectivePro! 🎉</h3>
            <p className="text-blue-700 text-sm">
              This is your first time here. Browse through the available electives and select one that interests you. 
              After selecting an elective, you'll be able to track your progress and view your academic roadmap.
            </p>
          </div>
        )}
        
        {hasSelectedThisSemester && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm">
              ✓ You have already selected an elective for this semester.
            </p>
          </div>
        )}
      </div>

      {/* Domain Filter */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Domain</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDomain('')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedDomain === '' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Domains
          </button>
          {departmentDomains.map(domain => (
            <button
              key={domain.id}
              onClick={() => setSelectedDomain(domain.name)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedDomain === domain.name 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                <div key={se.electiveId} className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{elective.name}</h3>
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <p className="text-sm text-gray-600">
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

      {/* Track-based Recommendations */}
      {currentTrack && recommendedElectives.length > 0 && !hasSelectedThisSemester && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
              <Star className="w-5 h-5 text-yellow-500 mr-2" />
              Recommended for Your Track: {currentTrack}
            </h2>
            <p className="text-gray-600 text-sm">
              Based on your completed electives, these courses align with your learning path.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {recommendedElectives.map(elective => {
              const avgRating = getAverageRating(elective.id);
              const isSelectionOpen = isElectiveSelectionOpen(elective.id);
              const futureOptions = getFutureElectives(elective.id);
              
              return (
                <div
                  key={elective.id}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg shadow-sm border border-yellow-200 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{elective.name}</h3>
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Recommended
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-600">{elective.code} • {elective.credits} Credits</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                          elective.category === 'Practical' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {elective.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setInfoElective(elective.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View elective information"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-gray-700 mb-4 text-sm">{elective.description}</p>

                  {avgRating > 0 && (
                    <div className="mb-4">
                      {renderStars(avgRating)}
                    </div>
                  )}

                  {futureOptions.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Future Opportunities:</h4>
                      <div className="space-y-1">
                        {futureOptions.slice(0, 2).map(future => (
                          <p key={future.id} className="text-xs text-blue-700">
                            → {future.name}
                          </p>
                        ))}
                        {futureOptions.length > 2 && (
                          <p className="text-xs text-blue-600">+{futureOptions.length - 2} more options</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getDomainColor(elective.domain)}`}>
                      {elective.domain}
                    </span>
                    
                    {!isSelectionOpen ? (
                      <div className="flex items-center text-red-600 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        Deadline passed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleElectiveSelect(elective.id)}
                        disabled={hasSelectedThisSemester}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          hasSelectedThisSemester
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                        }`}
                      >
                        {hasSelectedThisSemester ? 'Already Selected' : 'Select Elective'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Available Electives */}
      {otherElectives.length > 0 && !hasSelectedThisSemester && !selectedDomain && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Other Available Electives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherElectives.map(elective => {
              const avgRating = getAverageRating(elective.id);
              const isSelectionOpen = isElectiveSelectionOpen(elective.id);
              const futureOptions = getFutureElectives(elective.id);
              
              return (
                <div
                  key={elective.id}
                  className="bg-white p-6 rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md hover:border-gray-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{elective.name}</h3>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-600">{elective.code} • {elective.credits} Credits</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                          elective.category === 'Practical' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {elective.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setInfoElective(elective.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View elective information"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-gray-700 mb-4 text-sm">{elective.description}</p>

                  {avgRating > 0 && (
                    <div className="mb-4">
                      {renderStars(avgRating)}
                    </div>
                  )}

                  {futureOptions.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Future Opportunities:</h4>
                      <div className="space-y-1">
                        {futureOptions.slice(0, 2).map(future => (
                          <p key={future.id} className="text-xs text-blue-700">
                            → {future.name}
                          </p>
                        ))}
                        {futureOptions.length > 2 && (
                          <p className="text-xs text-blue-600">+{futureOptions.length - 2} more options</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getDomainColor(elective.domain)}`}>
                      {elective.domain}
                    </span>
                    
                    {!isSelectionOpen ? (
                      <div className="flex items-center text-red-600 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        Deadline passed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleElectiveSelect(elective.id)}
                        disabled={hasSelectedThisSemester}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          hasSelectedThisSemester
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {hasSelectedThisSemester ? 'Already Selected' : 'Select Elective'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Electives (Filtered) - Show when domain filter is active */}
      {selectedDomain && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {selectedDomain} Electives
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableElectives.map(elective => {
              const avgRating = getAverageRating(elective.id);
              const isSelectionOpen = isElectiveSelectionOpen(elective.id);
              const futureOptions = getFutureElectives(elective.id);
              const isRecommended = recommendedElectives.some(rec => rec.id === elective.id);
              
              return (
                <div
                  key={elective.id}
                  className={`p-6 rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md hover:border-gray-300 ${
                    isRecommended ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{elective.name}</h3>
                        {isRecommended && (
                          <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-600">{elective.code} • {elective.credits} Credits</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                          elective.category === 'Practical' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {elective.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setInfoElective(elective.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View elective information"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-gray-700 mb-4 text-sm">{elective.description}</p>

                  {avgRating > 0 && (
                    <div className="mb-4">
                      {renderStars(avgRating)}
                    </div>
                  )}

                  {futureOptions.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Future Opportunities:</h4>
                      <div className="space-y-1">
                        {futureOptions.slice(0, 2).map(future => (
                          <p key={future.id} className="text-xs text-blue-700">
                            → {future.name}
                          </p>
                        ))}
                        {futureOptions.length > 2 && (
                          <p className="text-xs text-blue-600">+{futureOptions.length - 2} more options</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getDomainColor(elective.domain)}`}>
                      {elective.domain}
                    </span>
                    
                    {!isSelectionOpen ? (
                      <div className="flex items-center text-red-600 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        Deadline passed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleElectiveSelect(elective.id)}
                        disabled={hasSelectedThisSemester}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          hasSelectedThisSemester
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isRecommended
                            ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {hasSelectedThisSemester ? 'Already Selected' : 'Select Elective'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
          onSubmit={handleFeedbackSubmit}
          onClose={() => setFeedbackElective(null)}
        />
      )}

      {/* Info Modal */}
      {infoElective && (
        <ElectiveInfoModal
          elective={electives.find(e => e.id === infoElective)!}
          onClose={() => setInfoElective(null)}
        />
      )}

      {/* Previous Semester Feedback Modal */}
      {showPreviousFeedback && previousSemesterElective && (
        <PreviousElectiveFeedback
          elective={electives.find(e => e.id === previousSemesterElective)!}
          onSubmit={handlePreviousFeedbackSubmit}
          onClose={() => {
            setShowPreviousFeedback(false);
            setPreviousSemesterElective(null);
          }}
        />
      )}

      {/* AI Recommendation Component */}
      <ElectiveRecommendation
        onGetRecommendations={handleGetRecommendations}
        availableElectives={currentSemesterElectives}
        onSelectElective={handleElectiveSelect}
        disabled={hasSelectedThisSemester}
      />
    </div>
  );
};

export default StudentElectives;
