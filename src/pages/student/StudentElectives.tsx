import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { BookOpen, Users, Clock } from 'lucide-react';

const StudentElectives: React.FC = () => {
  const { user, markUserAsExperienced } = useAuth();
  const { 
    electives, 
    getStudentElectives, 
    selectElective, 
    getTracksByDepartment,
    isElectiveSelectionOpen,
    getElectiveEnrollmentCount,
    isElectiveAvailable
  } = useData();
  const { addNotification } = useNotifications();
  
  const [selectedTrack, setSelectedTrack] = useState('');

  // Calculate semesters
  const currentSemester = user?.semester || 1;
  const electiveSelectionSemester = currentSemester + 1;

  // Get student's electives
  const allStudentElectives = useMemo(() => 
    user ? getStudentElectives(user.id) : [], 
    [user, getStudentElectives]
  );

  // Get electives selected for the target semester
  const selectedElectivesThisSemester = useMemo(() => 
    allStudentElectives.filter(se => se.semester === electiveSelectionSemester),
    [allStudentElectives, electiveSelectionSemester]
  );

  // Get available electives for the target semester
  const electivesForTargetSemester = useMemo(() => 
    electives.filter(e => e.semester === electiveSelectionSemester),
    [electives, electiveSelectionSemester]
  );

  // Filter out already selected electives
  const availableElectives = useMemo(() => {
    const selectedIds = selectedElectivesThisSemester.map(se => se.electiveId);
    return electivesForTargetSemester.filter(e => !selectedIds.includes(e.id));
  }, [electivesForTargetSemester, selectedElectivesThisSemester]);

  // Get categories and tracks
  const departmentTracks = getTracksByDepartment(user?.department || '');

  // Selection limits
  const MAX_SELECTIONS = 6;
  const canSelectMore = selectedElectivesThisSemester.length < MAX_SELECTIONS;

  // Filter electives by selected track
  const displayElectives = selectedTrack 
    ? availableElectives.filter(e => e.track === selectedTrack)
    : availableElectives;

  // Handle elective selection
  const handleElectiveSelect = async (electiveId: string) => {
    if (!user) return;

    // Check if can select more
    if (!canSelectMore) {
      addNotification({
        type: 'warning',
        title: 'Selection Limit Reached',
        message: `You can only select up to ${MAX_SELECTIONS} electives per semester.`
      });
      return;
    }

    // Check if already selected
    if (selectedElectivesThisSemester.some(se => se.electiveId === electiveId)) {
      addNotification({
        type: 'warning',
        title: 'Already Selected',
        message: 'You have already selected this elective for this semester.'
      });
      return;
    }

    // Check if selection is open
    if (!isElectiveSelectionOpen(electiveId)) {
      addNotification({
        type: 'error',
        title: 'Selection Closed',
        message: 'The deadline for this elective has passed.'
      });
      return;
    }

    // Check availability
    const availability = isElectiveAvailable(electiveId);
    if (!availability.available) {
      addNotification({
        type: 'error',
        title: 'Not Available',
        message: availability.reason || 'This elective is not available.'
      });
      return;
    }

    try {
      // Select the elective
      selectElective(user.id, electiveId, electiveSelectionSemester);
      
      // Mark user as experienced
      if (user.isNewUser) {
        markUserAsExperienced();
      }

      // Show success notification
      const elective = electives.find(e => e.id === electiveId);
      addNotification({
        type: 'success',
        title: 'Elective Selected!',
        message: `You have successfully selected "${elective?.name}" for Semester ${electiveSelectionSemester}.`
      });

    } catch {
      addNotification({
        type: 'error',
        title: 'Selection Failed',
        message: 'Failed to select elective. Please try again.'
      });
    }
  };

  // Early return after all hooks
  if (!user || user.role !== 'student') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600 mt-2">This page is only available to students.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Select Electives</h1>
        <p className="text-gray-600 mt-2">
          Choose electives for Semester {electiveSelectionSemester} (Next Semester)
        </p>
        <div className="mt-2 text-sm text-gray-500">
          Current Semester: {currentSemester} | Selecting for: Semester {electiveSelectionSemester}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Selection Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Available:</span>
            <span className="ml-2 font-medium">{availableElectives.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Selected:</span>
            <span className="ml-2 font-medium">{selectedElectivesThisSemester.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Remaining:</span>
            <span className="ml-2 font-medium">{MAX_SELECTIONS - selectedElectivesThisSemester.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Can Select:</span>
            <span className={`ml-2 font-medium ${canSelectMore ? 'text-green-600' : 'text-red-600'}`}>
              {canSelectMore ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Selected Electives */}
      {selectedElectivesThisSemester.length > 0 && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            Selected Electives for Semester {electiveSelectionSemester}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedElectivesThisSemester.map(selection => {
              const elective = electives.find(e => e.id === selection.electiveId);
              if (!elective) return null;
              
              return (
                <div key={selection.electiveId} className="flex items-center space-x-3 p-3 bg-white rounded border">
                  <span className="text-green-600">✓</span>
                  <div className="flex-1">
                    <div className="font-medium">{elective.name}</div>
                    <div className="text-sm text-gray-600">{elective.code} • {elective.credits} Credits</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs text-white ${
                    elective.category === 'Departmental' ? 'bg-blue-500' :
                    elective.category === 'Open' ? 'bg-orange-500' : 'bg-purple-500'
                  }`}>
                    {elective.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Track Filter */}
      {departmentTracks.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Track
          </label>
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Tracks</option>
            {departmentTracks.map(track => (
              <option key={track.id} value={track.name}>{track.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Available Electives */}
      {displayElectives.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayElectives.map(elective => {
            const enrollmentCount = getElectiveEnrollmentCount(elective.id);
            const isSelectionOpen = isElectiveSelectionOpen(elective.id);
            const availability = isElectiveAvailable(elective.id);
            
            return (
              <div key={elective.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{elective.name}</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-gray-600">{elective.code} • {elective.credits} Credits</span>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${
                      elective.category === 'Departmental' ? 'bg-blue-500' :
                      elective.category === 'Open' ? 'bg-orange-500' : 'bg-purple-500'
                    }`}>
                      {elective.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{elective.description}</p>
                </div>

                {/* Enrollment Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Enrollment:</span>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{enrollmentCount}{elective.maxEnrollment ? ` / ${elective.maxEnrollment}` : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Track Info */}
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {elective.track}
                  </span>
                </div>

                {/* Select Button */}
                <div className="flex justify-end">
                  {!isSelectionOpen ? (
                    <div className="flex items-center text-red-600 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      Deadline passed
                    </div>
                  ) : (
                    <button
                      onClick={() => handleElectiveSelect(elective.id)}
                      disabled={!canSelectMore || !availability.available}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        !canSelectMore || !availability.available
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {!canSelectMore ? 'Limit Reached' : 
                       !availability.available ? 'Not Available' : 
                       'Select Elective'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Electives Available</h3>
          <p className="text-gray-600">
            {selectedTrack 
              ? `No electives found in the ${selectedTrack} track for semester ${electiveSelectionSemester}.`
              : `No electives are available for semester ${electiveSelectionSemester}.`
            }
          </p>
          {selectedTrack && (
            <button
              onClick={() => setSelectedTrack('')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Show All Tracks
            </button>
          )}
        </div>
      )}

      {/* Welcome Message for New Users */}
      {user.isNewUser && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-blue-800 font-semibold mb-2">Welcome to ElectivePro! 🎉</h3>
          <p className="text-blue-700 text-sm">
            This is your first time here. Select electives that interest you for the next semester. 
            You can select up to {MAX_SELECTIONS} electives.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentElectives;
  const canSelectElective = nextSemesterSelections.length < MAX_ELECTIVES_PER_SEMESTER;
  
  // Get tracks and electives specific to user's department
  const departmenttracks = getTracksByDepartment(user.department || '');
  
  // Get current track for recommendations
  const trackAnalysis = departmenttracks.map(track => ({
    track: track.name,
    count: studentElectives.filter(se => se.track === track.name).length
  })).sort((a, b) => b.count - a.count);
  
  // For new users with no electives, use the first available track as current track
  const currentTrack = trackAnalysis[0]?.track || departmenttracks[0]?.name || '';
  
  // Categorize available electives for the next semester
  const recommendedElectives = availableElectives.filter(e => e.track === currentTrack);
  const otherElectives = availableElectives.filter(e => e.track !== currentTrack);
  
  const displayElectives = selectedtrack 
    ? availableElectives.filter(e => e.track === selectedtrack)
    : availableElectives;

  const handleElectiveSelect = (electiveId: string) => {
    if (!canSelectElective) {
      addNotification({
        type: 'warning',
        title: 'Selection Limit Reached',
        message: `You have already selected the maximum number of electives for this semester (${MAX_ELECTIVES_PER_SEMESTER}).`
      });
      return;
    }

    // Check if this specific elective is already selected for this semester
    if (completedElectiveIds.includes(electiveId)) {
      addNotification({
        type: 'warning',
        title: 'Already Selected',
        message: 'You have already selected this elective for this semester.'
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

    // Check enrollment availability
    const availability = isElectiveAvailable(electiveId);
    if (!availability.available) {
      addNotification({
        type: 'error',
        title: 'Elective Not Available',
        message: availability.reason || 'This elective is no longer available for selection.'
      });
      return;
    }

    selectElective(user.id, electiveId, electiveSelectionSemester);
    
    // Mark user as experienced after their first elective selection
    if (user.isNewUser) {
      markUserAsExperienced();
    }
    
    addNotification({
      type: 'success',
      title: 'Elective Selected!',
      message: 'Your elective has been successfully registered for this semester.'
    });
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

  const gettrackColor = (trackName: string) => {
    const track = departmenttracks.find(d => d.name === trackName);
    return track?.color || 'bg-gray-500';
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
          Choose your electives for Semester {electiveSelectionSemester} (Next Semester)
        </p>
        <div className="mt-2 text-sm text-gray-500">
          Current Semester: {currentSemester} | Selecting for: Semester {electiveSelectionSemester}
        </div>
        
        {/* Debug Panel for Testing */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-xs text-gray-600 mb-2">
            Debug: Available electives for semester {electiveSelectionSemester}: {availableElectives.length} | 
            Selected this semester: {nextSemesterSelections.length} | 
            Can select: {canSelectElective ? 'Yes' : 'No'} |
            Available categories: [{availableCategories.join(', ')}] |
            Selected categories: [{Array.from(selectedCategories).join(', ')}]
          </p>
          <button
            onClick={() => {
              // Clear all selections for this user for testing
              const studentElectives = JSON.parse(localStorage.getItem('studentElectives') || '[]');
              const filteredElectives = studentElectives.filter((se: {studentId: string}) => se.studentId !== user.id);
              localStorage.setItem('studentElectives', JSON.stringify(filteredElectives));
              window.location.reload();
            }}
            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
          >
            Clear My Selections (Test)
          </button>
        </div>
        
        {user.isNewUser && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-blue-800 font-semibold mb-2">Welcome to ElectivePro! 🎉</h3>
            <p className="text-blue-700 text-sm">
              This is your first time here. Browse through the available electives and select one that interests you. 
              After selecting an elective, you'll be able to track your progress and view your academic roadmap.
            </p>
          </div>
        )}
        
        {!canSelectElective && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              ✓ You have reached the maximum selection limit for this semester ({MAX_ELECTIVES_PER_SEMESTER} electives).
              <span className="block mt-1">
                Selected electives: {nextSemesterSelections.length} / {MAX_ELECTIVES_PER_SEMESTER}
              </span>
            </p>
          </div>
        )}

        {canSelectElective && nextSemesterSelections.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800 text-sm">
              You can select {MAX_ELECTIVES_PER_SEMESTER - nextSemesterSelections.length} more elective(s) for this semester.
              <span className="block mt-1">
                Currently selected: {nextSemesterSelections.length} / {MAX_ELECTIVES_PER_SEMESTER}
              </span>
            </p>
          </div>
        )}

        {/* Show selected electives for this semester */}
        {nextSemesterSelections.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-green-800 font-semibold mb-2">
              Selected Electives for Semester {electiveSelectionSemester}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {nextSemesterSelections.map(selection => {
                const elective = electives.find(e => e.id === selection.electiveId);
                return elective ? (
                  <div key={selection.electiveId} className="flex items-center space-x-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span className="font-medium">{elective.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${
                      elective.category === 'Departmental' ? 'bg-blue-500' :
                      elective.category === 'Open' ? 'bg-orange-500' : 'bg-purple-500'
                    }`}>
                      {elective.category}
                    </span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* track Filter */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by track</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedtrack('')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedtrack === '' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All tracks
          </button>
          {departmenttracks.map(track => (
            <button
              key={track.id}
              onClick={() => setSelectedtrack(track.name)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedtrack === track.name 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {track.name}
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
                      {elective.code} • Sem {se.semester} • {elective.track}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                      elective.category === 'Open' ? 'bg-orange-500' : 'bg-blue-500'
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
      {currentTrack && recommendedElectives.length > 0 && canSelectElective && (
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
                          elective.category === 'Open' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {elective.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 text-sm">{elective.description}</p>

                  {/* Enrollment Information */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-md border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Enrollment:</span>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">
                          {getElectiveEnrollmentCount(elective.id)}
                          {elective.maxEnrollment && ` / ${elective.maxEnrollment}`}
                        </span>
                      </div>
                    </div>
                    {elective.maxEnrollment && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              getElectiveEnrollmentCount(elective.id) >= elective.maxEnrollment
                                ? 'bg-red-500'
                                : getElectiveEnrollmentCount(elective.id) / elective.maxEnrollment > 0.8
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min((getElectiveEnrollmentCount(elective.id) / elective.maxEnrollment) * 100, 100)}%`
                            }}
                          />
                        </div>
                        {getElectiveEnrollmentCount(elective.id) >= elective.maxEnrollment && (
                          <p className="text-xs text-red-600 mt-1">Maximum enrollment reached</p>
                        )}
                      </div>
                    )}
                  </div>

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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${gettrackColor(elective.track)}`}>
                      {elective.track}
                    </span>
                    
                    {!isSelectionOpen ? (
                      <div className="flex items-center text-red-600 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        Deadline passed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleElectiveSelect(elective.id)}
                        disabled={!canSelectElective || !isElectiveAvailable(elective.id).available}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          !canSelectElective || !isElectiveAvailable(elective.id).available
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                        }`}
                      >
                        {!canSelectElective 
                          ? 'Limit Reached' 
                          : !isElectiveAvailable(elective.id).available 
                          ? 'Full' 
                          : 'Select Elective'
                        }
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
      {otherElectives.length > 0 && canSelectElective && !selectedtrack && (
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
                          elective.category === 'Open' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {elective.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 text-sm">{elective.description}</p>

                  {/* Enrollment Information */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-md border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Enrollment:</span>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">
                          {getElectiveEnrollmentCount(elective.id)}
                          {elective.maxEnrollment && ` / ${elective.maxEnrollment}`}
                        </span>
                      </div>
                    </div>
                    {elective.maxEnrollment && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              getElectiveEnrollmentCount(elective.id) >= elective.maxEnrollment
                                ? 'bg-red-500'
                                : getElectiveEnrollmentCount(elective.id) / elective.maxEnrollment > 0.8
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min((getElectiveEnrollmentCount(elective.id) / elective.maxEnrollment) * 100, 100)}%`
                            }}
                          />
                        </div>
                        {getElectiveEnrollmentCount(elective.id) >= elective.maxEnrollment && (
                          <p className="text-xs text-red-600 mt-1">Maximum enrollment reached</p>
                        )}
                      </div>
                    )}
                  </div>

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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${gettrackColor(elective.track)}`}>
                      {elective.track}
                    </span>
                    
                    {!isSelectionOpen ? (
                      <div className="flex items-center text-red-600 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        Deadline passed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleElectiveSelect(elective.id)}
                        disabled={!canSelectElective || !isElectiveAvailable(elective.id).available}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          !canSelectElective || !isElectiveAvailable(elective.id).available
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {!canSelectElective 
                          ? 'Limit Reached' 
                          : !isElectiveAvailable(elective.id).available 
                          ? 'Full' 
                          : 'Select Elective'
                        }
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Electives (Filtered) - Show when track filter is active */}
      {selectedtrack && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {selectedtrack} Electives
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayElectives.map(elective => {
              const avgRating = getAverageRating(elective.id);
              const isSelectionOpen = isElectiveSelectionOpen(elective.id);
              const futureOptions = getFutureElectives(elective.id);
              const isRecommended = recommendedElectives.some(rec => rec.id === elective.id);
              const hasSelectedThisSemester = studentElectives.some(se => 
                se.electiveId === elective.id && se.semester === electiveSelectionSemester
              );
              
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
                          elective.category === 'Open' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {elective.category}
                        </span>
                      </div>
                    </div>
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${gettrackColor(elective.track)}`}>
                      {elective.track}
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
            {selectedtrack 
              ? `No electives found in the ${selectedtrack} track for this semester.`
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
          isOpen={true}
          onSubmit={handleFeedbackSubmit}
          onClose={() => setFeedbackElective(null)}
        />
      )}
    </div>
  );
};

export default StudentElectives;
