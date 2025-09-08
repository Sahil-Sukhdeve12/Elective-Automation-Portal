import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, Elective } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Book, Users, Globe, ArrowRight, Info, Check, BookOpen, Calendar, Clock } from 'lucide-react';

const StudentElectiveSelection: React.FC = () => {
  const { user } = useAuth();
  const { 
    electives,
    getElectivesByCategoryAndDepartment, 
    getTracksByDepartment, 
    selectElective, 
    getStudentElectives,
    getAvailableCategories,
    isElectiveSelectionOpen,
    isElectiveAvailable
  } = useData();
  const { addNotification } = useNotifications();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedElectiveInfo, setSelectedElectiveInfo] = useState<Elective | null>(null);

  // Calculate the semester for elective selection (next semester)
  const currentSemester = user?.semester || 1;
  const electiveSelectionSemester = currentSemester;
  
  // Get student's electives and filter for the target semester
  const selectedElectivesThisSemester = useMemo(() => {
    if (!user) return [];
    const allStudentElectives = getStudentElectives(user.id);
    return allStudentElectives.filter(se => se.semester === electiveSelectionSemester);
  }, [user, getStudentElectives, electiveSelectionSemester]);

  // Get admin-configured categories
  const availableCategories = getAvailableCategories();

  // Check which categories have been selected for this semester
  const selectedCategories = useMemo(() => {
    const categories = new Set<string>();
    selectedElectivesThisSemester.forEach(selection => {
      const elective = electives.find(e => e.id === selection.electiveId);
      if (elective) {
        categories.add(elective.category);
      }
    });
    return categories;
  }, [selectedElectivesThisSemester, electives]);

  if (!user) return null;

  // Check if user can select from a specific category
  const canSelectFromCategory = (category: string) => {
    return !selectedCategories.has(category);
  };

  // Get available electives for the selected category
  // Get electives for the selected category and current semester
  const getElectives = () => {
    if (!selectedCategory || !user) return [];
    return getElectivesByCategoryAndDepartment(
      selectedCategory as 'Departmental' | 'Open' | 'Humanities', 
      user.department, 
      electiveSelectionSemester // Filter by current semester
    );
  };

  // Get available tracks for the selected category
  const getAvailableTracks = () => {
    if (!selectedCategory) return [];
    if (selectedCategory === 'Departmental') {
      return getTracksByDepartment(user.department || '');
    }
    // For other categories, get unique tracks from electives
    const categoryElectives = getElectives();
    const uniqueTracks = [...new Set(categoryElectives.map(e => e.track))];
    return uniqueTracks.map(track => ({ 
      id: track, 
      name: track, 
      description: '', 
      color: 'bg-gray-500', 
      suggestedElectives: [], 
      department: '' 
    }));
  };

  // Get filtered electives based on selected track
  const getFilteredElectives = () => {
    const categoryElectives = getElectives();
    if (!selectedTrack) return categoryElectives;
    return categoryElectives.filter(e => e.track === selectedTrack);
  };

  // Generate category data from admin configuration
  const categoryData = availableCategories.map(category => {
    const icons = {
      'Departmental': Book,
      'Open': Globe,
      'Humanities': Users
    };
    
    const colors = {
      'Departmental': 'bg-blue-500',
      'Open': 'bg-green-500', 
      'Humanities': 'bg-purple-500'
    };

    const hoverColors = {
      'Departmental': 'hover:bg-blue-600',
      'Open': 'hover:bg-green-600',
      'Humanities': 'hover:bg-purple-600'  
    };

    const descriptions = {
      'Departmental': 'Advanced courses in your department specialization',
      'Open': 'Courses from various departments available to multiple departments - check eligibility',
      'Humanities': 'Philosophy, communication, economics, and management courses'
    };

    return {
      id: category,
      title: category === 'Open' ? 'Open Elective' : category,
      description: descriptions[category as keyof typeof descriptions] || `${category} electives`,
      icon: icons[category as keyof typeof icons] || BookOpen,
      color: colors[category as keyof typeof colors] || 'bg-gray-500',
      hoverColor: hoverColors[category as keyof typeof hoverColors] || 'hover:bg-gray-600'
    };
  });

  const handleCategorySelect = (category: string) => {
    if (!canSelectFromCategory(category)) {
      addNotification({
        type: 'warning',
        title: 'Category Already Selected',
        message: `You have already selected an elective from the ${category} category for this semester.`
      });
      return;
    }
    setSelectedCategory(category);
    setSelectedTrack(''); // Reset track selection
  };

  const handleElectiveSelect = (electiveId: string) => {
    const elective = electives.find(e => e.id === electiveId);
    if (!elective) return;

    // Check if already selected this category
    if (!canSelectFromCategory(elective.category)) {
      addNotification({
        type: 'warning',
        title: 'Category Already Selected',
        message: `You have already selected an elective from the ${elective.category} category for this semester.`
      });
      return;
    }

    // Check if already selected this specific elective
    if (selectedElectivesThisSemester.some(se => se.electiveId === electiveId)) {
      addNotification({
        type: 'warning',
        title: 'Already Selected',
        message: 'You have already selected this elective for this semester.'
      });
      return;
    }

    // Check if selection is open (default to true if function not available)
    const selectionOpen = isElectiveSelectionOpen ? isElectiveSelectionOpen(electiveId) : true;
    if (!selectionOpen) {
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
      selectElective(user.id, electiveId, electiveSelectionSemester);
      addNotification({
        type: 'success',
        title: 'Elective Selected',
        message: `You have successfully selected "${elective.name}" for Semester ${electiveSelectionSemester}!`
      });
      
      // Reset selections to go back to category view
      setSelectedCategory(null);
      setSelectedTrack('');
    } catch {
      addNotification({
        type: 'error',
        title: 'Selection Failed',
        message: 'Failed to select elective. Please try again.'
      });
    }
  };

  const handleShowInfo = (elective: Elective) => {
    setSelectedElectiveInfo(elective);
    setShowInfoModal(true);
  };

  const getTrackColor = (track: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-gray-500'
    ];
    return colors[track.length % colors.length];
  };

  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Select Your Elective Category for Semester {electiveSelectionSemester}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Choose from available elective categories to enhance your learning experience
            </p>
            <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200">
                You can select one elective from each category (up to 3 total). Currently selected: {selectedCategories.size}/3
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {categoryData.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategories.has(category.id);
              const canSelect = canSelectFromCategory(category.id);
              
              return (
                <div
                  key={category.id}
                  onClick={() => canSelect && handleCategorySelect(category.id)}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center transform transition-all duration-200 ${
                    canSelect ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : 'opacity-50'
                  } ${isSelected ? 'ring-2 ring-green-500' : ''}`}
                >
                  <div className={`${category.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {category.description}
                  </p>
                  {isSelected ? (
                    <div className="flex items-center justify-center text-green-600 dark:text-green-400 font-medium">
                      <Check className="w-4 h-4 mr-2" />
                      Selected
                    </div>
                  ) : canSelect ? (
                    <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                      Select Category
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
                      Already Selected
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show selected electives for this semester */}
          {selectedElectivesThisSemester.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Selected Electives for Semester {electiveSelectionSemester}
              </h3>
              <div className="grid gap-4">
                {selectedElectivesThisSemester.map((se) => {
                  const elective = electives.find(e => e.id === se.electiveId);
                  if (!elective) return null;
                  
                  return (
                    <div key={se.electiveId} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{elective.name}</h4>
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {elective.code} • {elective.credits} Credits • {elective.track}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                          elective.category === 'Departmental' ? 'bg-blue-500' :
                          elective.category === 'Humanities' ? 'bg-purple-500' : 'bg-green-500'
                        }`}>
                          {elective.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Get tracks and available electives for the selected category
  const tracks = getAvailableTracks();
  const availableElectives = getFilteredElectives();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mr-4"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Categories
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {categoryData.find(c => c.id === selectedCategory)?.title} Electives
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {categoryData.find(c => c.id === selectedCategory)?.description}
            </p>
          </div>
        </div>

        {/* Track Selection */}
        {tracks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Select a Track
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setSelectedTrack('')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedTrack === '' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <span className="font-medium text-gray-900 dark:text-white">All Tracks</span>
              </button>
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(track.name)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedTrack === track.name 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <span className="font-medium text-gray-900 dark:text-white">{track.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Electives Grid */}
        <div className="grid gap-6">
          {availableElectives.map((elective) => {
            const alreadySelected = selectedElectivesThisSemester.some(se => se.electiveId === elective.id);
            const categorySelected = !canSelectFromCategory(elective.category);
            const availability = isElectiveAvailable(elective.id);
            const selectionOpen = isElectiveSelectionOpen ? isElectiveSelectionOpen(elective.id) : true;
            
            return (
              <div key={elective.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {/* Elective Image */}
                {elective.image && (
                  <div className="h-48 w-full">
                    <img 
                      src={elective.image} 
                      alt={elective.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to a placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/400x300/6366f1/ffffff?text=' + encodeURIComponent(elective.name.substring(0, 2));
                      }}
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{elective.name}</h3>
                        <button
                          onClick={() => handleShowInfo(elective)}
                          className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          title="View elective details"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{elective.code} • {elective.credits} Credits</p>
                        <div className="flex gap-1">
                          {elective.subjectType && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium text-white bg-purple-500">
                              {elective.subjectType}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                            elective.electiveCategory === 'Lab' ? 'bg-orange-500' : 'bg-blue-500'
                          }`}>
                            {elective.electiveCategory}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getTrackColor(elective.track)}`}>
                      {elective.track}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{elective.description}</p>
                  
                  {elective.prerequisites && elective.prerequisites.length > 0 && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prerequisites: </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {elective.prerequisites.join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Multi-department info for Open electives */}
                  {elective.category === 'Open' && (elective.offeredBy || (elective.eligibleDepartments && elective.eligibleDepartments.length > 0)) && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      {elective.offeredBy && (
                        <div className="mb-1">
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">Offered by: </span>
                          <span className="text-sm text-green-600 dark:text-green-400">{elective.offeredBy}</span>
                        </div>
                      )}
                      {elective.eligibleDepartments && elective.eligibleDepartments.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">Available to: </span>
                          <span className="text-sm text-green-600 dark:text-green-400">
                            {elective.eligibleDepartments.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Deadline Display */}
                  {elective.selectionDeadline && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Selection Deadline: </span>
                        <span className={`text-sm font-medium ${
                          selectionOpen 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {new Date(elective.selectionDeadline).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Semester {elective.semester}
                    </div>
                    {!selectionOpen && (
                      <div className="flex items-center text-red-600 dark:text-red-400">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-xs font-medium">Deadline Passed</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleElectiveSelect(elective.id)}
                      disabled={alreadySelected || categorySelected || !availability.available || !selectionOpen}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        alreadySelected || categorySelected || !availability.available || !selectionOpen
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {alreadySelected ? 'Already Selected' : 
                       categorySelected ? 'Category Selected' :
                       !availability.available ? 'Not Available' :
                       !selectionOpen ? 'Registration Closed' :
                       'Select Elective'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {availableElectives.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No electives available in this category {selectedTrack && `for ${selectedTrack} track`}.
            </p>
          </div>
        )}
      </div>

      {/* Info Modal */}
      {showInfoModal && selectedElectiveInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedElectiveInfo.name} - Details
                </h3>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>
              
              <div className="space-y-2 text-gray-600 dark:text-gray-300">
                <p><strong>Code:</strong> {selectedElectiveInfo.code}</p>
                <p><strong>Credits:</strong> {selectedElectiveInfo.credits}</p>
                <p><strong>Track:</strong> {selectedElectiveInfo.track}</p>
                <p><strong>Category:</strong> {selectedElectiveInfo.category}</p>
                <p><strong>Type:</strong> {selectedElectiveInfo.electiveCategory}</p>
                <p><strong>Description:</strong> {selectedElectiveInfo.description}</p>
                {selectedElectiveInfo.prerequisites && selectedElectiveInfo.prerequisites.length > 0 && (
                  <p><strong>Prerequisites:</strong> {selectedElectiveInfo.prerequisites.join(', ')}</p>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentElectiveSelection;
