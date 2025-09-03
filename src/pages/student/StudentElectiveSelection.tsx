import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Book, Users, Globe, ArrowRight, Info, Star, Check } from 'lucide-react';

const StudentElectiveSelection: React.FC = () => {
  const { user } = useAuth();
  const { getElectivesByCategoryAndDepartment, getDomainsByDepartment, selectElective, getStudentElectives } = useData();
  const { addNotification } = useNotifications();
  
  const [selectedCategory, setSelectedCategory] = useState<'Humanities' | 'Departmental' | 'Open Elective' | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedElectiveInfo, setSelectedElectiveInfo] = useState<any>(null);

  if (!user) return null;

  const currentSemester = 5; // This could be calculated based on user's current semester
  const studentElectives = getStudentElectives(user.id);
  const hasSelectedThisSemester = studentElectives.some(se => se.semester === currentSemester);

  const categories = [
    {
      id: 'Departmental' as const,
      title: 'Departmental (Core)',
      description: 'Advanced courses in your department specialization',
      icon: Book,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      id: 'Humanities' as const,
      title: 'Humanities',
      description: 'Philosophy, communication, economics, and management courses',
      icon: Users,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      id: 'Open Elective' as const,
      title: 'Open Elective',
      description: 'Courses from any department to broaden your knowledge',
      icon: Globe,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    }
  ];

  const handleCategorySelect = (category: 'Humanities' | 'Departmental' | 'Open Elective') => {
    setSelectedCategory(category);
    setSelectedDomain(''); // Reset domain selection
  };

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
    addNotification({
      type: 'success',
      title: 'Elective Selected',
      message: 'Your elective has been selected successfully!'
    });
    
    // Reset selections
    setSelectedCategory(null);
    setSelectedDomain('');
  };

  const handleShowInfo = (elective: any) => {
    setSelectedElectiveInfo(elective);
    setShowInfoModal(true);
  };

  const getElectives = () => {
    if (!selectedCategory) return [];
    return getElectivesByCategoryAndDepartment(selectedCategory, user.department);
  };

  const getDomains = () => {
    if (!selectedCategory) return [];
    if (selectedCategory === 'Departmental') {
      return getDomainsByDepartment(user.department);
    }
    // For Humanities and Open Electives, get unique domains from electives
    const electives = getElectivesByCategoryAndDepartment(selectedCategory, user.department);
    const uniqueDomains = [...new Set(electives.map(e => e.domain))];
    return uniqueDomains.map(domain => ({ id: domain, name: domain, description: '', color: 'bg-gray-500', suggestedElectives: [], department: '' }));
  };

  const getFilteredElectives = () => {
    const electives = getElectives();
    if (!selectedDomain) return electives;
    return electives.filter(e => e.domain === selectedDomain);
  };

  const getDomainColor = (domain: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-gray-500'
    ];
    return colors[domain.length % colors.length];
  };

  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Select Your Elective Category
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Choose from three types of electives to enhance your learning experience
            </p>
            {hasSelectedThisSemester && (
              <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200">
                  You have already selected an elective for this semester. You can view your selection below.
                </p>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  onClick={() => !hasSelectedThisSemester && handleCategorySelect(category.id)}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center transform transition-all duration-200 ${
                    !hasSelectedThisSemester ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : 'opacity-50'
                  }`}
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
                  {!hasSelectedThisSemester && (
                    <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                      Select Category
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show selected electives for this semester */}
          {hasSelectedThisSemester && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Selected Elective for Semester {currentSemester}
              </h3>
              {studentElectives
                .filter(se => se.semester === currentSemester)
                .map((se) => {
                  const electives = getElectivesByCategoryAndDepartment('Departmental', user.department)
                    .concat(getElectivesByCategoryAndDepartment('Humanities', user.department))
                    .concat(getElectivesByCategoryAndDepartment('Open Elective', user.department));
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
                          {elective.code} • {elective.credits} Credits • {elective.domain}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                          elective.electiveCategory === 'Departmental' ? 'bg-blue-500' :
                          elective.electiveCategory === 'Humanities' ? 'bg-purple-500' : 'bg-green-500'
                        }`}>
                          {elective.electiveCategory}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const domains = getDomains();
  const electives = getFilteredElectives();

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
              {categories.find(c => c.id === selectedCategory)?.title} Electives
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {categories.find(c => c.id === selectedCategory)?.description}
            </p>
          </div>
        </div>

        {/* Domain/Track Selection */}
        {domains.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Select a Track/Domain
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setSelectedDomain('')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedDomain === '' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <span className="font-medium text-gray-900 dark:text-white">All Tracks</span>
              </button>
              {domains.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.name)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedDomain === domain.name 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <span className="font-medium text-gray-900 dark:text-white">{domain.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Electives Grid */}
        <div className="grid gap-6">
          {electives.map((elective) => (
            <div key={elective.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{elective.name}</h3>
                    {elective.infoImage && (
                      <button
                        onClick={() => handleShowInfo(elective)}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        title="View elective details"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
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
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">{elective.description}</p>
              
              {elective.prerequisites && elective.prerequisites.length > 0 && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prerequisites: </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {elective.prerequisites.join(', ')}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Semester {elective.semester}
                </div>
                <button
                  onClick={() => handleElectiveSelect(elective.id)}
                  disabled={hasSelectedThisSemester}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    hasSelectedThisSemester
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {hasSelectedThisSemester ? 'Already Selected' : 'Select Elective'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {electives.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No electives available in this category {selectedDomain && `for ${selectedDomain} track`}.
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
              
              {selectedElectiveInfo.infoImage && (
                <div className="mb-4">
                  <img 
                    src={selectedElectiveInfo.infoImage} 
                    alt={`${selectedElectiveInfo.name} details`}
                    className="w-full h-auto rounded-lg shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="space-y-2 text-gray-600 dark:text-gray-300">
                <p><strong>Code:</strong> {selectedElectiveInfo.code}</p>
                <p><strong>Credits:</strong> {selectedElectiveInfo.credits}</p>
                <p><strong>Domain:</strong> {selectedElectiveInfo.domain}</p>
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
