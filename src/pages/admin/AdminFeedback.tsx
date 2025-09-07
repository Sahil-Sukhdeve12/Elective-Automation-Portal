import React, { useState } from 'react';
import { useData, FeedbackTemplate, FeedbackQuestion } from '../../contexts/DataContext';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';

const AdminFeedback: React.FC = () => {
  const {
    createFeedbackTemplate,
    updateFeedbackTemplate,
    deleteFeedbackTemplate,
    getActiveFeedbackTemplates
  } = useData();

  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState<'Departmental' | 'Open' | 'Humanities' | ''>('');
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState({ 
    question: '', 
    type: 'rating' as 'multiple-choice' | 'rating' | 'text' | 'yes-no',
    options: [] as string[]
  });
  const [currentOption, setCurrentOption] = useState('');

  // For now, we'll get all templates by calling getActiveFeedbackTemplates without filters
  // and manage active/inactive state manually
  const allTemplates = getActiveFeedbackTemplates();

  const resetForm = () => {
    setTemplateTitle('');
    setTemplateDescription('');
    setTemplateCategory('');
    setQuestions([]);
    setNewQuestion({ question: '', type: 'rating', options: [] });
    setCurrentOption('');
    setIsCreating(false);
    setEditingTemplate(null);
  };

  const addOption = () => {
    if (currentOption.trim() && newQuestion.type === 'multiple-choice') {
      setNewQuestion(prev => ({
        ...prev,
        options: [...prev.options, currentOption.trim()]
      }));
      setCurrentOption('');
    }
  };

  const removeOption = (index: number) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const addQuestion = () => {
    if (newQuestion.question.trim()) {
      // Validate MCQ has options
      if (newQuestion.type === 'multiple-choice' && newQuestion.options.length < 2) {
        alert('Multiple choice questions must have at least 2 options');
        return;
      }

      const question: FeedbackQuestion = {
        id: Date.now().toString(),
        question: newQuestion.question,
        type: newQuestion.type,
        options: newQuestion.type === 'multiple-choice' ? newQuestion.options : undefined,
        required: true
      };
      setQuestions([...questions, question]);
      setNewQuestion({ question: '', type: 'rating', options: [] });
      setCurrentOption('');
    }
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleCreateTemplate = () => {
    if (templateTitle.trim() && templateCategory && questions.length > 0) {
      createFeedbackTemplate({
        title: templateTitle,
        description: templateDescription,
        targetCategory: templateCategory,
        questions: questions,
        isActive: true,
        createdBy: 'admin' // This should come from auth context in a real app
      });
      resetForm();
    }
  };

  const handleEditTemplate = (template: FeedbackTemplate) => {
    setEditingTemplate(template.id);
    setTemplateTitle(template.title);
    setTemplateDescription(template.description);
    setTemplateCategory(template.targetCategory || '');
    setQuestions(template.questions);
    setIsCreating(true);
  };

  const handleUpdateTemplate = () => {
    if (editingTemplate && templateTitle.trim() && templateCategory && questions.length > 0) {
      updateFeedbackTemplate(editingTemplate, {
        title: templateTitle,
        description: templateDescription,
        targetCategory: templateCategory,
        questions: questions
      });
      resetForm();
    }
  };

  const toggleTemplateStatus = (templateId: string, currentStatus: boolean) => {
    updateFeedbackTemplate(templateId, { isActive: !currentStatus });
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this feedback template?')) {
      deleteFeedbackTemplate(templateId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feedback Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage feedback templates for student electives
          </p>
        </div>

        {/* Create/Edit Template Form */}
        {(isCreating || editingTemplate) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Enter template description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value as 'Departmental' | 'Open' | 'Humanities')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select category</option>
                  <option value="Departmental">Departmental</option>
                  <option value="Open">Open</option>
                  <option value="Humanities">Humanities</option>
                </select>
              </div>

              {/* Questions Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Questions</h3>
                
                {/* Add Question Form */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                  <div className="flex gap-4 mb-3">
                    <input
                      type="text"
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                      placeholder="Enter question text"
                    />
                    <select
                      value={newQuestion.type}
                      onChange={(e) => setNewQuestion({ 
                        ...newQuestion, 
                        type: e.target.value as 'multiple-choice' | 'rating' | 'text' | 'yes-no',
                        options: e.target.value === 'multiple-choice' ? newQuestion.options : []
                      })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                    >
                      <option value="rating">Rating</option>
                      <option value="text">Text</option>
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="yes-no">Yes/No</option>
                    </select>
                    <button
                      onClick={addQuestion}
                      disabled={!newQuestion.question.trim() || (newQuestion.type === 'multiple-choice' && newQuestion.options.length < 2)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* MCQ Options Section */}
                  {newQuestion.type === 'multiple-choice' && (
                    <div className="mt-4 p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Answer Options</h5>
                      
                      {/* Add Option */}
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={currentOption}
                          onChange={(e) => setCurrentOption(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addOption()}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="Enter option text"
                        />
                        <button
                          onClick={addOption}
                          disabled={!currentOption.trim()}
                          className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                        >
                          Add Option
                        </button>
                      </div>

                      {/* Options List */}
                      <div className="space-y-2">
                        {newQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{option}</span>
                            <button
                              onClick={() => removeOption(index)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {newQuestion.options.length === 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Add at least 2 options for multiple choice questions
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Questions List */}
                <div className="space-y-2">
                  {questions.map((question, index) => (
                    <div key={question.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Q{index + 1}</span>
                      <span className="flex-1 text-gray-900 dark:text-white">{question.question}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                        {question.type}
                      </span>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                  disabled={!templateTitle.trim() || !templateCategory || questions.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Template Button */}
        {!isCreating && !editingTemplate && (
          <div className="mb-8">
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Template
            </button>
          </div>
        )}

        {/* Templates List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Feedback Templates</h2>
          
          {allTemplates.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No feedback templates created yet. Create your first template to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {allTemplates.map((template: FeedbackTemplate) => (
                <div key={template.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{template.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{template.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {template.targetCategory || 'General'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        template.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.questions.length} question{template.questions.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="px-3 py-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleTemplateStatus(template.id, template.isActive)}
                      className="px-3 py-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 flex items-center gap-1"
                    >
                      {template.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {template.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeedback;
