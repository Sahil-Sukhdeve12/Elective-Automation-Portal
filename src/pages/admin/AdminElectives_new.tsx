import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import type { Elective } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Plus, Edit, Trash2, BookOpen, X, Download, FileText } from 'lucide-react';

const AdminElectives: React.FC = () => {
  const { electives, domains, addElective, updateElective, deleteElective, exportDataAsExcel, exportDataAsPDF } = useData();
  const { addNotification } = useNotifications();
  
  const [showModal, setShowModal] = useState(false);
  const [editingElective, setEditingElective] = useState<Elective | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    semester: 5,
    domain: '',
    description: '',
    credits: 3,
    prerequisites: [] as string[],
    department: '',
    category: 'Theory' as 'Theory' | 'Practical',
    electiveCategory: 'Departmental' as 'Humanities' | 'Departmental' | 'Open Elective',
    infoImage: '',
    selectionDeadline: '',
    futureOptions: [] as string[]
  });

  // Filter electives by category
  const electiveCategories = ['all', 'Humanities', 'Departmental', 'Open Elective'];
  const filteredElectives = selectedCategory === 'all' 
    ? electives 
    : electives.filter(e => e.electiveCategory === selectedCategory);

  // Group electives by category for display
  const electivesByCategory = electiveCategories.slice(1).map(category => ({
    category,
    electives: electives.filter(e => e.electiveCategory === category),
    count: electives.filter(e => e.electiveCategory === category).length
  }));

  const handleOpenModal = (elective?: Elective) => {
    if (elective) {
      setEditingElective(elective);
      setFormData({
        name: elective.name,
        code: elective.code,
        semester: elective.semester,
        domain: elective.domain,
        description: elective.description,
        credits: elective.credits,
        prerequisites: elective.prerequisites || [],
        department: elective.department || '',
        category: elective.category || 'Theory',
        electiveCategory: elective.electiveCategory || 'Departmental',
        infoImage: elective.infoImage || '',
        selectionDeadline: elective.selectionDeadline || '',
        futureOptions: elective.futureOptions || []
      });
    } else {
      setEditingElective(null);
      setFormData({
        name: '',
        code: '',
        semester: 5,
        domain: '',
        description: '',
        credits: 3,
        prerequisites: [],
        department: '',
        category: 'Theory',
        electiveCategory: 'Departmental',
        infoImage: '',
        selectionDeadline: '',
        futureOptions: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingElective(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingElective) {
      updateElective(editingElective.id, formData);
      addNotification({
        type: 'success',
        title: 'Elective Updated',
        message: `${formData.name} has been updated successfully.`
      });
    } else {
      addElective(formData);
      addNotification({
        type: 'success',
        title: 'Elective Added',
        message: `${formData.name} has been added successfully.`
      });
    }
    
    handleCloseModal();
  };

  const handleDelete = (elective: Elective) => {
    if (confirm(`Are you sure you want to delete "${elective.name}"?`)) {
      deleteElective(elective.id);
      addNotification({
        type: 'success',
        title: 'Elective Deleted',
        message: `${elective.name} has been deleted successfully.`
      });
    }
  };

  const handleExportExcel = () => {
    try {
      exportDataAsExcel();
      addNotification({
        type: 'success',
        title: 'Export Successful',
        message: 'Data exported to Excel successfully.'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export data to Excel. Please try again.'
      });
    }
  };

  const handleExportPDF = () => {
    try {
      exportDataAsPDF();
      addNotification({
        type: 'success',
        title: 'Export Successful',
        message: 'Data exported to PDF successfully.'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export data to PDF. Please try again.'
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' || name === 'credits' ? parseInt(value) : value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        addNotification({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Please select an image file (JPG, PNG, GIF, etc.)'
        });
        return;
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addNotification({
          type: 'error',
          title: 'File Too Large',
          message: 'Please select an image smaller than 5MB'
        });
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          infoImage: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getDomainColor = (domainName: string) => {
    const domain = domains.find(d => d.name === domainName);
    return domain?.color || 'bg-gray-500';
  };

  const ElectiveCard = ({ elective }: { elective: Elective }) => (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{elective.name}</h3>
          <p className="text-sm text-gray-600">{elective.code} • Semester {elective.semester}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getDomainColor(elective.domain)}`}>
          {elective.domain}
        </span>
      </div>

      <p className="text-gray-700 mb-3 text-sm">{elective.description}</p>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
        <span>{elective.credits} Credits</span>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{elective.electiveCategory}</span>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => handleOpenModal(elective)}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
        <button
          onClick={() => handleDelete(elective)}
          className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center text-sm"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Electives</h1>
          <p className="text-gray-600 mt-2">
            Add, edit, and organize electives by category
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Elective
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex space-x-2 flex-wrap">
          {electiveCategories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category === 'all' ? 'All Categories' : category}
              {category !== 'all' && (
                <span className="ml-2 text-xs">
                  ({electives.filter(e => e.electiveCategory === category).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Categorized Electives Display */}
      {selectedCategory === 'all' ? (
        <div className="space-y-8">
          {electivesByCategory.map(({ category, electives: categoryElectives, count }) => (
            <div key={category} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {category} Electives
                  <span className="ml-2 text-sm text-gray-500">({count} total)</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryElectives.map(elective => (
                  <ElectiveCard key={elective.id} elective={elective} />
                ))}
                {categoryElectives.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No electives in this category
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {selectedCategory} Electives
            <span className="ml-2 text-sm text-gray-500">
              ({filteredElectives.length} total)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredElectives.map(elective => (
              <ElectiveCard key={elective.id} elective={elective} />
            ))}
            {filteredElectives.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No electives in this category
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for adding/editing electives */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingElective ? 'Edit Elective' : 'Add New Elective'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Elective Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Machine Learning Fundamentals"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., CS501"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester *
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain *
                  </label>
                  <select
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Domain</option>
                    {domains.map(domain => (
                      <option key={domain.id} value={domain.name}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits *
                  </label>
                  <select
                    name="credits"
                    value={formData.credits}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(credit => (
                      <option key={credit} value={credit}>{credit} Credits</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Computer Science & Engineering"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Elective Category *
                  </label>
                  <select
                    name="electiveCategory"
                    value={formData.electiveCategory}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Departmental">Departmental</option>
                    <option value="Humanities">Humanities</option>
                    <option value="Open Elective">Open Elective</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the elective..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selection Deadline
                </label>
                <input
                  type="datetime-local"
                  name="selectionDeadline"
                  value={formData.selectionDeadline}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Curriculum Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {formData.infoImage && (
                  <div className="mt-2">
                    <img 
                      src={formData.infoImage} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingElective ? 'Update Elective' : 'Add Elective'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminElectives;
