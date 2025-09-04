import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Users, BookOpen, BarChart3, Star } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { electives, domains, studentElectives } = useData();

  if (!user || user.role !== 'admin') return null;

  // Calculate analytics
  const totalStudents = JSON.parse(localStorage.getItem('users') || '[]')
    .filter((u: any) => u.role === 'student').length;
  
  const totalElectives = electives.length;
  const totalSelections = studentElectives.length;
  
  // Categorize electives by electiveCategory
  const electiveCategories = ['Humanities', 'Departmental', 'Open Elective'] as const;
  
  // Domain popularity by category
  const categoryDomainStats = electiveCategories.map(category => {
    const categoryElectives = electives.filter(e => e.electiveCategory === category);
    const categorySelections = studentElectives.filter(se => {
      const elective = electives.find(e => e.id === se.electiveId);
      return elective?.electiveCategory === category;
    });
    
    const domainStats = domains.map(domain => {
      const domainCategoryElectives = categoryElectives.filter(e => e.domain === domain.name);
      const domainCategorySelections = categorySelections.filter(se => se.domain === domain.name);
      return {
        ...domain,
        selections: domainCategorySelections.length,
        electives: domainCategoryElectives.length
      };
    }).filter(d => d.electives > 0).sort((a, b) => b.selections - a.selections);

    return {
      category,
      domainStats,
      totalElectives: categoryElectives.length,
      totalSelections: categorySelections.length
    };
  });

  // Most popular elective from each category
  const popularElectivesByCategory = electiveCategories.map(category => {
    const categoryElectives = electives.filter(e => e.electiveCategory === category);
    const electivesWithSelections = categoryElectives.map(elective => {
      const selections = studentElectives.filter(se => se.electiveId === elective.id).length;
      return { ...elective, selections };
    }).sort((a, b) => b.selections - a.selections);
    
    return {
      category,
      mostPopular: electivesWithSelections[0] || null,
      totalElectives: categoryElectives.length
    };
  });

  const semesterStats = [5, 6, 7, 8].map(semester => {
    const semesterSelections = studentElectives.filter(se => se.semester === semester);
    return {
      semester,
      selections: semesterSelections.length,
      electives: electives.filter(e => e.semester === semester).length
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of electives, students, and system analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-gray-600">Total Students</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{totalElectives}</p>
              <p className="text-gray-600">Total Electives</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{totalSelections}</p>
              <p className="text-gray-600">Total Selections</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Domain Popularity by Category */}
        {categoryDomainStats.map((categoryData) => (
          <div key={categoryData.category} className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {categoryData.category} Domain Popularity
            </h2>
            <div className="space-y-4">
              {categoryData.domainStats.slice(0, 4).map(domain => (
                <div key={domain.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${domain.color}`}></div>
                    <span className="font-medium text-gray-900">{domain.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">{domain.selections} selections</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${domain.color}`}
                        style={{
                          width: `${Math.max(10, (domain.selections / Math.max(...categoryData.domainStats.map(d => d.selections), 1) * 100))}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              {categoryData.domainStats.length === 0 && (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Popular Electives by Category */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Most Popular by Category</h2>
          <div className="space-y-6">
            {popularElectivesByCategory.map((categoryData) => (
              <div key={categoryData.category} className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">{categoryData.category}</h3>
                {categoryData.mostPopular ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{categoryData.mostPopular.name}</p>
                      <p className="text-sm text-gray-600">{categoryData.mostPopular.code} • {categoryData.mostPopular.domain}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-bold text-gray-900">{categoryData.mostPopular.selections}</span>
                      </div>
                      <p className="text-xs text-gray-600">selections</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No electives in this category</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Semester Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Semester-wise Statistics</h2>
          <div className="space-y-3">
            {semesterStats.map(stat => (
              <div key={stat.semester} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <h3 className="font-medium text-gray-900">Semester {stat.semester}</h3>
                  <p className="text-sm text-gray-600">{stat.electives} electives offered</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{stat.selections}</p>
                  <p className="text-sm text-gray-600">selections</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;