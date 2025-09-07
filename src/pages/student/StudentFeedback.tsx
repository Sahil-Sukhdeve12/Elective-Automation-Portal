import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { MessageSquare, Send, Star, CheckCircle } from 'lucide-react';

const StudentFeedback: React.FC = () => {
  const { user } = useAuth();
  const { getActiveFeedbackTemplates } = useData();
  const { addNotification } = useNotifications();
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submittedTemplates, setSubmittedTemplates] = useState<string[]>([]);

  if (!user || user.role !== 'student') return null;

  const feedbackTemplates = getActiveFeedbackTemplates();

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setResponses({});
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const template = feedbackTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;

    // Check if all required questions are answered
    const requiredQuestions = template.questions.filter(q => q.required);
    const missingResponses = requiredQuestions.filter(q => !responses[q.id]);
    
    if (missingResponses.length > 0) {
      addNotification({
        type: 'error',
        title: 'Incomplete Form',
        message: 'Please answer all required questions before submitting.'
      });
      return;
    }

    // Simulate submission (in real app, this would go to a backend)
    setSubmittedTemplates(prev => [...prev, selectedTemplate]);
    setSelectedTemplate('');
    setResponses({});
    
    addNotification({
      type: 'success',
      title: 'Feedback Submitted',
      message: 'Thank you for your feedback! Your responses have been recorded.'
    });
  };

  const renderQuestion = (question: any) => {
    const value = responses[question.id] || '';

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div>
            {question.options?.map((option: string, index: number) => (
              <label key={index} className="flex items-center mb-2">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'rating':
        return (
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                type="button"
                onClick={() => handleResponseChange(question.id, rating)}
                className={`p-1 ${value >= rating ? 'text-yellow-500' : 'text-gray-300'}`}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {value ? `${value}/5` : 'Select rating'}
            </span>
          </div>
        );
      
      case 'text':
        return (
          <textarea
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your response..."
          />
        );
      
      case 'yes-no':
        return (
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={question.id}
                value="yes"
                checked={value === 'yes'}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={question.id}
                value="no"
                checked={value === 'no'}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                className="mr-2"
              />
              No
            </label>
          </div>
        );
      
      default:
        return null;
    }
  };

  const selectedTemplateObj = feedbackTemplates.find(t => t.id === selectedTemplate);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center mb-6">
            <MessageSquare className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Feedback</h1>
              <p className="text-gray-600 mt-2">
                Share your thoughts and help us improve your learning experience
              </p>
            </div>
          </div>

          {feedbackTemplates.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Feedback Forms Available</h3>
              <p className="text-gray-600">Check back later for feedback opportunities.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Feedback Forms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feedbackTemplates.map(template => (
                    <div 
                      key={template.id} 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${
                        submittedTemplates.includes(template.id) 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                      onClick={() => !submittedTemplates.includes(template.id) && handleTemplateSelect(template.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{template.title}</h3>
                        {submittedTemplates.includes(template.id) && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{template.questions.length} questions</span>
                        {template.targetCategory && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {template.targetCategory}
                          </span>
                        )}
                      </div>
                      {submittedTemplates.includes(template.id) && (
                        <div className="mt-2 text-sm text-green-600 font-medium">
                          ✓ Completed
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Template Form */}
              {selectedTemplateObj && (
                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {selectedTemplateObj.title}
                  </h2>
                  <p className="text-gray-600 mb-6">{selectedTemplateObj.description}</p>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {selectedTemplateObj.questions.map((question, index) => (
                      <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                          {index + 1}. {question.question}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderQuestion(question)}
                      </div>
                    ))}
                    
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setSelectedTemplate('')}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Submit Feedback
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentFeedback;
