import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import type { Elective } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Plus, Edit, Trash2, X } from 'lucide-react';

const AdminElectives: React.FC = () => {
  const { 
    electives, 
    tracks, 
    addElective, 
    updateElective, 
    deleteElective, 
    getAvailableDepartments,
    getAvailableSemesters 
  } = useData();
  const { addNotification } = useNotifications();
  
  const [showModal, setShowModal] = useState(false);
  const [editingElective, setEditingElective] = useState<Elective | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    semester: 5,
    track: '',
    description: '',
    credits: 3,
    prerequisites: [] as string[],
    department: '',
    category: 'Theory' as 'Theory' | 'Practical',
    electiveCategory: 'Departmental' as 'Humanities' | 'Departmental' | 'Open',
    infoImage: '',
    selectionDeadline: '',
    futureOptions: [] as string[],
    minEnrollment: 5,
    maxEnrollment: 40
  });

  // Get departments
  const departments = getAvailableDepartments();
  
  // Filter electives by category
  const electiveCategories = ['all', 'Humanities', 'Departmental', 'Open'];
  const filteredElectives = selectedCategory === 'all' 
    ? electives 
    : electives.filter(e => e.category === selectedCategory);

  // Group electives by category and then by department
  const electivesByCategory = ['Humanities', 'Departmental', 'Open'].map(category => ({
    category,
    departmentGroups: departments.map(department => ({
      department,
      electives: electives.filter(e => e.category === category && e.department === department),
      count: electives.filter(e => e.category === category && e.department === department).length
    })).filter(group => group.count > 0),
    totalCount: electives.filter(e => e.category === category).length
  }));

  const handleOpenModal = (elective?: Elective) => {
    if (elective) {
      setEditingElective(elective);
      setFormData({
        name: elective.name,
        code: elective.code,
        semester: elective.semester,
        track: elective.track,
        description: elective.description,
        credits: elective.credits,
        prerequisites: elective.prerequisites || [],
        department: elective.department || '',
        category: 'Theory',
        electiveCategory: elective.category as 'Humanities' | 'Departmental' | 'Open',
        infoImage: elective.image || '',
        selectionDeadline: elective.selectionDeadline || '',
        futureOptions: [],
        minEnrollment: 5,
        maxEnrollment: 40
      });
    } else {
      setEditingElective(null);
      setFormData({
        name: '',
        code: '',
        semester: 5,
        track: '',
        description: '',
        credits: 3,
        prerequisites: [],
        department: '',
        category: 'Theory',
        electiveCategory: 'Departmental',
        infoImage: '',
        selectionDeadline: '',
        futureOptions: [],
        minEnrollment: 5,
        maxEnrollment: 40
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
    
    // Create elective data matching the interface
    const electiveData = {
      name: formData.name,
      code: formData.code,
      semester: formData.semester,
      track: formData.track,
      description: formData.description,
      credits: formData.credits,
      prerequisites: formData.prerequisites,
      department: formData.department,
      category: formData.electiveCategory as 'Departmental' | 'Humanities' | 'Open',
      electiveCategory: 'Elective' as const,
      image: formData.infoImage || undefined, // Include the image
      selectionDeadline: formData.selectionDeadline || undefined, // Include the deadline
    };
    
    if (editingElective) {
      updateElective(editingElective.id, electiveData);
      addNotification({
        type: 'success',
        title: 'Elective Updated',
        message: `${formData.name} has been updated successfully.`
      });
    } else {
      addElective(electiveData);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: name === 'semester' || name === 'credits' ? parseInt(value) : value
      };
      
      // Clear track when department or elective category changes
      if ((name === 'department' && prev.department !== value) || 
          (name === 'electiveCategory' && prev.electiveCategory !== value)) {
        newData.track = '';
      }
      
      return newData;
    });
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

  const gettrackColor = (trackName: string) => {
    const track = tracks.find(d => d.name === trackName);
    return track?.color || 'bg-gray-500';
  };

  const ElectiveCard = ({ elective }: { elective: Elective }) => (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{elective.name}</h3>
          <p className="text-sm text-gray-600">{elective.code} • Semester {elective.semester}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${gettrackColor(elective.track)}`}>
          {elective.track}
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
                  ({electives.filter(e => e.category === category).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Categorized Electives Display */}
      {selectedCategory === 'all' ? (
        <div className="space-y-8">
          {electivesByCategory.map(({ category, departmentGroups, totalCount }) => (
            <div key={category} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {category} Electives
                  <span className="ml-2 text-sm text-gray-500">({totalCount} total)</span>
                </h2>
              </div>
              
              {departmentGroups.length > 0 ? (
                <div className="space-y-6">
                  {departmentGroups.map(({ department, electives: deptElectives, count }) => (
                    <div key={department} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">
                        {department}
                        <span className="ml-2 text-sm text-gray-500">({count} electives)</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {deptElectives.map(elective => (
                          <ElectiveCard key={elective.id} elective={elective} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No electives in this category
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {selectedCategory} Electives
            <span className="ml-2 text-sm text-gray-500">({filteredElectives.length} total)</span>
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
                    {getAvailableSemesters().map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
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
                    <option value="Open">Open</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {getAvailableDepartments().map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Track *
                  </label>
                  <select
                    name="track"
                    value={formData.track}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select track</option>
                    {tracks
                      .filter(track => 
                        track.department === formData.department && 
                        track.category === formData.electiveCategory
                      )
                      .map(track => (
                        <option key={track.id} value={track.name}>
                          {track.name}
                        </option>
                      ))}
                  </select>
                  {formData.department && formData.electiveCategory && 
                   tracks.filter(track => 
                     track.department === formData.department && 
                     track.category === formData.electiveCategory
                   ).length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      No tracks available for {formData.electiveCategory} category in {formData.department} department. Please create tracks first.
                    </p>
                  )}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Enrollment
                  </label>
                  <input
                    type="number"
                    name="minEnrollment"
                    value={formData.minEnrollment}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Enrollment *
                  </label>
                  <input
                    type="number"
                    name="maxEnrollment"
                    value={formData.maxEnrollment}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 40"
                  />
                </div>
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
