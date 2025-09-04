import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, Download, Users, FileText, CheckCircle } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  department: string;
  semester: number;
  section: string;
  role: string;
}

const AdminStudents: React.FC = () => {
  const { electives, domains, studentElectives } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Get students from localStorage (in real app this would come from API)
  const allStudents: Student[] = JSON.parse(localStorage.getItem('users') || '[]')
    .filter((u: any) => u.role === 'student');

  const departments = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering'
  ];

  const filteredStudents = useMemo(() => {
    return allStudents.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = !departmentFilter || student.department === departmentFilter;
      const matchesSemester = !semesterFilter || student.semester.toString() === semesterFilter;
      const matchesSection = !sectionFilter || student.section === sectionFilter;
      
      let matchesDomain = true;
      if (domainFilter) {
        const studentDomains = studentElectives
          .filter(se => se.studentId === student.id)
          .map(se => se.domain);
        matchesDomain = studentDomains.includes(domainFilter);
      }

      return matchesSearch && matchesDepartment && matchesSemester && matchesSection && matchesDomain;
    });
  }, [allStudents, searchTerm, departmentFilter, semesterFilter, sectionFilter, domainFilter, studentElectives]);

  const getStudentElectives = (studentId: string) => {
    return studentElectives
      .filter(se => se.studentId === studentId)
      .map(se => {
        const elective = electives.find(e => e.id === se.electiveId);
        return { ...se, elective };
      })
      .sort((a, b) => a.semester - b.semester);
  };

  const getStudentDomains = (studentId: string) => {
    const studentElectivesData = getStudentElectives(studentId);
    const domainCounts = studentElectivesData.reduce((acc: any, se) => {
      acc[se.domain] = (acc[se.domain] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(domainCounts).map(([domain, count]) => ({
      domain,
      count: count as number
    }));
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    const data = filteredStudents.map(student => ({
      'Roll No': student.rollNo,
      'Name': student.name,
      'Email': student.email,
      'Department': student.department,
      'Semester': student.semester,
      'Section': student.section,
      'Electives Completed': getStudentElectives(student.id).length,
      'Primary Domain': getStudentDomains(student.id).sort((a, b) => b.count - a.count)[0]?.domain || 'None'
    }));
    
    if (format === 'excel') {
      // Create CSV content for Excel
      const csvHeaders = Object.keys(data[0] || {}).join(',');
      const csvRows = data.map(row => Object.values(row).join(','));
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Create simple PDF-like content
      const pdfContent = [
        'STUDENT REPORT',
        `Generated on: ${new Date().toLocaleDateString()}`,
        `Total Students: ${data.length}`,
        '',
        'STUDENT DETAILS:',
        ...data.map((student, index) => 
          `${index + 1}. ${student.Name} (${student['Roll No']}) - ${student.Department} - Semester ${student.Semester}`
        )
      ].join('\n');
      
      const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_report_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    setShowExportDialog(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDepartmentFilter('');
    setSemesterFilter('');
    setSectionFilter('');
    setDomainFilter('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-2">
            View and manage student profiles and elective selections
          </p>
        </div>
        <button
          onClick={() => setShowExportDialog(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Reports
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Students
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                id="search"
                type="text"
                placeholder="Name, Roll No, or Email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              id="department"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label>
            <select
              id="semester"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Semesters</option>
              {[5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <select
              id="section"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Sections</option>
              {['A', 'B', 'C', 'D'].map(section => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
              Domain Focus
            </label>
            <select
              id="domain"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Domains</option>
              {domains.map(domain => (
                <option key={domain.id} value={domain.name}>{domain.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filteredStudents.length} of {allStudents.length} students
          </div>
          <button
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map(student => {
          const studentElectivesData = getStudentElectives(student.id);
          const studentDomains = getStudentDomains(student.id);
          
          return (
            <div key={student.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.rollNo}</p>
                  </div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Sem {student.semester}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {student.email}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Department:</span> {student.department}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Electives Completed:</span> {studentElectivesData.length}
                </p>
              </div>

              {/* Domain Progress */}
              {studentDomains.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Domain Focus:</p>
                  <div className="flex flex-wrap gap-1">
                    {studentDomains.slice(0, 2).map(({ domain, count }) => {
                      const domainData = domains.find(d => d.name === domain);
                      return (
                        <span
                          key={domain}
                          className={`px-2 py-1 rounded-full text-xs font-medium text-white ${domainData?.color || 'bg-gray-500'}`}
                        >
                          {domain} ({count})
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Electives */}
              {studentElectivesData.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Recent Electives:</p>
                  <div className="space-y-1">
                    {studentElectivesData.slice(-2).map(se => (
                      <div key={se.electiveId} className="flex items-center text-sm">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                        <span className="text-gray-700">{se.elective?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-600">
            {searchTerm || departmentFilter || semesterFilter || domainFilter
              ? 'Try adjusting your filters to see more results.'
              : 'No students are registered in the system yet.'
            }
          </p>
        </div>
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Student Report</h3>
              <p className="text-gray-600 mb-4">
                Choose the format for exporting student data. This will include all filtered results.
              </p>
              
              {/* Export Criteria */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Export Criteria:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Students:</span>
                    <span className="font-medium text-gray-900">{filteredStudents.length}</span>
                  </div>
                  {departmentFilter && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium text-gray-900">{departmentFilter}</span>
                    </div>
                  )}
                  {semesterFilter && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Semester:</span>
                      <span className="font-medium text-gray-900">{semesterFilter}</span>
                    </div>
                  )}
                  {sectionFilter && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Section:</span>
                      <span className="font-medium text-gray-900">{sectionFilter}</span>
                    </div>
                  )}
                  {domainFilter && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Primary Domain:</span>
                      <span className="font-medium text-gray-900">{domainFilter}</span>
                    </div>
                  )}
                  {searchTerm && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Search Term:</span>
                      <span className="font-medium text-gray-900">"{searchTerm}"</span>
                    </div>
                  )}
                  {!departmentFilter && !semesterFilter && !sectionFilter && !domainFilter && !searchTerm && (
                    <div className="text-gray-600 text-center">All students (no filters applied)</div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-gray-900">Export as CSV (.csv)</span>
                </button>
                
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-red-600 mr-3" />
                  <span className="text-gray-900">Export as Text Report (.txt)</span>
                </button>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowExportDialog(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;