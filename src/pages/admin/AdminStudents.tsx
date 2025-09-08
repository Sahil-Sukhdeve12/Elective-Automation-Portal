import React, { useState, useMemo } from 'react';
import { useData, Student } from '../../contexts/DataContext';
import { Search, Download, Users, FileText, CheckCircle, Filter, X } from 'lucide-react';

interface ReportFilters {
  department: string;
  semester: string;
  section: string;
  category: 'Departmental' | 'Open' | 'Humanities' | '';
  track: string;
  elective: string;
}

const AdminStudents: React.FC = () => {
  const { 
    electives, 
    tracks, 
    students,
    studentElectives, 
    getAvailableDepartments,
    getAvailableSections,
    getAvailableSemesters,
    getTracksByCategory,
    getAvailableCategories
  } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [trackFilter, settrackFilter] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAdvancedReport, setShowAdvancedReport] = useState(false);
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    department: '',
    semester: '',
    section: '',
    category: '',
    track: '',
    elective: ''
  });

  // Get students from DataContext
  const allStudents: Student[] = students;

  // Use admin-configured departments, sections, and semesters
  const departments = getAvailableDepartments();
  const sections = getAvailableSections();
  const semesters = getAvailableSemesters();
  const categories = getAvailableCategories();

  const filteredStudents = useMemo(() => {
    return allStudents.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = !departmentFilter || student.department === departmentFilter;
      const matchesSemester = !semesterFilter || student.semester.toString() === semesterFilter;
      const matchesSection = !sectionFilter || student.section === sectionFilter;
      
      let matchestrack = true;
      if (trackFilter) {
        const studenttracks = studentElectives
          .filter(se => se.studentId === student.id)
          .map(se => se.track);
        matchestrack = studenttracks.includes(trackFilter);
      }

      return matchesSearch && matchesDepartment && matchesSemester && matchesSection && matchestrack;
    });
  }, [allStudents, searchTerm, departmentFilter, semesterFilter, sectionFilter, trackFilter, studentElectives]);

  const getStudentElectives = (studentId: string) => {
    return studentElectives
      .filter(se => se.studentId === studentId)
      .map(se => {
        const elective = electives.find(e => e.id === se.electiveId);
        return { ...se, elective };
      })
      .sort((a, b) => a.semester - b.semester);
  };

  const getStudenttracks = (studentId: string) => {
    const studentElectivesData = getStudentElectives(studentId);
    const trackCounts = studentElectivesData.reduce((acc: Record<string, number>, se) => {
      acc[se.track] = (acc[se.track] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(trackCounts).map(([track, count]) => ({
      track,
      count: count as number
    }));
  };

  // Get filtered students for advanced report
  const getFilteredStudentsForReport = () => {
    let reportStudents = allStudents;
    
    // Filter by department
    if (reportFilters.department) {
      reportStudents = reportStudents.filter(s => s.department === reportFilters.department);
    }
    
    // Filter by semester
    if (reportFilters.semester) {
      reportStudents = reportStudents.filter(s => s.semester.toString() === reportFilters.semester);
    }
    
    // Filter by section
    if (reportFilters.section) {
      reportStudents = reportStudents.filter(s => s.section === reportFilters.section);
    }
    
    // Filter by category/track/elective
    if (reportFilters.category || reportFilters.track || reportFilters.elective) {
      reportStudents = reportStudents.filter(student => {
        const studentElectivesData = getStudentElectives(student.id);
        
        if (reportFilters.elective) {
          // Filter by specific elective
          return studentElectivesData.some(se => se.electiveId === reportFilters.elective);
        } else if (reportFilters.track) {
          // Filter by specific track
          return studentElectivesData.some(se => se.track === reportFilters.track);
        } else if (reportFilters.category) {
          // Filter by category (get tracks in that category)
          const categoryTracks = getTracksByCategory(reportFilters.category);
          const categoryTrackNames = categoryTracks.map(t => t.name);
          return studentElectivesData.some(se => categoryTrackNames.includes(se.track));
        }
        
        return true;
      });
    }
    
    return reportStudents;
  };

  // Generate detailed report data
  const generateReportData = () => {
    const reportStudents = getFilteredStudentsForReport();
    
    return reportStudents.map(student => {
      const studentElectivesData = getStudentElectives(student.id);
      const studentTracks = getStudenttracks(student.id);
      const primaryTrack = studentTracks.sort((a, b) => b.count - a.count)[0];
      
      // Get electives by category breakdown for all categories
      const departmentalTracks = getTracksByCategory('Departmental').map(t => t.name);
      const openTracks = getTracksByCategory('Open').map(t => t.name);
      const humanitiesTracks = getTracksByCategory('Humanities').map(t => t.name);
      
      const departmentalElectives = studentElectivesData.filter(se => departmentalTracks.includes(se.track));
      const openElectives = studentElectivesData.filter(se => openTracks.includes(se.track));
      const humanitiesElectives = studentElectivesData.filter(se => humanitiesTracks.includes(se.track));
      
      // Get electives by specific category if category filter is applied
      let categoryElectives: typeof studentElectivesData = [];
      if (reportFilters.category) {
        const categoryTrackNames = getTracksByCategory(reportFilters.category).map(t => t.name);
        categoryElectives = studentElectivesData.filter(se => categoryTrackNames.includes(se.track));
      }
      
      // Get track-specific electives if track filter is applied
      let trackElectives: typeof studentElectivesData = [];
      if (reportFilters.track) {
        trackElectives = studentElectivesData.filter(se => se.track === reportFilters.track);
      }
      
      // Get specific elective if elective filter is applied
      let specificElective: typeof studentElectivesData[0] | null = null;
      if (reportFilters.elective) {
        specificElective = studentElectivesData.find(se => se.electiveId === reportFilters.elective) || null;
      }
      
      return {
        'Roll No': student.rollNumber,
        'Name': student.name,
        'Email': student.email,
        'Department': student.department,
        'Semester': student.semester,
        'Section': student.section,
        'Total Electives': studentElectivesData.length,
        'Primary Track': primaryTrack?.track || 'None',
        'Primary Track Count': primaryTrack?.count || 0,
        // Category Breakdown
        'Departmental Electives': departmentalElectives.length,
        'Departmental Electives List': departmentalElectives.map(se => se.elective?.name).join('; ') || 'None',
        'Open Electives': openElectives.length,
        'Open Electives List': openElectives.map(se => se.elective?.name).join('; ') || 'None',
        'Humanities Electives': humanitiesElectives.length,
        'Humanities Electives List': humanitiesElectives.map(se => se.elective?.name).join('; ') || 'None',
        // Filter-specific data
        'Category Electives': reportFilters.category ? categoryElectives.length : 'N/A',
        'Track Electives': reportFilters.track ? trackElectives.length : 'N/A',
        'Selected Elective': reportFilters.elective ? (specificElective ? specificElective.elective?.name : 'Not Selected') : 'N/A',
        'All Electives List': studentElectivesData.map(se => se.elective?.name).join('; '),
        'Tracks Distribution': studentTracks.map(t => `${t.track} (${t.count})`).join('; ')
      };
    });
  };

  // Enhanced export function for advanced reports
  const handleAdvancedExport = (format: 'excel' | 'pdf') => {
    const data = generateReportData();
    const fileName = `students_report_${reportFilters.department || 'all-depts'}_${reportFilters.semester || 'all-sems'}_${reportFilters.section || 'all-sections'}_${reportFilters.category || 'all-categories'}_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'excel') {
      const csvHeaders = Object.keys(data[0] || {}).join(',');
      const csvRows = data.map(row => Object.values(row).map(val => `"${val}"`).join(','));
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      const reportTitle = 'DETAILED STUDENT ELECTIVES REPORT';
      const filterInfo = [
        reportFilters.department && `Department: ${reportFilters.department}`,
        reportFilters.semester && `Semester: ${reportFilters.semester}`,
        reportFilters.section && `Section: ${reportFilters.section}`,
        reportFilters.category && `Category: ${reportFilters.category}`,
        reportFilters.track && `Track: ${reportFilters.track}`,
        reportFilters.elective && `Elective: ${electives.find(e => e.id === reportFilters.elective)?.name}`
      ].filter(Boolean);
      
      const pdfContent = [
        reportTitle,
        `Generated on: ${new Date().toLocaleDateString()}`,
        `Total Students: ${data.length}`,
        '',
        'FILTERS APPLIED:',
        ...filterInfo,
        '',
        'DETAILED STUDENT DATA:',
        '',
        ...data.map((student, index) => [
          `${index + 1}. ${student.Name} (${student['Roll No']})`,
          `   Department: ${student.Department} | Semester: ${student.Semester} | Section: ${student.Section}`,
          `   Email: ${student.Email}`,
          `   Total Electives: ${student['Total Electives']} | Primary Track: ${student['Primary Track']} (${student['Primary Track Count']})`,
          '',
          '   CATEGORY BREAKDOWN:',
          `   ├─ Departmental: ${student['Departmental Electives']} elective(s)`,
          student['Departmental Electives List'] !== 'None' && `      └─ ${student['Departmental Electives List']}`,
          `   ├─ Open: ${student['Open Electives']} elective(s)`,
          student['Open Electives List'] !== 'None' && `      └─ ${student['Open Electives List']}`,
          `   └─ Humanities: ${student['Humanities Electives']} elective(s)`,
          student['Humanities Electives List'] !== 'None' && `      └─ ${student['Humanities Electives List']}`,
          '',
          reportFilters.category && `   Filtered Category (${reportFilters.category}): ${student['Category Electives']} elective(s)`,
          reportFilters.track && `   Filtered Track (${reportFilters.track}): ${student['Track Electives']} elective(s)`,
          reportFilters.elective && `   Specific Elective: ${student['Selected Elective']}`,
          `   Track Distribution: ${student['Tracks Distribution']}`,
          '─'.repeat(80),
          ''
        ].filter(Boolean)).flat()
      ].join('\n');
      
      const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    setShowAdvancedReport(false);
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    const data = filteredStudents.map(student => ({
      'Roll No': student.rollNumber,
      'Name': student.name,
      'Email': student.email,
      'Department': student.department,
      'Semester': student.semester,
      'Section': student.section,
      'Electives Completed': getStudentElectives(student.id).length,
      'Primary track': getStudenttracks(student.id).sort((a, b) => b.count - a.count)[0]?.track || 'None'
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
    settrackFilter('');
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
        <div className="flex gap-3">
          <button
            onClick={() => setShowExportDialog(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Basic Report
          </button>
          <button
            onClick={() => setShowAdvancedReport(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Advanced Report
          </button>
        </div>
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
              {semesters.map(sem => (
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
              {sections.map(section => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>
          </div>

          {/* <div>
            <label htmlFor="track" className="block text-sm font-medium text-gray-700 mb-1">
              Track Focus
            </label>
            <select
              id="track"
              value={trackFilter}
              onChange={(e) => settrackFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Tracks</option>
              {tracks.map(track => (
                <option key={track.id} value={track.name}>{track.name}</option>
              ))}
            </select>
          </div> */}
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
          const studenttracks = getStudenttracks(student.id);
          
          return (
            <div key={student.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.rollNumber}</p>
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

              {/* track Progress */}
              {studenttracks.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">track Focus:</p>
                  <div className="flex flex-wrap gap-1">
                    {studenttracks.slice(0, 2).map(({ track, count }) => {
                      const trackData = tracks.find(d => d.name === track);
                      return (
                        <span
                          key={track}
                          className={`px-2 py-1 rounded-full text-xs font-medium text-white ${trackData?.color || 'bg-gray-500'}`}
                        >
                          {track} ({count})
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
            {searchTerm || departmentFilter || semesterFilter || trackFilter
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
                  {trackFilter && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Primary track:</span>
                      <span className="font-medium text-gray-900">{trackFilter}</span>
                    </div>
                  )}
                  {searchTerm && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Search Term:</span>
                      <span className="font-medium text-gray-900">"{searchTerm}"</span>
                    </div>
                  )}
                  {!departmentFilter && !semesterFilter && !sectionFilter && !trackFilter && !searchTerm && (
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

      {/* Advanced Report Dialog */}
      {showAdvancedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Generate Advanced Student Report</h3>
                <button
                  onClick={() => setShowAdvancedReport(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Create detailed reports with advanced filtering options by department, category, track, and specific electives.
              </p>
              
              {/* Report Filters */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Department Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department Filter
                    </label>
                    <select
                      value={reportFilters.department}
                      onChange={(e) => setReportFilters(prev => ({ 
                        ...prev, 
                        department: e.target.value,
                        category: '', // Reset dependent filters
                        track: '',
                        elective: ''
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Semester Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semester Filter
                    </label>
                    <select
                      value={reportFilters.semester}
                      onChange={(e) => setReportFilters(prev => ({ 
                        ...prev, 
                        semester: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Semesters</option>
                      {semesters.map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>

                  {/* Section Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Filter
                    </label>
                    <select
                      value={reportFilters.section}
                      onChange={(e) => setReportFilters(prev => ({ 
                        ...prev, 
                        section: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Sections</option>
                      {sections.map(section => (
                        <option key={section} value={section}>Section {section}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Elective Category
                    </label>
                    <select
                      value={reportFilters.category}
                      onChange={(e) => setReportFilters(prev => ({ 
                        ...prev, 
                        category: e.target.value as 'Departmental' | 'Open' | 'Humanities' | '',
                        track: '', // Reset dependent filters
                        elective: ''
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Track Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specific Track
                    </label>
                    <select
                      value={reportFilters.track}
                      onChange={(e) => setReportFilters(prev => ({ 
                        ...prev, 
                        track: e.target.value,
                        elective: '' // Reset dependent filter
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!reportFilters.category}
                    >
                      <option value="">All Tracks</option>
                      {reportFilters.category && getTracksByCategory(reportFilters.category).map(track => (
                        <option key={track.id} value={track.name}>{track.name}</option>
                      ))}
                    </select>
                    {!reportFilters.category && (
                      <p className="text-xs text-gray-500 mt-1">Select a category first to filter by track</p>
                    )}
                  </div>

                  {/* Elective Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specific Elective
                    </label>
                    <select
                      value={reportFilters.elective}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, elective: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!reportFilters.track}
                    >
                      <option value="">All Electives</option>
                      {reportFilters.track && electives
                        .filter(e => e.track === reportFilters.track)
                        .map(elective => (
                          <option key={elective.id} value={elective.id}>{elective.name}</option>
                        ))}
                    </select>
                    {!reportFilters.track && (
                      <p className="text-xs text-gray-500 mt-1">Select a track first to filter by specific elective</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Report Preview */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Report Preview:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students matching criteria:</span>
                    <span className="font-medium text-gray-900">{getFilteredStudentsForReport().length}</span>
                  </div>
                  {reportFilters.department && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium text-gray-900">{reportFilters.department}</span>
                    </div>
                  )}
                  {reportFilters.semester && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Semester:</span>
                      <span className="font-medium text-gray-900">Semester {reportFilters.semester}</span>
                    </div>
                  )}
                  {reportFilters.section && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Section:</span>
                      <span className="font-medium text-gray-900">Section {reportFilters.section}</span>
                    </div>
                  )}
                  {reportFilters.category && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-gray-900">{reportFilters.category}</span>
                    </div>
                  )}
                  {reportFilters.track && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Track:</span>
                      <span className="font-medium text-gray-900">{reportFilters.track}</span>
                    </div>
                  )}
                  {reportFilters.elective && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Elective:</span>
                      <span className="font-medium text-gray-900">
                        {electives.find(e => e.id === reportFilters.elective)?.name}
                      </span>
                    </div>
                  )}
                  {!reportFilters.department && !reportFilters.semester && !reportFilters.section && !reportFilters.category && !reportFilters.track && !reportFilters.elective && (
                    <div className="text-gray-600 text-center">All students (no filters applied)</div>
                  )}
                </div>
              </div>

              {/* Category Statistics Preview */}
              {getFilteredStudentsForReport().length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium text-blue-900 mb-3">Category Breakdown Statistics:</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {(() => {
                      const reportData = generateReportData();
                      const categoryStats = {
                        departmental: {
                          total: reportData.reduce((sum, student) => sum + Number(student['Departmental Electives']), 0),
                          students: reportData.filter(student => Number(student['Departmental Electives']) > 0).length
                        },
                        open: {
                          total: reportData.reduce((sum, student) => sum + Number(student['Open Electives']), 0),
                          students: reportData.filter(student => Number(student['Open Electives']) > 0).length
                        },
                        humanities: {
                          total: reportData.reduce((sum, student) => sum + Number(student['Humanities Electives']), 0),
                          students: reportData.filter(student => Number(student['Humanities Electives']) > 0).length
                        }
                      };
                      
                      return (
                        <>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-900">{categoryStats.departmental.total}</div>
                            <div className="text-blue-700">Departmental</div>
                            <div className="text-xs text-blue-600">{categoryStats.departmental.students} students</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-900">{categoryStats.open.total}</div>
                            <div className="text-green-700">Open</div>
                            <div className="text-xs text-green-600">{categoryStats.open.students} students</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-purple-900">{categoryStats.humanities.total}</div>
                            <div className="text-purple-700">Humanities</div>
                            <div className="text-xs text-purple-600">{categoryStats.humanities.students} students</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-xs text-blue-600 text-center">
                      Statistics show total electives selected and number of students in each category
                    </div>
                  </div>
                </div>
              )}
              
              {/* Export Options */}
              <div className="space-y-3">
                <button
                  onClick={() => handleAdvancedExport('excel')}
                  disabled={getFilteredStudentsForReport().length === 0}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <FileText className="w-5 h-5 text-green-600 mr-3" />
                  <div className="text-left">
                    <span className="block text-gray-900 font-medium">Export as Detailed CSV (.csv)</span>
                    <span className="block text-sm text-gray-500">Includes all student data with elective details</span>
                  </div>
                </button>
                
                <button
                  onClick={() => handleAdvancedExport('pdf')}
                  disabled={getFilteredStudentsForReport().length === 0}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <FileText className="w-5 h-5 text-red-600 mr-3" />
                  <div className="text-left">
                    <span className="block text-gray-900 font-medium">Export as Detailed Report (.txt)</span>
                    <span className="block text-sm text-gray-500">Comprehensive text report with full analysis</span>
                  </div>
                </button>
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => setReportFilters({ department: '', semester: '', section: '', category: '', track: '', elective: '' })}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => setShowAdvancedReport(false)}
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
