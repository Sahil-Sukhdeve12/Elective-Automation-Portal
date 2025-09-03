import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Users, BookOpen, BarChart3, TrendingUp, Award, Clock } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { electives, domains, studentElectives } = useData();

  if (!user || user.role !== 'admin') return null;

  // Calculate analytics
  const totalStudents = JSON.parse(localStorage.getItem('users') || '[]')
    .filter((u: any) => u.role === 'student').length;
  
  const totalElectives = electives.length;
  const totalSelections = studentElectives.length;
  
  const domainStats = domains.map(domain => {
    const domainSelections = studentElectives.filter(se => se.domain === domain.name);
    return {
      ...domain,
      selections: domainSelections.length
    };
  }).sort((a, b) => b.selections - a.selections);

  const semesterStats = [5, 6, 7, 8].map(semester => {
    const semesterSelections = studentElectives.filter(se => se.semester === semester);
    return {
      semester,
      selections: semesterSelections.length,
      electives: electives.filter(e => e.semester === semester).length
    };
  });

  const popularElectives = electives.map(elective => {
    const selections = studentElectives.filter(se => se.electiveId === elective.id).length;
    return { ...elective, selections };
  }).sort((a, b) => b.selections - a.selections).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of electives, students, and system analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{domains.length}</p>
              <p className="text-gray-600">Active Domains</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Domain Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Domain Popularity</h2>
          <div className="space-y-4">
            {domainStats.map(domain => (
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
                        width: `${Math.max(10, (domain.selections / Math.max(...domainStats.map(d => d.selections)) * 100))}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Electives */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Most Popular Electives</h2>
          <div className="space-y-4">
            {popularElectives.map((elective, index) => (
              <div key={elective.id} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{elective.name}</h3>
                  <p className="text-sm text-gray-600">{elective.code} • {elective.domain}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{elective.selections}</p>
                  <p className="text-sm text-gray-600">selections</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Semester Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Semester-wise Statistics</h2>
          <div className="space-y-4">
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

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {studentElectives
              .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
              .slice(0, 5)
              .map((se, index) => {
                const elective = electives.find(e => e.id === se.electiveId);
                return (
                  <div key={`${se.studentId}-${se.electiveId}`} className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        Student selected <span className="font-medium">{elective?.name}</span>
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(se.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;