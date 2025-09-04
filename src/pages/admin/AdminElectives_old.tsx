import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import type { Elective } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Plus, Edit, Trash2, BookOpen, X, Download, FileText, Filter } from 'lucide-react';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Electives</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
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
        <div className="flex space-x-2">
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
                  <ElectiveCard key={elective.id} elective={elective} onEdit={handleOpenModal} onDelete={handleDelete} />
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
              <ElectiveCard key={elective.id} elective={elective} onEdit={handleOpenModal} onDelete={handleDelete} />
            ))}
            {filteredElectives.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No electives in this category
              </div>
            )}
          </div>
        </div>
      )}
          <div key={elective.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{elective.name}</h3>
                <p className="text-sm text-gray-600">{elective.code} • Semester {elective.semester}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getDomainColor(elective.domain)}`}>
                {elective.domain}
              </span>
            </div>

            <p className="text-gray-700 mb-4">{elective.description}</p>

            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <span>{elective.credits} Credits</span>
              {elective.prerequisites && elective.prerequisites.length > 0 && (
                <span>{elective.prerequisites.length} Prerequisites</span>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleOpenModal(elective)}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(elective)}
                className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {electives.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No electives found</h3>
          <p className="text-gray-600 mb-6">Start by adding your first elective course.</p>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Elective
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingElective ? 'Edit Elective' : 'Add New Elective'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Elective Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Machine Learning Fundamentals"
                  />
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Course Code
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    required
                    value={formData.code}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., CS501"
                  />
                </div>

                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Semester
                  </label>
                  <select
                    id="semester"
                    name="semester"
                    required
                    value={formData.semester}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="domain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Domain
                  </label>
                  <select
                    id="domain"
                    name="domain"
                    required
                    value={formData.domain}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Domain</option>
                    {domains.map(domain => (
                      <option key={domain.id} value={domain.name}>{domain.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department
                  </label>
                  <select
                    id="department"
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="electiveCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Elective Category
                  </label>
                  <select
                    id="electiveCategory"
                    name="electiveCategory"
                    required
                    value={formData.electiveCategory}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Departmental">Departmental (Core)</option>
                    <option value="Humanities">Humanities</option>
                    <option value="Open Elective">Open Elective</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="infoImage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Info Image Upload
                  </label>
                  <input
                    id="infoImage"
                    name="infoImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.infoImage && (
                    <div className="mt-2">
                      <img 
                        src={formData.infoImage} 
                        alt="Preview" 
                        className="max-w-xs max-h-32 object-cover rounded-md border border-gray-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, infoImage: '' }))}
                        className="ml-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Upload an image with elective details that students can view by clicking the info button (Max: 5MB)
                  </p>
                </div>

                <div>
                  <label htmlFor="credits" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Credits
                  </label>
                  <input
                    id="credits"
                    name="credits"
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={formData.credits}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="selectionDeadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Selection Deadline (Optional)
                  </label>
                  <input
                    id="selectionDeadline"
                    name="selectionDeadline"
                    type="datetime-local"
                    value={formData.selectionDeadline}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Set a deadline for when students can select this elective
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Future Elective Options (Optional)
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                  {electives
                    .filter(e => e.id !== editingElective?.id)
                    .map(elective => (
                    <label key={elective.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.futureOptions.includes(elective.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              futureOptions: [...prev.futureOptions, elective.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              futureOptions: prev.futureOptions.filter(id => id !== elective.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {elective.name} ({elective.code})
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select electives that become available after completing this one
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the elective content and objectives"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
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