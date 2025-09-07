import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Map, Star, CheckCircle, Clock, Book, Users, Globe, Target, TrendingUp, Award, Lightbulb, ArrowRight, FileText, Download, Eye } from 'lucide-react';

const StudentRoadmap: React.FC = () => {
  const { user } = useAuth();
  const { 
    getElectivesByCategoryAndDepartment, 
    getStudentElectives, 
    getTracksByDepartment, 
    getFutureElectives, 
    getAvailableSemesters,
    getAvailableCategories,
    getSyllabus
  } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [selectedElectiveForSyllabus, setSelectedElectiveForSyllabus] = useState<any>(null);

  if (!user || user.role !== 'student') return null;

  const studentElectives = getStudentElectives(user.id);
  const currentSemester = user.semester || 1;
  const availableCategories = getAvailableCategories();

  // Set default category if none selected
  if (!selectedCategory && availableCategories.length > 0) {
    setSelectedCategory(availableCategories[0]);
  }

  // Handle syllabus viewing
  const handleViewSyllabus = (elective: any) => {
    setSelectedElectiveForSyllabus(elective);
    setShowSyllabusModal(true);
  };

  const categoryConfig = {
    'Departmental': {
      title: 'Departmental (Core)',
      icon: Book,
      color: 'bg-blue-500',
      description: 'Core technical courses in your specialization'
    },
    'Humanities': {
      title: 'Humanities',
      icon: Users,
      color: 'bg-purple-500',
      description: 'Soft skills and liberal arts courses'
    },
    'Open': {
      title: 'Open Elective',
      icon: Globe,
      color: 'bg-green-500',
      description: 'Interdisciplinary courses from any department'
    }
  };

  // Create dynamic categories based on admin configuration
  const categories = availableCategories.map(cat => ({
    id: cat,
    ...categoryConfig[cat as keyof typeof categoryConfig]
  }));

  const getElectivesForCategory = (category: string) => {
    if (!user.department) return [];
    let electives = getElectivesByCategoryAndDepartment(category as 'Departmental' | 'Humanities' | 'Open', user.department);
    
    // Filter by selected track if one is selected
    if (selectedTrack) {
      electives = electives.filter(e => e.track === selectedTrack);
    }
    
    return electives;
  };

  const getCategoryProgress = (category: 'Departmental' | 'Humanities' | 'Open') => {
    const categoryElectives = getElectivesForCategory(category);
    const completedCount = studentElectives.filter(se => {
      const elective = categoryElectives.find(e => e.id === se.electiveId);
      return elective?.category === category;
    }).length;

    const requiredCount = category === 'Departmental' ? 4 : 2; // Example requirements
    
    return {
      completed: completedCount,
      required: requiredCount,
      remaining: Math.max(0, requiredCount - completedCount)
    };
  };

  const getFutureRoadmap = () => {
    const completedElectiveIds = studentElectives.map(se => se.electiveId);
    
    if (completedElectiveIds.length === 0) return [];

    // Get future electives based on the most recent completed elective
    const mostRecentElective = completedElectiveIds[completedElectiveIds.length - 1];
    const futureOptions = getFutureElectives(mostRecentElective);
    return futureOptions.map(elective => ({
      ...elective,
      semesterAvailable: elective.semester,
      benefits: [
        `Builds on your current track knowledge`,
        `Opens pathway to advanced ${elective.track} courses`,
        `Enhances career prospects in ${elective.track}`,
      ]
    }));
  };  const getRecommendations = () => {
    if (!user.department) return { suggestions: [], nextSemesterRecommendations: [] };
    
    // Get tracks filtered by selected category
    const categoryElectives = getElectivesForCategory(selectedCategory);
    const allTracks = getTracksByDepartment(user.department);
    
    // Filter tracks to only show those available in the selected category
    const categoryTracks = allTracks.filter(track => 
      track.category === selectedCategory
    );
    
    // Analyze student's current selections to recommend paths within this category
    const completedCategoryTracks = studentElectives.map(se => {
      const elective = categoryElectives.find(e => e.id === se.electiveId);
      return elective?.track;
    }).filter(Boolean);
    
    const trackCounts = completedCategoryTracks.reduce((acc: Record<string, number>, track) => {
      if (track) {
        acc[track] = (acc[track] || 0) + 1;
      }
      return acc;
    }, {});
    
    const recommendedTracks = Object.entries(trackCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([track]) => track);
    
    return {
      primaryTrack: recommendedTracks[0] || categoryTracks[0]?.name,
      secondaryTrack: recommendedTracks[1] || categoryTracks[1]?.name,
      suggestions: categoryTracks.slice(0, 3).map(d => d.name),
      availableTracks: categoryTracks
    };
  };

  const getSemesterPlan = () => {
    const availableSemesters = getAvailableSemesters();
    const semesters = availableSemesters.length > 0 ? availableSemesters : [5, 6, 7, 8];
    
    return semesters.map(semester => {
      const semesterElectives = studentElectives.filter(se => se.semester === semester);
      const plannedElectives = getElectivesForCategory(selectedCategory)
        .filter(e => e.semester === semester);
      
      return {
        semester,
        completed: semesterElectives,
        available: plannedElectives.filter(e => 
          !semesterElectives.some(se => se.electiveId === e.id)
        ),
        isCurrentOrFuture: semester >= currentSemester
      };
    });
  };

  const recommendations = getRecommendations();
  const semesterPlan = getSemesterPlan();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Map className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Your Academic Roadmap
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Plan your elective journey with personalized recommendations and track your progress
          </p>
        </div>

        {/* Track Selection and Category Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Track Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Select Your Track
              </h3>
              <select 
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tracks</option>
                {user.department && getTracksByDepartment(user.department).map(track => (
                  <option key={track.id} value={track.name}>{track.name}</option>
                ))}
              </select>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Filter recommendations by specialization track
              </p>
            </div>

            {/* Category Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Book className="w-5 h-5 mr-2" />
                Focus Area
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedCategory === category.id
                          ? `${category.color} text-white`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {category.title}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                View roadmap for specific elective categories
              </p>
            </div>

            {/* Track Selection for Selected Category */}
            {selectedCategory && (() => {
              const allTracks = getTracksByDepartment(user.department || '');
              const categoryTracks = allTracks.filter(track => track.category === selectedCategory);
              
              return categoryTracks.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    {categoryConfig[selectedCategory as keyof typeof categoryConfig]?.title} Tracks
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTrack('')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedTrack === ''
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      All Tracks
                    </button>
                    {categoryTracks.map(track => (
                      <button
                        key={track.id}
                        onClick={() => setSelectedTrack(track.name)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          selectedTrack === track.name
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {track.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Filter by specific tracks within {categoryConfig[selectedCategory as keyof typeof categoryConfig]?.title}
                  </p>
                </div>
              ) : null;
            })()}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Progress Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Category Progress Cards */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Progress Overview
              </h2>
              
              {categories.map(category => {
                const progress = getCategoryProgress(category.id);
                const progressPercentage = (progress.completed / progress.required) * 100;
                const Icon = category.icon;
                
                return (
                  <div key={category.id} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`${category.color} w-8 h-8 rounded-full flex items-center justify-center mr-3`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{category.title}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {progress.completed}/{progress.required}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`${category.color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {progress.remaining} remaining
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Recommendations Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                Smart Recommendations
              </h2>
              
              {/* Track Information */}
              {selectedTrack && user.department && (
                <>
                  {(() => {
                    const track = getTracksByDepartment(user.department).find(t => t.name === selectedTrack);
                    if (!track) return null;
                    
                    return (
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center mb-3">
                          <Award className="w-5 h-5 text-blue-600 mr-2" />
                          <h3 className="font-semibold text-blue-900 dark:text-blue-100">{track.name}</h3>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            track.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                            track.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {track.difficulty}
                          </span>
                        </div>
                        <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">{track.description}</p>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Career Outcomes:</h4>
                            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                              {track.careerOutcomes.map((outcome, index) => (
                                <li key={index} className="flex items-center">
                                  <div className="w-1 h-1 bg-blue-500 rounded-full mr-2"></div>
                                  {outcome}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Prerequisites:</h4>
                            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                              {track.prerequisites.map((prereq, index) => (
                                <li key={index} className="flex items-center">
                                  <div className="w-1 h-1 bg-blue-500 rounded-full mr-2"></div>
                                  {prereq}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center text-sm text-blue-600 dark:text-blue-300">
                          <Clock className="w-4 h-4 mr-1" />
                          Estimated: {track.estimatedHours} hours
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
              
              {/* General Recommendations */}
              {recommendations.primaryTrack && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center mb-2">
                    <Star className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">Primary Track</span>
                  </div>
                  <p className="text-blue-800 dark:text-blue-200">{recommendations.primaryTrack}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">Based on your current selections</p>
                </div>
              )}
              
              {recommendations.secondaryTrack && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                    <span className="font-medium text-green-900 dark:text-green-100">Secondary Track</span>
                  </div>
                  <p className="text-green-800 dark:text-green-200">{recommendations.secondaryTrack}</p>
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">Complement your specialization</p>
                </div>
              )}

              {!selectedTrack && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Suggested Tracks:</h3>
                  <div className="space-y-2">
                    {recommendations.suggestions.map((suggestion) => (
                      <div key={suggestion} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Roadmap Timeline */}
          <div className="lg:col-span-2">
            {/* Category Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Plan Your Electives
              </h2>
              
              <div className="grid grid-cols-3 gap-3">
                {categories.map(category => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        selectedCategory === category.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className={`${category.color} w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Semester Timeline */}
            <div className="space-y-6">
              {semesterPlan.map((semesterData, index) => {
                const { semester, completed, available } = semesterData;
                const isCurrentSemester = semester === currentSemester;
                
                return (
                  <div key={semester} className="relative">
                    {/* Timeline connector */}
                    {index < semesterPlan.length - 1 && (
                      <div className="absolute left-8 top-16 w-0.5 h-20 bg-gray-300 dark:bg-gray-600"></div>
                    )}
                    
                    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${
                      isCurrentSemester ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                    }`}>
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                          semester < currentSemester 
                            ? 'bg-green-500' 
                            : semester === currentSemester 
                              ? 'bg-blue-500' 
                              : 'bg-gray-400'
                        }`}>
                          {semester < currentSemester ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : semester === currentSemester ? (
                            <Clock className="w-6 h-6 text-white" />
                          ) : (
                            <span className="text-white font-bold">{semester}</span>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Semester {semester}
                            {isCurrentSemester && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                Current
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {semester < currentSemester 
                              ? 'Completed' 
                              : semester === currentSemester 
                                ? 'In Progress' 
                                : 'Upcoming'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Completed Electives */}
                      {completed.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Completed ({completed.length})
                          </h4>
                          <div className="space-y-2">
                            {completed.map(se => {
                              const elective = getElectivesForCategory(selectedCategory).find(e => e.id === se.electiveId);
                              if (!elective) return null;
                              const syllabus = getSyllabus(elective.id);
                              
                              return (
                                <div key={se.electiveId} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                  <div className="flex items-center">
                                    <CheckCircle className="w-4 h-4 text-green-600 mr-3" />
                                    <div>
                                      <span className="font-medium text-green-800 dark:text-green-200">{elective.name}</span>
                                      <span className="text-sm text-green-600 dark:text-green-300 ml-2">({elective.code})</span>
                                    </div>
                                  </div>
                                  {syllabus && (
                                    <button
                                      onClick={() => handleViewSyllabus(elective)}
                                      className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors ml-2"
                                      title="View Syllabus"
                                    >
                                      <FileText className="w-3 h-3" />
                                      Syllabus
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Available Electives */}
                      {available.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <Book className="w-4 h-4 mr-1" />
                            Available Options ({available.length})
                          </h4>
                          <div className="grid gap-3">
                            {available.slice(0, 3).map(elective => {
                              const syllabus = getSyllabus(elective.id);
                              return (
                                <div key={elective.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900 dark:text-white">{elective.name}</h5>
                                      <p className="text-sm text-gray-600 dark:text-gray-300">{elective.code} • {elective.credits} Credits</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{elective.description}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className={`px-2 py-1 rounded text-xs text-white ${
                                        elective.category === 'Humanities' ? 'bg-purple-500' : 
                                        elective.category === 'Open' ? 'bg-green-500' : 'bg-blue-500'
                                      }`}>
                                        {elective.category}
                                      </span>
                                      {syllabus && (
                                        <button
                                          onClick={() => handleViewSyllabus(elective)}
                                          className="flex items-center justify-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                          title="View Syllabus"
                                        >
                                          <FileText className="w-3 h-3" />
                                          Syllabus
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {elective.prerequisites && elective.prerequisites.length > 0 && (
                                    <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                      Prerequisites: {elective.prerequisites.join(', ')}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {available.length > 3 && (
                              <div className="text-center py-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  +{available.length - 3} more options available
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {available.length === 0 && completed.length === 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          No {selectedCategory.toLowerCase()} electives available for this semester
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Future Roadmap Section */}
            {(() => {
              const futureOptions = getFutureRoadmap();
              return futureOptions.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 mt-8">
                  <div className="flex items-center mb-6">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Your Future Pathway
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Based on your previous elective, here's what becomes available next
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {futureOptions.map((elective) => (
                      <div
                        key={elective.id}
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {elective.name}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {elective.code} • Semester {elective.semesterAvailable}
                            </p>
                          </div>
                          <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                            Next
                          </span>
                        </div>

                        <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                          {elective.description.substring(0, 80)}...
                        </p>

                        <div className="space-y-1">
                          <h5 className="text-xs font-medium text-gray-900 dark:text-white">
                            Benefits:
                          </h5>
                          <ul className="space-y-1">
                            {elective.benefits.slice(0, 2).map((benefit, idx) => (
                              <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                                <ArrowRight className="w-3 h-3 mr-1 mt-0.5 text-green-500 flex-shrink-0" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <div className="flex items-start">
                      <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Planning Tip
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Consider your career goals when choosing from these options. Each choice opens different pathways.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Tips and Guidelines */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-blue-600" />
                Academic Guidelines
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Departmental Electives:</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                    <li>• Complete 4 courses minimum</li>
                    <li>• Focus on 1-2 specialization tracks</li>
                    <li>• Consider prerequisites carefully</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Humanities & Open:</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                    <li>• 2 Humanities courses required</li>
                    <li>• 2 Open electives recommended</li>
                    <li>• Develop well-rounded skills</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Syllabus Modal */}
      {showSyllabusModal && selectedElectiveForSyllabus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Syllabus: {selectedElectiveForSyllabus.name}
                </h3>
                <button
                  onClick={() => setShowSyllabusModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {selectedElectiveForSyllabus.code} • {selectedElectiveForSyllabus.credits} Credits
              </p>
            </div>
            
            <div className="p-6">
              {(() => {
                const syllabus = getSyllabus(selectedElectiveForSyllabus.id);
                if (!syllabus) {
                  return (
                    <div className="text-center py-8">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Syllabus Available
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        The syllabus for this elective has not been uploaded yet.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                        Syllabus Information
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Title:</strong> {syllabus.title}</p>
                          <p><strong>Academic Year:</strong> {syllabus.academicYear}</p>
                        </div>
                        <div>
                          <p><strong>Semester:</strong> {syllabus.semester}</p>
                          <p><strong>Uploaded:</strong> {syllabus.uploadedAt.toLocaleDateString()}</p>
                        </div>
                      </div>
                      {syllabus.description && (
                        <p className="mt-2 text-blue-800 dark:text-blue-300">{syllabus.description}</p>
                      )}
                    </div>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300 mr-2" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {syllabus.pdfFileName}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(syllabus.pdfUrl, '_blank')}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = syllabus.pdfUrl;
                              link.download = syllabus.pdfFileName;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      </div>
                      
                      {/* PDF Preview */}
                      <div className="h-96 bg-gray-100 dark:bg-gray-600">
                        <iframe
                          src={syllabus.pdfUrl}
                          className="w-full h-full"
                          title="Syllabus PDF"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRoadmap;
