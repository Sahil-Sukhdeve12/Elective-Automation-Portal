import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Map, Star, CheckCircle, Clock, Book, Users, Globe, Target, TrendingUp, Award, Lightbulb, ArrowRight, AlertTriangle } from 'lucide-react';

const StudentRoadmap: React.FC = () => {
  const { user } = useAuth();
  const { getElectivesByCategoryAndDepartment, getStudentElectives, getDomainsByDepartment, electives, getFutureElectives } = useData();
  const [selectedCategory, setSelectedCategory] = useState<'Departmental' | 'Humanities' | 'Open Elective'>('Departmental');

  if (!user || user.role !== 'student') return null;

  const studentElectives = getStudentElectives(user.id);
  const currentSemester = user.semester || 5;

  const categories = [
    {
      id: 'Departmental' as const,
      title: 'Departmental (Core)',
      icon: Book,
      color: 'bg-blue-500',
      description: 'Core technical courses in your specialization'
    },
    {
      id: 'Humanities' as const,
      title: 'Humanities',
      icon: Users,
      color: 'bg-purple-500',
      description: 'Soft skills and liberal arts courses'
    },
    {
      id: 'Open Elective' as const,
      title: 'Open Elective',
      icon: Globe,
      color: 'bg-green-500',
      description: 'Interdisciplinary courses from any department'
    }
  ];

  const getElectivesForCategory = (category: 'Departmental' | 'Humanities' | 'Open Elective') => {
    if (!user.department) return [];
    return getElectivesByCategoryAndDepartment(category, user.department);
  };

  const getCategoryProgress = (category: 'Departmental' | 'Humanities' | 'Open Elective') => {
    const categoryElectives = getElectivesForCategory(category);
    const completedCount = studentElectives.filter(se => {
      const elective = categoryElectives.find(e => e.id === se.electiveId);
      return elective?.electiveCategory === category;
    }).length;

    const requiredCount = category === 'Departmental' ? 4 : 2; // Example requirements
    
    return {
      completed: completedCount,
      required: requiredCount,
      remaining: Math.max(0, requiredCount - completedCount)
    };
  };

  const getFutureRoadmap = () => {
    const lastCompletedElective = studentElectives
      .filter(se => se.semester === currentSemester - 1)
      .pop();
    
    if (!lastCompletedElective) return [];

    const futureOptions = getFutureElectives(lastCompletedElective.electiveId);
    return futureOptions.map(elective => ({
      ...elective,
      semesterAvailable: elective.semester,
      benefits: [
        `Builds on ${lastCompletedElective.domain} knowledge`,
        `Opens pathway to advanced ${elective.domain} courses`,
        `Enhances career prospects in ${elective.domain}`,
      ]
    }));
  };  const getRecommendations = () => {
    if (!user.department) return { suggestions: [], nextSemesterRecommendations: [] };
    
    const departmentalElectives = getElectivesForCategory('Departmental');
    const domains = getDomainsByDepartment(user.department);
    
    // Analyze student's current selections to recommend paths
    const completedDomains = studentElectives.map(se => {
      const elective = departmentalElectives.find(e => e.id === se.electiveId);
      return elective?.domain;
    }).filter(Boolean);
    
    const domainCounts = completedDomains.reduce((acc: Record<string, number>, domain) => {
      if (domain) {
        acc[domain] = (acc[domain] || 0) + 1;
      }
      return acc;
    }, {});
    
    const recommendedDomains = Object.entries(domainCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([domain]) => domain);
    
    return {
      primaryTrack: recommendedDomains[0] || domains[0]?.name,
      secondaryTrack: recommendedDomains[1] || domains[1]?.name,
      suggestions: domains.slice(0, 3).map(d => d.name)
    };
  };

  const getSemesterPlan = () => {
    const semesters = [5, 6, 7, 8];
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
                              
                              return (
                                <div key={se.electiveId} className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                  <CheckCircle className="w-4 h-4 text-green-600 mr-3" />
                                  <div>
                                    <span className="font-medium text-green-800 dark:text-green-200">{elective.name}</span>
                                    <span className="text-sm text-green-600 dark:text-green-300 ml-2">({elective.code})</span>
                                  </div>
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
                            {available.slice(0, 3).map(elective => (
                              <div key={elective.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 dark:text-white">{elective.name}</h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{elective.code} • {elective.credits} Credits</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{elective.description}</p>
                                  </div>
                                  <span className={`px-2 py-1 rounded text-xs text-white ${
                                    elective.category === 'Practical' ? 'bg-orange-500' : 'bg-blue-500'
                                  }`}>
                                    {elective.category}
                                  </span>
                                </div>
                                {elective.prerequisites && elective.prerequisites.length > 0 && (
                                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                    Prerequisites: {elective.prerequisites.join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
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
    </div>
  );
};

export default StudentRoadmap;