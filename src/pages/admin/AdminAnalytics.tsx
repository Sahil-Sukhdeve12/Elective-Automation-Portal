import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { BarChart3, TrendingUp, Users, BookOpen, Award, Target, Download } from 'lucide-react';

const AdminAnalytics: React.FC = () => {
  const { electives, domains, studentElectives } = useData();

  const students = JSON.parse(localStorage.getItem('users') || '[]')
    .filter((u: any) => u.role === 'student');

  const analytics = useMemo(() => {
    // Domain analytics
    const domainStats = domains.map(domain => {
      const domainSelections = studentElectives.filter(se => se.domain === domain.name);
      const uniqueStudents = new Set(domainSelections.map(se => se.studentId)).size;
      return {
        ...domain,
        selections: domainSelections.length,
        students: uniqueStudents
      };
    });

    // Semester analytics
    const semesterStats = [5, 6, 7, 8].map(semester => {
      const semesterSelections = studentElectives.filter(se => se.semester === semester);
      const semesterElectives = electives.filter(e => e.semester === semester);
      const utilizationRate = semesterElectives.length > 0 
        ? (semesterSelections.length / semesterElectives.length) * 100 
        : 0;
      
      return {
        semester,
        selections: semesterSelections.length,
        available: semesterElectives.length,
        utilizationRate
      };
    });

    // Popular electives
    const electivePopularity = electives.map(elective => {
      const selections = studentElectives.filter(se => se.electiveId === elective.id).length;
      return { ...elective, selections };
    }).sort((a, b) => b.selections - a.selections);

    // Student engagement
    const studentEngagement = students.map((student: any) => {
      const studentElectivesData = studentElectives.filter(se => se.studentId === student.id);
      const domainSpread = new Set(studentElectivesData.map(se => se.domain)).size;
      return {
        ...student,
        totalElectives: studentElectivesData.length,
        domainSpread
      };
    });

    const avgElectivesPerStudent = studentEngagement.reduce((sum, s) => sum + s.totalElectives, 0) / students.length;
    const avgDomainSpread = studentEngagement.reduce((sum, s) => sum + s.domainSpread, 0) / students.length;

    return {
      domainStats,
      semesterStats,
      electivePopularity,
      studentEngagement,
      avgElectivesPerStudent: avgElectivesPerStudent || 0,
      avgDomainSpread: avgDomainSpread || 0,
      totalSelections: studentElectives.length,
      activeStudents: new Set(studentElectives.map(se => se.studentId)).size
    };
  }, [electives, domains, studentElectives, students]);

  const handleExportAnalytics = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      overview: {
        totalStudents: students.length,
        totalElectives: electives.length,
        totalSelections: analytics.totalSelections,
        activeStudents: analytics.activeStudents
      },
      domainStats: analytics.domainStats,
      semesterStats: analytics.semesterStats,
      popularElectives: analytics.electivePopularity.slice(0, 10)
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into elective selections and student trends
          </p>
        </div>
        <button
          onClick={handleExportAnalytics}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Analytics
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{analytics.activeStudents}</p>
              <p className="text-gray-600">Active Students</p>
              <p className="text-xs text-gray-500">of {students.length} total</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{analytics.totalSelections}</p>
              <p className="text-gray-600">Total Selections</p>
              <p className="text-xs text-gray-500">across all semesters</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{analytics.avgElectivesPerStudent.toFixed(1)}</p>
              <p className="text-gray-600">Avg Electives/Student</p>
              <p className="text-xs text-gray-500">completion rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Award className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{analytics.avgDomainSpread.toFixed(1)}</p>
              <p className="text-gray-600">Avg Domain Spread</p>
              <p className="text-xs text-gray-500">diversification</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Domain Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Domain Distribution</h2>
          <div className="space-y-4">
            {analytics.domainStats.map(domain => {
              const maxSelections = Math.max(...analytics.domainStats.map(d => d.selections));
              const percentage = maxSelections > 0 ? (domain.selections / maxSelections) * 100 : 0;
              
              return (
                <div key={domain.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{domain.name}</span>
                    <span className="text-sm text-gray-600">{domain.selections} selections</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${domain.color}`}
                      style={{ width: `${Math.max(5, percentage)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{domain.students} students</span>
                    <span>{((domain.selections / analytics.totalSelections) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Semester Utilization */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Semester Utilization</h2>
          <div className="space-y-4">
            {analytics.semesterStats.map(stat => (
              <div key={stat.semester} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-900">Semester {stat.semester}</h3>
                  <span className="text-sm font-medium text-blue-600">
                    {stat.utilizationRate.toFixed(1)}% utilized
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{stat.selections} selections</span>
                  <span>{stat.available} available</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${Math.max(5, stat.utilizationRate)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Electives */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Most Popular Electives</h2>
          <div className="space-y-3">
            {analytics.electivePopularity.slice(0, 8).map((elective, index) => (
              <div key={elective.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    index < 3 ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{elective.name}</h3>
                  <p className="text-sm text-gray-600">{elective.code} • {elective.domain}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{elective.selections}</p>
                  <p className="text-xs text-gray-600">selections</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Engagement */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Student Engagement</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900">Average Electives per Student</h3>
                  <p className="text-sm text-blue-700">Overall completion rate</p>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {analytics.avgElectivesPerStudent.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-green-900">Average Domain Spread</h3>
                  <p className="text-sm text-green-700">Cross-domain exploration</p>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {analytics.avgDomainSpread.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Engagement Distribution</h4>
              {[
                { label: 'High Engagement (3+ electives)', count: analytics.studentEngagement.filter(s => s.totalElectives >= 3).length },
                { label: 'Medium Engagement (1-2 electives)', count: analytics.studentEngagement.filter(s => s.totalElectives >= 1 && s.totalElectives < 3).length },
                { label: 'Low Engagement (0 electives)', count: analytics.studentEngagement.filter(s => s.totalElectives === 0).length }
              ].map((item, index) => {
                const colors = ['bg-green-500', 'bg-yellow-500', 'bg-red-500'];
                const percentage = students.length > 0 ? (item.count / students.length) * 100 : 0;
                
                return (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${colors[index]}`}></div>
                      <span className="text-gray-700">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 font-medium">{item.count}</span>
                      <span className="text-gray-500">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {analytics.domainStats.map(domain => (
          <div key={domain.id} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{domain.name}</h3>
              <div className={`w-4 h-4 rounded-full ${domain.color}`}></div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Selections:</span>
                <span className="font-medium text-gray-900">{domain.selections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unique Students:</span>
                <span className="font-medium text-gray-900">{domain.students}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Market Share:</span>
                <span className="font-medium text-gray-900">
                  {((domain.selections / analytics.totalSelections) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-4">{domain.description}</p>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <TrendingUp className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-medium text-blue-900 mb-2">Most Popular Domain</h3>
            <p className="text-sm text-blue-800">
              {analytics.domainStats[0]?.name} leads with {analytics.domainStats[0]?.selections} selections
              from {analytics.domainStats[0]?.students} students.
            </p>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <Award className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-medium text-green-900 mb-2">Best Performing Elective</h3>
            <p className="text-sm text-green-800">
              "{analytics.electivePopularity[0]?.name}" has {analytics.electivePopularity[0]?.selections} selections,
              making it the most chosen elective.
            </p>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <BookOpen className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-medium text-purple-900 mb-2">Semester Utilization</h3>
            <p className="text-sm text-purple-800">
              Semester {analytics.semesterStats.sort((a, b) => b.utilizationRate - a.utilizationRate)[0]?.semester} 
              has the highest utilization at {analytics.semesterStats.sort((a, b) => b.utilizationRate - a.utilizationRate)[0]?.utilizationRate.toFixed(1)}%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;