import React, { useState, useCallback } from 'react';
import { useData, Track } from '../../contexts/DataContext';
import { Plus, Edit2, Trash2, Save, X, Settings, Tag, MapPin } from 'lucide-react';

const AdminSystemManagement: React.FC = () => {
  const {
    tracks,
    getAvailableDepartments,
    getAvailableSections,
    getAvailableSemesters,
    getAvailableCategories,
    addTrack,
    updateTrack,
    removeTrack,
    addDepartment,
    removeDepartment,
    addSection,
    removeSection,
    addSemester,
    removeSemester,
    addCategory,
    removeCategory
  } = useData();

  const [activeTab, setActiveTab] = useState<'tracks' | 'categories' | 'departments' | 'sections' | 'semesters'>('tracks');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Track form state
  const [trackForm, setTrackForm] = useState({
    name: '',
    department: '',
    description: '',
    color: '#4F46E5',
    category: 'Departmental',
    suggestedElectives: [] as string[],
    prerequisites: [] as string[],
    careerOutcomes: [] as string[],
    difficulty: 'Intermediate' as 'Beginner' | 'Intermediate' | 'Advanced',
    estimatedHours: 40
  });

  // Simple form states for other entities
  const [newDepartment, setNewDepartment] = useState('');
  const [newSection, setNewSection] = useState('');
  const [newSemester, setNewSemester] = useState(5);
  const [newCategory, setNewCategory] = useState(''); // Changed to string to allow custom input

  const departments = getAvailableDepartments();
  const sections = getAvailableSections();
  const semesters = getAvailableSemesters();
  const categories = getAvailableCategories();

  const resetTrackForm = () => {
    setTrackForm({
      name: '',
      department: '',
      description: '',
      color: '#4F46E5',
      category: 'Departmental',
      suggestedElectives: [],
      prerequisites: [],
      careerOutcomes: [],
      difficulty: 'Intermediate',
      estimatedHours: 40
    });
    setShowAddForm(false);
    setEditingItem(null);
  };

  const handleAddTrack = () => {
    if (trackForm.name.trim() && trackForm.department.trim()) {
      const success = addTrack(trackForm);
      if (success) {
        resetTrackForm();
      } else {
        alert('Track name already exists!');
      }
    }
  };

  const handleUpdateTrack = () => {
    if (editingItem && trackForm.name.trim() && trackForm.department.trim()) {
      const success = updateTrack(editingItem, trackForm);
      if (success) {
        resetTrackForm();
      }
    }
  };

  const handleEditTrack = (track: Track) => {
    setEditingItem(track.id);
    setTrackForm({
      name: track.name,
      department: track.department,
      description: track.description,
      color: track.color,
      category: track.category,
      suggestedElectives: track.suggestedElectives || [],
      prerequisites: track.prerequisites || [],
      careerOutcomes: track.careerOutcomes || [],
      difficulty: track.difficulty,
      estimatedHours: track.estimatedHours
    });
    setShowAddForm(true);
  };

  const handleDeleteTrack = (trackId: string) => {
    if (window.confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      const success = removeTrack(trackId);
      if (!success) {
        alert('Cannot delete track that is currently in use by electives.');
      }
    }
  };

  const handleAddDepartment = () => {
    if (newDepartment.trim()) {
      const success = addDepartment(newDepartment.trim());
      if (success) {
        setNewDepartment('');
      } else {
        alert('Department already exists!');
      }
    }
  };

  const handleAddSection = () => {
    if (newSection.trim()) {
      const success = addSection(newSection.trim());
      if (success) {
        setNewSection('');
      } else {
        alert('Section already exists!');
      }
    }
  };

  const handleAddSemester = () => {
    const success = addSemester(newSemester);
    if (success) {
      setNewSemester(newSemester + 1);
    } else {
      alert('Semester already exists!');
    }
  };

  const handleAddCategory = useCallback(() => {
    const categoryName = newCategory.trim();
    
    if (!categoryName) {
      alert('Please enter a category name.');
      return;
    }
    
    if (categoryName.length < 2) {
      alert('Category name must be at least 2 characters long.');
      return;
    }
    
    try {
      const success = addCategory(categoryName);
      if (success) {
        setNewCategory(''); // Reset the input field
      } else {
        alert(`Category "${categoryName}" already exists!`);
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert('An error occurred while adding the category. Please try again.');
    }
  }, [newCategory, addCategory]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage tracks, categories, departments, sections, and semesters
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'tracks', label: 'Tracks', icon: MapPin },
                { id: 'categories', label: 'Categories', icon: Tag },
                { id: 'departments', label: 'Departments', icon: Settings },
                { id: 'sections', label: 'Sections', icon: Settings },
                { id: 'semesters', label: 'Semesters', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as 'tracks' | 'categories' | 'departments' | 'sections' | 'semesters');
                      setShowAddForm(false);
                      setEditingItem(null);
                    }}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Tracks Management */}
            {activeTab === 'tracks' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Track Management</h2>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Track
                  </button>
                </div>

                {(showAddForm || editingItem) && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {editingItem ? 'Edit Track' : 'Add New Track'}
                      </h3>
                      <button
                        onClick={resetTrackForm}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Track Name
                        </label>
                        <input
                          type="text"
                          value={trackForm.name}
                          onChange={(e) => setTrackForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                          placeholder="Enter track name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Department
                        </label>
                        <select
                          value={trackForm.department}
                          onChange={(e) => setTrackForm(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Category
                        </label>
                        <select
                          value={trackForm.category}
                          onChange={(e) => setTrackForm(prev => ({ ...prev, category: e.target.value as 'Departmental' | 'Open' | 'Humanities' }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Difficulty
                        </label>
                        <select
                          value={trackForm.difficulty}
                          onChange={(e) => setTrackForm(prev => ({ ...prev, difficulty: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced' }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={trackForm.description}
                          onChange={(e) => setTrackForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                          placeholder="Enter track description"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={editingItem ? handleUpdateTrack : handleAddTrack}
                        disabled={!trackForm.name.trim() || !trackForm.department.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {editingItem ? 'Update Track' : 'Add Track'}
                      </button>
                      <button
                        onClick={resetTrackForm}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Tracks List */}
                <div className="space-y-4">
                  {tracks.map((track) => (
                    <div key={track.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{track.name}</h3>
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: track.color }}
                            >
                              {track.category}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">{track.description}</p>
                          <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>Department: {track.department}</span>
                            <span>Difficulty: {track.difficulty}</span>
                            <span>Hours: {track.estimatedHours}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTrack(track)}
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrack(track.id)}
                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Management */}
            {activeTab === 'categories' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Category Management</h2>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter category name"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={!newCategory.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Add Category
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <div key={category} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{category}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {tracks.filter(t => t.category === category).length} tracks
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove the ${category} category?`)) {
                              const success = removeCategory(category);
                              if (!success) {
                                alert('Cannot remove category that is currently in use.');
                              }
                            }
                          }}
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Departments Management */}
            {activeTab === 'departments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Department Management</h2>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      placeholder="Department name"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                    />
                    <button
                      onClick={handleAddDepartment}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Department
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((department) => (
                    <div key={department} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white font-medium">{department}</span>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${department}?`)) {
                              removeDepartment(department);
                            }
                          }}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sections Management */}
            {activeTab === 'sections' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Section Management</h2>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      placeholder="Section name"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                    />
                    <button
                      onClick={handleAddSection}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Section
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sections.map((section) => (
                    <div key={section} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white font-medium">Section {section}</span>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove Section ${section}?`)) {
                              removeSection(section);
                            }
                          }}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Semesters Management */}
            {activeTab === 'semesters' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Semester Management</h2>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={newSemester}
                      onChange={(e) => setNewSemester(parseInt(e.target.value) || 1)}
                      min="1"
                      max="8"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                    />
                    <button
                      onClick={handleAddSemester}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Semester
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {semesters.map((semester) => (
                    <div key={semester} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white font-medium">Semester {semester}</span>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove Semester ${semester}?`)) {
                              removeSemester(semester);
                            }
                          }}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemManagement;
