import React, { createContext, useContext, useState, useEffect } from 'react';
import { electivesApi, type Elective as ApiElective } from '../services/api';
import { useAuth } from './AuthContext';

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  department: string;
  yearOfStudy: number;
  semester: number;
  cgpa: number;
  completedCredits: number;
  profile?: {
    interests: string[];
    careerGoals: string[];
    preferredLearningStyle: string;
  };
}

export interface Elective {
  id: string;
  name: string;
  code: string;
  credits: number;
  description: string;
  category: 'Departmental' | 'Open' | 'Humanities';
  electiveCategory: 'Core' | 'Elective' | 'Lab';
  department: string;
  semester: number;
  track: string;
  image?: string;
  selectionDeadline?: string;
  prerequisites?: string[];
  futureOpportunities?: string[];
  minEnrollment?: number;
  maxEnrollment?: number;
}

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  type: 'elective_reminder' | 'deadline' | 'general';
  targetSemester?: number;
  targetDepartment?: string;
  createdAt: Date;
  createdBy: string;
}

export interface FeedbackTemplate {
  id: string;
  name: string;
  questions: Array<{
    id: string;
    text: string;
    type: 'rating' | 'text' | 'multipleChoice';
    options?: string[];
  }>;
}

export interface StudentElectiveSelection {
  id: string;
  studentId: string;
  electiveId: string;
  semester: number;
  selectedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  priority?: number;
}

export interface ElectiveFeedback {
  id: string;
  studentId: string;
  electiveId: string;
  semester: number;
  responses: Record<string, unknown>;
  submittedAt: Date;
}

export interface Track {
  id: string;
  name: string;
  department: string;
  description: string;
  requiredElectives: string[];
  totalCredits: number;
}

interface DataContextType {
  // Data
  students: Student[];
  electives: Elective[];
  tracks: Track[];
  studentElectiveSelections: StudentElectiveSelection[];
  electiveFeedbacks: ElectiveFeedback[];
  alertNotifications: AlertNotification[];
  feedbackTemplates: FeedbackTemplate[];
  
  // Loading states
  loading: boolean;
  electivesLoading: boolean;
  
  // Student functions
  getStudentById: (id: string) => Student | undefined;
  updateStudent: (id: string, data: Partial<Student>) => void;
  
  // Elective functions
  addElective: (elective: Omit<Elective, 'id'>) => Promise<void>;
  updateElective: (id: string, elective: Partial<Elective>) => Promise<void>;
  deleteElective: (id: string) => Promise<void>;
  getElectiveById: (id: string) => Elective | undefined;
  getElectivesByCategoryAndDepartment: (
    category: string,
    department: string,
    semester?: number
  ) => Elective[];
  isElectiveAvailable: (electiveId: string) => { available: boolean; reason?: string };
  isElectiveSelectionOpen: (electiveId: string) => boolean;
  
  // Selection functions
  selectElective: (studentId: string, electiveId: string, semester: number) => Promise<void>;
  unselectElective: (studentId: string, electiveId: string, semester: number) => Promise<void>;
  getStudentSelections: (studentId: string, semester?: number) => StudentElectiveSelection[];
  
  // Analytics and utility functions
  getAvailableDepartments: () => string[];
  getAvailableSemesters: () => number[];
  getElectivesByDepartment: (department: string) => Elective[];
  getStudentsByDepartment: (department: string) => Student[];
  
  // Feedback functions
  submitElectiveFeedback: (
    studentId: string,
    electiveId: string,
    semester: number,
    responses: Record<string, unknown>
  ) => void;
  getElectiveFeedback: (electiveId: string) => ElectiveFeedback[];
  
  // Notification functions
  addAlertNotification: (notification: Omit<AlertNotification, 'id' | 'createdAt'>) => void;
  deleteAlertNotification: (id: string) => void;
  getNotificationsForStudent: (studentId: string) => AlertNotification[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Convert API elective to local elective format
const convertApiElective = (apiElective: ApiElective): Elective => ({
  id: apiElective.id,
  name: apiElective.name,
  code: apiElective.code,
  credits: apiElective.credits,
  description: apiElective.description,
  category: apiElective.category,
  electiveCategory: 'Elective',
  department: apiElective.department,
  semester: apiElective.semester,
  track: apiElective.track,
  image: apiElective.image,
  selectionDeadline: apiElective.selectionDeadline,
  prerequisites: apiElective.prerequisites,
  futureOpportunities: [],
  minEnrollment: 5,
  maxEnrollment: 40,
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [electives, setElectives] = useState<Elective[]>([]);
  const [loading, setLoading] = useState(true);
  const [electivesLoading, setElectivesLoading] = useState(true);
  
  // Initialize with mock data for other entities (since they're not yet in the backend)
  const [students] = useState<Student[]>([]);
  const [tracks] = useState<Track[]>([
    {
      id: '1',
      name: 'Artificial Intelligence',
      department: 'Computer Science',
      description: 'AI and Machine Learning track',
      requiredElectives: [],
      totalCredits: 18
    },
    {
      id: '2', 
      name: 'Web Development',
      department: 'Computer Science',
      description: 'Full-stack web development track',
      requiredElectives: [],
      totalCredits: 18
    },
    {
      id: '3',
      name: 'Data Science',
      department: 'Computer Science', 
      description: 'Data analysis and visualization track',
      requiredElectives: [],
      totalCredits: 18
    }
  ]);
  const [studentElectiveSelections, setStudentElectiveSelections] = useState<StudentElectiveSelection[]>([]);
  const [electiveFeedbacks, setElectiveFeedbacks] = useState<ElectiveFeedback[]>([]);
  const [alertNotifications, setAlertNotifications] = useState<AlertNotification[]>([]);
  const [feedbackTemplates] = useState<FeedbackTemplate[]>([]);

  // Load electives from API
  useEffect(() => {
    const loadElectives = async () => {
      try {
        setElectivesLoading(true);
        const apiElectives = await electivesApi.getElectives();
        const convertedElectives = apiElectives.map(convertApiElective);
        setElectives(convertedElectives);
      } catch (error) {
        console.error('Failed to load electives:', error);
      } finally {
        setElectivesLoading(false);
        setLoading(false);
      }
    };

    if (user) {
      loadElectives();
    } else {
      setLoading(false);
      setElectivesLoading(false);
    }
  }, [user]);

  // Load student selections
  useEffect(() => {
    const loadSelections = async () => {
      if (user?.role === 'student') {
        try {
          const selections = await electivesApi.getStudentSelections();
          setStudentElectiveSelections(selections.map(s => ({
            id: s.id,
            studentId: s.studentId,
            electiveId: s.electiveId,
            semester: s.semester,
            selectedAt: new Date(s.createdAt),
            status: s.status,
            priority: 1
          })));
        } catch (error) {
          console.error('Failed to load selections:', error);
        }
      }
    };

    if (user) {
      loadSelections();
    }
  }, [user]);

  // Elective functions
  const addElective = async (electiveData: Omit<Elective, 'id'>) => {
    try {
      const apiElectiveData = {
        name: electiveData.name,
        code: electiveData.code,
        semester: electiveData.semester,
        track: electiveData.track,
        description: electiveData.description,
        credits: electiveData.credits,
        prerequisites: electiveData.prerequisites,
        department: electiveData.department,
        category: electiveData.category,
        electiveCategory: 'Elective' as const,
        image: electiveData.image,
        selectionDeadline: electiveData.selectionDeadline,
      };
      
      const newElective = await electivesApi.createElective(apiElectiveData);
      const convertedElective = convertApiElective(newElective);
      setElectives(prev => [...prev, convertedElective]);
    } catch (error) {
      console.error('Failed to add elective:', error);
      throw error;
    }
  };

  const updateElective = async (id: string, electiveData: Partial<Elective>) => {
    try {
      const apiElectiveData = {
        name: electiveData.name,
        code: electiveData.code,
        semester: electiveData.semester,
        track: electiveData.track,
        description: electiveData.description,
        credits: electiveData.credits,
        prerequisites: electiveData.prerequisites,
        department: electiveData.department,
        category: electiveData.category,
        image: electiveData.image,
        selectionDeadline: electiveData.selectionDeadline,
      };
      
      const updatedElective = await electivesApi.updateElective(id, apiElectiveData);
      const convertedElective = convertApiElective(updatedElective);
      setElectives(prev => prev.map(e => e.id === id ? convertedElective : e));
    } catch (error) {
      console.error('Failed to update elective:', error);
      throw error;
    }
  };

  const deleteElective = async (id: string) => {
    try {
      await electivesApi.deleteElective(id);
      setElectives(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Failed to delete elective:', error);
      throw error;
    }
  };

  const getElectiveById = (id: string) => {
    return electives.find(e => e.id === id);
  };

  const getElectivesByCategoryAndDepartment = (
    category: string,
    department: string,
    semester?: number
  ) => {
    return electives.filter(e => {
      const categoryMatch = category === 'all' || e.category === category;
      const departmentMatch = department === 'all' || e.department === department;
      const semesterMatch = semester === undefined || e.semester === semester;
      return categoryMatch && departmentMatch && semesterMatch;
    });
  };

  const isElectiveAvailable = (electiveId: string) => {
    const elective = getElectiveById(electiveId);
    if (!elective) return { available: false, reason: 'Elective not found' };
    
    const currentEnrollment = studentElectiveSelections.filter(
      s => s.electiveId === electiveId && s.status === 'approved'
    ).length;
    
    const maxEnrollment = elective.maxEnrollment || 40;
    
    if (currentEnrollment >= maxEnrollment) {
      return { available: false, reason: 'Elective is full' };
    }
    
    return { available: true };
  };

  const isElectiveSelectionOpen = (electiveId: string) => {
    const elective = getElectiveById(electiveId);
    if (!elective?.selectionDeadline) return true;
    
    const deadline = new Date(elective.selectionDeadline);
    const now = new Date();
    
    return now <= deadline;
  };

  // Selection functions
  const selectElective = async (studentId: string, electiveId: string, semester: number) => {
    try {
      const selection = await electivesApi.selectElective(electiveId);
      setStudentElectiveSelections(prev => [...prev, {
        id: selection.id,
        studentId: selection.studentId,
        electiveId: selection.electiveId,
        semester: selection.semester,
        selectedAt: new Date(selection.createdAt),
        status: selection.status,
        priority: 1
      }]);
    } catch (error) {
      console.error('Failed to select elective:', error);
      throw error;
    }
  };

  const unselectElective = async (studentId: string, electiveId: string, semester: number) => {
    try {
      const selection = studentElectiveSelections.find(
        s => s.studentId === studentId && s.electiveId === electiveId && s.semester === semester
      );
      
      if (selection) {
        await electivesApi.unselectElective(selection.id);
        setStudentElectiveSelections(prev => prev.filter(s => s.id !== selection.id));
      }
    } catch (error) {
      console.error('Failed to unselect elective:', error);
      throw error;
    }
  };

  const getStudentSelections = (studentId: string, semester?: number) => {
    return studentElectiveSelections.filter(s => {
      const studentMatch = s.studentId === studentId;
      const semesterMatch = semester === undefined || s.semester === semester;
      return studentMatch && semesterMatch;
    });
  };

  // Utility functions
  const getAvailableDepartments = () => {
    const departments = [...new Set(electives.map(e => e.department))];
    return departments.sort();
  };

  const getAvailableSemesters = () => {
    const semesters = [...new Set(electives.map(e => e.semester))];
    return semesters.sort((a, b) => a - b);
  };

  const getElectivesByDepartment = (department: string) => {
    return electives.filter(e => e.department === department);
  };

  const getStudentsByDepartment = (department: string) => {
    return students.filter(s => s.department === department);
  };

  // Student functions
  const getStudentById = (id: string) => {
    return students.find(s => s.id === id);
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    // This would need to be implemented with backend API
    console.log('updateStudent not yet implemented with backend', id, data);
  };

  // Feedback functions
  const submitElectiveFeedback = (
    studentId: string,
    electiveId: string,
    semester: number,
    responses: Record<string, unknown>
  ) => {
    const feedback: ElectiveFeedback = {
      id: Date.now().toString(),
      studentId,
      electiveId,
      semester,
      responses,
      submittedAt: new Date(),
    };
    setElectiveFeedbacks(prev => [...prev, feedback]);
  };

  const getElectiveFeedback = (electiveId: string) => {
    return electiveFeedbacks.filter(f => f.electiveId === electiveId);
  };

  // Notification functions
  const addAlertNotification = (notification: Omit<AlertNotification, 'id' | 'createdAt'>) => {
    const newNotification: AlertNotification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setAlertNotifications(prev => [...prev, newNotification]);
  };

  const deleteAlertNotification = (id: string) => {
    setAlertNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationsForStudent = (studentId: string) => {
    const student = getStudentById(studentId);
    if (!student) return [];
    
    return alertNotifications.filter(notification => {
      if (notification.targetSemester && notification.targetSemester !== student.semester) {
        return false;
      }
      if (notification.targetDepartment && notification.targetDepartment !== student.department) {
        return false;
      }
      return true;
    });
  };

  return (
    <DataContext.Provider
      value={{
        // Data
        students,
        electives,
        tracks,
        studentElectiveSelections,
        electiveFeedbacks,
        alertNotifications,
        feedbackTemplates,
        
        // Loading states
        loading,
        electivesLoading,
        
        // Functions
        getStudentById,
        updateStudent,
        addElective,
        updateElective,
        deleteElective,
        getElectiveById,
        getElectivesByCategoryAndDepartment,
        isElectiveAvailable,
        isElectiveSelectionOpen,
        selectElective,
        unselectElective,
        getStudentSelections,
        getAvailableDepartments,
        getAvailableSemesters,
        getElectivesByDepartment,
        getStudentsByDepartment,
        submitElectiveFeedback,
        getElectiveFeedback,
        addAlertNotification,
        deleteAlertNotification,
        getNotificationsForStudent,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
