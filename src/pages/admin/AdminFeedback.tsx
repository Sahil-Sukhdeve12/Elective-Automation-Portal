import React, { useState } from 'react';
import { Plus, FileText, Eye, Trash2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const AdminFeedback: React.FC = () => {
  const { 
    getActiveFeedbackTemplates,
    deleteFeedbackTemplate, 
    createFeedbackTemplate,
    getFeedbackResponses
  } = useData();
  
  // Get all templates and responses
  const feedbackTemplates = getActiveFeedbackTemplates();
  const feedbackResponses = getFeedbackResponses();
  
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    description: '',
    targetCategory: 'Departmental' as 'Departmental' | 'Open' | 'Humanities',
    isActive: true,
    createdBy: 'admin',
    questions: [{ 
      id: '',
      question: '', 
      type: 'text' as 'text' | 'rating' | 'multiple-choice' | 'yes-no', 
      options: [] as string[],
      required: true
    }]
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const addQuestion = () => {
    setNewTemplate(prev => ({
      ...prev,
      questions: [...prev.questions, { 
        id: `q_${Date.now()}`, 
        question: '', 
        type: 'text', 
        options: [], 
        required: true 
      }]
    }));
  };

  const updateQuestion = (index: number, field: string, value: string | boolean) => {
    setNewTemplate(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTemplate.title.trim() && newTemplate.questions.every(q => q.question.trim())) {
      // Add IDs to questions if they don't have them
      const questionsWithIds = newTemplate.questions.map(q => ({
        ...q,
        id: q.id || `q_${Date.now()}_${Math.random()}`
      }));

      createFeedbackTemplate({
        ...newTemplate,
        questions: questionsWithIds
      });
      
      setNewTemplate({
        title: '',
        description: '',
        targetCategory: 'Departmental',
        isActive: true,
        createdBy: 'admin',
        questions: [{ id: '', question: '', type: 'text', options: [], required: true }]
      });
      setShowAddForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this feedback template?')) {
      deleteFeedbackTemplate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage feedback templates</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Template</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{feedbackTemplates.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Responses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{feedbackResponses.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Plus className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{feedbackTemplates.filter(t => t.isActive).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Template Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Feedback Template</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Title
              </label>
              <input
                type="text"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter template title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter template description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={newTemplate.targetCategory}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, targetCategory: e.target.value as 'Departmental' | 'Open' | 'Humanities' }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Departmental">Departmental</option>
                <option value="Open">Open</option>
                <option value="Humanities">Humanities</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Questions
              </label>
              <div className="space-y-3">
                {newTemplate.questions.map((question, index) => (
                  <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter question text"
                        required
                      />
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="text">Text</option>
                        <option value="rating">Rating</option>
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="yes-no">Yes/No</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Required</span>
                      </label>
                      {newTemplate.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="mt-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Template
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Existing Templates</h2>
        {feedbackTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No templates yet</h3>
            <p className="text-gray-600 dark:text-gray-400">Create your first feedback template to get started.</p>
          </div>
        ) : (
          feedbackTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{template.title}</h3>
                  {template.description && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                  )}
                  <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{template.questions.length} questions</span>
                    <span className="mx-2">•</span>
                    <span>{template.targetCategory}</span>
                    <span className="mx-2">•</span>
                    <span className={template.isActive ? 'text-green-600' : 'text-red-600'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Questions:</h4>
                <ul className="space-y-1">
                  {template.questions.map((question, index) => (
                    <li key={question.id} className="text-sm text-gray-600 dark:text-gray-400">
                      {index + 1}. {question.question} ({question.type})
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Responses Summary */}
      {feedbackResponses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Responses</h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">
              You have {feedbackResponses.length} feedback responses. 
              <span className="text-blue-600 dark:text-blue-400 ml-1 cursor-pointer hover:underline">
                View all responses →
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
