import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Map, FileText, Download, BookOpen } from 'lucide-react';

const StudentRoadmap: React.FC = () => {
  const { user } = useAuth();
  const { 
    getSyllabus,
    getAllSyllabi,
    electives
  } = useData();

  const handleViewSyllabus = async (electiveId: string) => {
    try {
      const syllabusData = getSyllabus(electiveId);
      if (syllabusData?.pdfData) {
        // Open PDF from base64 data
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`
            <html>
              <head><title>${syllabusData.pdfFileName}</title></head>
              <body style="margin:0">
                <embed width="100%" height="100%" src="${syllabusData.pdfData}" type="application/pdf" />
              </body>
            </html>
          `);
        }
      } else {
        alert('Syllabus not available for this elective');
      }
    } catch (error) {
      console.error('Error viewing syllabus:', error);
      alert('Unable to load syllabus');
    }
  };

  // Get complete syllabus document
  const completeSyllabus = getAllSyllabi().find(s => s.electiveId === 'COMPLETE_SYLLABUS');
  
  // Get all individual elective syllabi (excluding complete syllabus)
  const electiveSyllabi = getAllSyllabi().filter(s => s.electiveId !== 'COMPLETE_SYLLABUS');

  if (!user || user.role !== 'student') return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Map className="w-8 h-8 text-blue-600" />
          Syllabus Management
        </h1>
        <p className="text-gray-600 mt-2">
          View and download syllabus documents for all elective courses
        </p>
      </div>

      {/* Complete Syllabus Document */}
      {completeSyllabus && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  📚 Complete Syllabus Document
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Comprehensive syllabus for all elective courses • {completeSyllabus.pdfFileName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Uploaded: {completeSyllabus.uploadedAt.toLocaleDateString()} • Version: {completeSyllabus.version}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleViewSyllabus('COMPLETE_SYLLABUS')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                View Document
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = completeSyllabus.pdfData;
                  link.download = completeSyllabus.pdfFileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Elective Syllabi - Display all uploaded syllabi */}
      {electiveSyllabi.length > 0 && (
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-purple-200 dark:border-purple-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-600 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  📖 Elective Syllabi ({electiveSyllabi.length})
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  View and download syllabus for individual electives
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {electiveSyllabi.map(syllabus => {
                const elective = electives.find(e => e.id === syllabus.electiveId);
                return (
                  <div 
                    key={syllabus.id} 
                    className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-purple-100 dark:bg-purple-800/50 p-2 rounded">
                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                          {elective?.name || 'Unknown Elective'}
                        </h4>
                        {elective?.code && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {elective.code}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {elective && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                            {elective.track}
                          </span>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                            Sem {elective.semester}
                          </span>
                          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded text-xs font-medium">
                            {elective.credits} Credits
                          </span>
                        </div>
                      )}

                      <div className="bg-white dark:bg-gray-800/50 rounded p-2">
                        <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {syllabus.pdfFileName}
                        </p>
                      </div>

                      {syllabus.description && (
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 italic">
                          "{syllabus.description}"
                        </p>
                      )}

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        📅 Uploaded: {syllabus.uploadedAt.toLocaleDateString()}
                      </p>

                      <div className="flex gap-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                        <button
                          onClick={() => handleViewSyllabus(syllabus.electiveId)}
                          className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          View PDF
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = syllabus.pdfData;
                            link.download = syllabus.pdfFileName;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRoadmap;
