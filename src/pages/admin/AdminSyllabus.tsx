import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { FileText, Upload, Eye, Download, Trash2, Edit } from 'lucide-react';

const AdminSyllabus: React.FC = () => {
  const { 
    electives, 
    getAllSyllabi, 
    uploadSyllabus, 
    updateSyllabus, 
    deleteSyllabus 
  } = useData();
  const { addNotification } = useNotifications();

  const [selectedElective, setSelectedElective] = useState<string>('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const allSyllabi = getAllSyllabi();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        addNotification({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Please select a PDF file.'
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedElective || !file) {
      addNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please select an elective and a PDF file.'
      });
      return;
    }

    setUploading(true);
    try {
      const success = await uploadSyllabus(selectedElective, file, description);
      if (success) {
        addNotification({
          type: 'success',
          title: 'Syllabus Uploaded',
          message: 'The syllabus has been uploaded successfully.'
        });
        // Reset form
        setSelectedElective('');
        setDescription('');
        setFile(null);
        const fileInput = document.getElementById('syllabusFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload syllabus. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (syllabusId: string) => {
    if (window.confirm('Are you sure you want to delete this syllabus?')) {
      const success = await deleteSyllabus(syllabusId);
      if (success) {
        addNotification({
          type: 'success',
          title: 'Syllabus Deleted',
          message: 'The syllabus has been deleted successfully.'
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete syllabus. Please try again.'
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Syllabus Management
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Upload and manage syllabus PDFs for electives
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload New Syllabus
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Elective
              </label>
              <select
                value={selectedElective}
                onChange={(e) => setSelectedElective(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an elective...</option>
                {electives.map(elective => (
                  <option key={elective.id} value={elective.id}>
                    {elective.name} ({elective.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PDF File
              </label>
              <input
                id="syllabusFile"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description for this syllabus..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedElective || !file}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Syllabus'}
            </button>
          </div>
        </div>

        {/* Existing Syllabi */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Existing Syllabi ({allSyllabi.length})
          </h2>

          {allSyllabi.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Syllabi Uploaded
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Upload your first syllabus using the form above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {allSyllabi.map(syllabus => {
                const elective = electives.find(e => e.id === syllabus.electiveId);
                return (
                  <div key={syllabus.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {elective?.name || 'Unknown Elective'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {elective?.code} • {syllabus.pdfFileName}
                        </p>
                        {syllabus.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {syllabus.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Uploaded: {syllabus.uploadedAt.toLocaleDateString()}</span>
                          <span>Academic Year: {syllabus.academicYear}</span>
                          <span>Version: {syllabus.version}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => window.open(syllabus.pdfUrl, '_blank')}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          title="View PDF"
                        >
                          <Eye className="w-4 h-4" />
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
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(syllabus.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete Syllabus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSyllabus;
