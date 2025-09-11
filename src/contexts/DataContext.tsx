/**
 * DATA CONTEXT PROVIDER
 * 
 * Central data management system for the Elective Selection System.
 * Handles all CRUD operations, export functionality, and data persistence.
 * 
 * Key Features:
 * - Student and elective data management
 * - Excel and PDF export capabilities with roll numbers
 * - Local storage persistence
 * - Real-time data synchronization
 * - Comprehensive reporting system
 * 
 * Export Features:
 * - Student reports include roll numbers for identification
 * - Excel format with multiple worksheets
 * - PDF format with formatted tables
 * - Custom data filtering and sorting
 * 
 * @author Sahil Sukhdeve
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// API Base URL helper
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.MODE === 'production' 
      ? 'https://elective-selection-system.onrender.com/api' 
      : 'http://localhost:5000/api');
};

// API functions to fetch data from backend
const fetchElectives = async () => {
  try {
    console.log('Fetching electives from API...');
    const response = await fetch(`${getApiBaseUrl()}/electives`);
    console.log('Fetch response status:', response.status);
    
    if (!response.ok) {
      console.error('Fetch failed with status:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('Raw electives from API:', data);
    
    // Handle both old format (array) and new format (object with electives property)
    const electives = Array.isArray(data) ? data : (data.electives || []);
    
    // Map MongoDB _id to id for frontend compatibility
    const mappedElectives = electives.map((elective: any) => ({
      ...elective,
      id: elective._id || elective.id
    }));
    
    console.log('Mapped electives:', mappedElectives);
    return mappedElectives;
  } catch (error) {
    console.error('Error fetching electives:', error);
    return [];
  }
};

const fetchUsers = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token found, skipping users fetch');
      return [];
    }
    
    const response = await fetch(`${getApiBaseUrl()}/users`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      console.warn('Fetch users failed with status:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('✅ Users fetched successfully:', data.users?.length || 0);
    return data.users || [];
  } catch (error) {
    console.warn('Error fetching users (non-critical):', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
};

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  department: string;
  yearOfStudy: number;
  semester: number;
  section?: string;
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
  code?: string; // Make code optional
  credits: number;
  description: string;
  category: 'Departmental' | 'Open' | 'Humanities';
  electiveCategory: 'Core' | 'Elective' | 'Lab';
  subjectType?: 'Theory' | 'Practical' | 'Theory+Practical'; // Type of subject
  department: string;
  // For Open Category electives
  offeredBy?: string; // Which department offers this elective
  eligibleDepartments?: string[]; // Which departments can take this elective
  semester: number;
  track: string;
  image?: string; // Optional image URL for the elective
  infoImage?: string; // Alternative field name for image (for backward compatibility)
  selectionDeadline?: string; // ISO date string for selection deadline
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
  title: string;
  description: string;
  questions: FeedbackQuestion[];
  targetCategory?: 'Departmental' | 'Open' | 'Humanities';
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface FeedbackQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'rating' | 'text' | 'yes-no';
  options?: string[]; // For multiple-choice questions
  required: boolean;
}

export interface FeedbackResponse {
  id: string;
  templateId: string;
  templateTitle: string;
  studentId: string;
  studentName: string;
  studentDepartment?: string;
  studentSemester?: number;
  responses: {
    questionId: string;
    question: string;
    answer: any;
    questionType: 'multiple-choice' | 'rating' | 'text' | 'yes-no';
  }[];
  submittedAt: Date;
  electiveId?: string; // If feedback is specific to an elective
}

export interface Track {
  id: string;
  name: string;
  description: string;
  color: string;
  suggestedElectives: string[];
  department: string;
  prerequisites: string[];
  careerOutcomes: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  category: string;
}

export interface StudentElective {
  id: string;
  studentId: string;
  rollNumber?: string;
  studentName?: string;
  electiveId: string;
  elective?: Elective;
  semester: number;
  dateSelected: string;
  enrolledAt?: string;
  track: string;
  feedback?: {
    rating: number;
    comment?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    recommendation: 'Yes' | 'No' | 'Maybe';
  };
}

export interface ElectiveFeedbackForm {
  id: string;
  studentId: string;
  previousElectiveId: string;
  semester: number;
  feedback: {
    rating: number;
    comment: string;
    wouldRecommend: boolean;
    improvements: string;
  };
  submittedAt: Date;
}

export interface Syllabus {
  id: string;
  electiveId: string;
  title: string;
  description: string;
  pdfUrl: string;
  pdfFileName: string;
  uploadedBy: string;
  uploadedAt: Date;
  academicYear: string;
  semester: number;
  version: number;
  isActive: boolean;
}

interface DataContextType {
  electives: Elective[];
  tracks: Track[];
  studentElectives: StudentElective[];
  students: Student[];
  electiveFeedbacks: ElectiveFeedbackForm[];
  getElectivesByCategoryAndDepartment: (category: string, department?: string, semester?: number) => Elective[];
  getStudentElectives: (studentId: string) => StudentElective[];
  selectElective: (studentId: string, electiveId: string, semester: number) => Promise<boolean>;
  removeElective: (studentElectiveId: string) => Promise<boolean>;
  submitFeedback: (studentElectiveId: string, feedback: object) => Promise<boolean>;
  getFutureElectives: (currentElectiveId: string) => Elective[];
  exportDataAsCSV: (dataType: 'students' | 'electives' | 'student-electives') => void;
  exportDataAsExcel: () => void;
  exportDataAsPDF: () => void;
  exportDataAsTXT: (dataType: 'students' | 'electives' | 'student-electives') => void;
  getTracksByDepartment: (department: string) => Track[];
  getElectivesByDepartment: (department: string) => Elective[];
  getTracksByCategory: (category: string) => Track[];
  getElectivesByCategory: (category: 'Humanities' | 'Departmental' | 'Open Elective') => Elective[];
  addElective: (elective: Omit<Elective, 'id'>) => Promise<boolean>;
  updateElective: (id: string, elective: Partial<Elective>) => Promise<boolean>;
  deleteElective: (id: string) => Promise<boolean>;
  refreshElectives: () => Promise<boolean>;
  refreshUsers: () => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  getRecommendations: (studentId: string, semester: number) => Elective[];
  getElectiveRecommendation: (studentId: string, userPreferences: { interests: string[]; careerGoals: string; difficulty: string }) => Elective[];
  getAvailableDepartments: () => string[];
  getAvailableSections: () => string[];
  getAvailableSemesters: () => number[];
  getElectiveEnrollmentCount: (electiveId: string) => number;
  isElectiveAvailable: (electiveId: string) => { available: boolean; reason?: string };
  isElectiveSelectionOpen: (electiveId: string) => boolean;
  addDepartment: (department: string) => boolean;
  removeDepartment: (department: string) => boolean;
  addSection: (section: string) => boolean;
  removeSection: (section: string) => boolean;
  addSemester: (semester: number) => boolean;
  removeSemester: (semester: number) => boolean;
  // Track management functions
  addTrack: (track: Omit<Track, 'id'>) => boolean;
  updateTrack: (id: string, updates: Partial<Track>) => boolean;
  removeTrack: (id: string) => boolean;
  getAvailableCategories: () => string[];
  addCategory: (category: string) => boolean;
  removeCategory: (category: string) => boolean;
  // Alert system functions
  createAlert: (alert: Omit<AlertNotification, 'id' | 'createdAt'>) => void;
  getActiveAlerts: (department?: string, semester?: number) => AlertNotification[];
  deleteAlert: (alertId: string) => void;
  // Feedback template functions
  createFeedbackTemplate: (template: Omit<FeedbackTemplate, 'id' | 'createdAt'>) => void;
  updateFeedbackTemplate: (templateId: string, updates: Partial<FeedbackTemplate>) => void;
  deleteFeedbackTemplate: (templateId: string) => void;
  getActiveFeedbackTemplates: (category?: string) => FeedbackTemplate[];
  // Feedback response functions
  submitFeedbackResponse: (response: Omit<FeedbackResponse, 'id' | 'submittedAt'>) => void;
  getFeedbackResponses: (templateId?: string, studentId?: string) => FeedbackResponse[];
  getStudentSubmittedTemplates: (studentId: string) => string[];
  deleteFeedbackResponse: (responseId: string) => void;
  // Syllabus management functions
  uploadSyllabus: (electiveId: string, file: File, description: string) => Promise<boolean>;
  getSyllabus: (electiveId: string) => Syllabus | null;
  getAllSyllabi: () => Syllabus[];
  updateSyllabus: (syllabusId: string, updates: Partial<Syllabus>) => Promise<boolean>;
  deleteSyllabus: (syllabusId: string) => Promise<boolean>;
  setElectiveDeadline: (electiveId: string, deadline: string) => void;
  getElectiveDeadline: (electiveId: string) => string | null;
  addElectiveFeedback: (feedback: Omit<ElectiveFeedbackForm, 'id'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const initialTracks: Track[] = [
  // {
  //   id: '1',
  //   name: 'Data Science & Analytics',
  //   department: 'Computer Science',
  //   description: 'Advanced analytics, machine learning, and data visualization techniques',
  //   color: '#4F46E5',
  //   suggestedElectives: ['cs301', 'cs302'],
  //   prerequisites: ['Programming Fundamentals', 'Statistics'],
  //   careerOutcomes: ['Data Scientist', 'ML Engineer', 'Business Analyst'],
  //   difficulty: 'Advanced',
  //   estimatedHours: 120,
  //   category: 'Departmental'
  // },
  // {
  //   id: '2',
  //   name: 'Cybersecurity',
  //   department: 'Computer Science',
  //   description: 'Network security, ethical hacking, and information security management',
  //   color: '#DC2626',
  //   suggestedElectives: ['cs303', 'cs304'],
  //   prerequisites: ['Computer Networks', 'Operating Systems'],
  //   careerOutcomes: ['Security Analyst', 'Ethical Hacker', 'Security Consultant'],
  //   difficulty: 'Advanced',
  //   estimatedHours: 100,
  //   category: 'Departmental'
  // },
  // {
  //   id: '3',
  //   name: 'Web Development',
  //   department: 'Computer Science',
  //   description: 'Full-stack web development with modern frameworks',
  //   color: '#059669',
  //   suggestedElectives: ['cs305', 'cs306'],
  //   prerequisites: ['Programming Fundamentals', 'Database Systems'],
  //   careerOutcomes: ['Full Stack Developer', 'Frontend Developer', 'Backend Developer'],
  //   difficulty: 'Intermediate',
  //   estimatedHours: 80,
  //   category: 'Open'
  // },
  // {
  //   id: '4',
  //   name: 'Power Systems',
  //   department: 'Electrical Engineering',
  //   description: 'Advanced power generation, transmission, and distribution systems',
  //   color: '#7C2D12',
  //   suggestedElectives: ['ee301', 'ee302'],
  //   prerequisites: ['Circuit Analysis', 'Electromagnetic Fields'],
  //   careerOutcomes: ['Power Engineer', 'Grid Analyst', 'Renewable Energy Specialist'],
  //   difficulty: 'Advanced',
  //   estimatedHours: 110,
  //   category: 'Departmental'
  // },
  // {
  //   id: '5',
  //   name: 'Digital Signal Processing',
  //   department: 'Electrical Engineering',
  //   description: 'Digital filter design, signal analysis, and processing techniques',
  //   color: '#1E40AF',
  //   suggestedElectives: ['ee303', 'ee304'],
  //   prerequisites: ['Signals and Systems', 'Mathematics'],
  //   careerOutcomes: ['DSP Engineer', 'Audio Engineer', 'Communications Engineer'],
  //   difficulty: 'Advanced',
  //   estimatedHours: 90,
  //   category: 'Departmental'
  // },
  // {
  //   id: '6',
  //   name: 'Communication & Leadership',
  //   department: 'Humanities',
  //   description: 'Developing effective communication and leadership skills',
  //   color: '#7C3AED',
  //   suggestedElectives: ['hum301', 'hum302'],
  //   prerequisites: ['Basic Communication'],
  //   careerOutcomes: ['Team Leader', 'Project Manager', 'Communications Specialist'],
  //   difficulty: 'Intermediate',
  //   estimatedHours: 60,
  //   category: 'Humanities'
  // },
  // {
  //   id: '7',
  //   name: 'Philosophy & Ethics',
  //   department: 'Humanities',
  //   description: 'Exploring ethical frameworks and philosophical thinking',
  //   color: '#DB2777',
  //   suggestedElectives: ['hum303', 'hum304'],
  //   prerequisites: ['Introduction to Philosophy'],
  //   careerOutcomes: ['Ethics Consultant', 'Policy Analyst', 'Academic Researcher'],
  //   difficulty: 'Intermediate',
  //   estimatedHours: 55,
  //   category: 'Humanities'
  // }
];

const initialElectives: Elective[] = [
  // AI Track - Computer Science & Engineering (Departmental Electives)
  // {
  //   id: '1',
  //   name: 'Machine Learning Fundamentals',
  //   code: 'CS501',
  //   semester: 5,
  //   track: 'Data Science & Analytics',
  //   description: 'Introduction to supervised and unsupervised learning algorithms',
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop&crop=center',
  //   selectionDeadline: '2025-12-31T23:59:59.000Z'
  // },
  // {
  //   id: '2',
  //   name: 'Deep Learning',
  //   code: 'CS502',
  //   semester: 6,
  //   track: 'Data Science & Analytics',
  //   description: 'Neural networks, CNNs, RNNs and their applications',
  //   prerequisites: ['1'],
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '3',
  //   name: 'Natural Language Processing',
  //   code: 'CS503',
  //   semester: 7,
  //   track: 'Data Science & Analytics',
  //   description: 'Text processing, sentiment analysis, and language models',
  //   prerequisites: ['1'],
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1526378800651-c32d170fe6f8?w=400&h=300&fit=crop&crop=center'
  // },
  // // Cybersecurity Track - Computer Science & Engineering (Departmental Electives)
  // {
  //   id: '4',
  //   name: 'Network Security',
  //   code: 'CS504',
  //   semester: 5,
  //   track: 'Cybersecurity',
  //   description: 'Firewalls, intrusion detection, and network protocols',
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '5',
  //   name: 'Ethical Hacking',
  //   code: 'CS505',
  //   semester: 6,
  //   track: 'Cybersecurity',
  //   description: 'Penetration testing, vulnerability assessment',
  //   prerequisites: ['4'],
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '6',
  //   name: 'Cryptography',
  //   code: 'CS506',
  //   semester: 7,
  //   track: 'Cybersecurity',
  //   description: 'Encryption algorithms, digital signatures, blockchain',
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1614064643087-96ce79ad4c25?w=400&h=300&fit=crop&crop=center'
  // },
  // // Data Science Track - Computer Science & Engineering (Departmental Electives)
  // {
  //   id: '7',
  //   name: 'Big Data Analytics',
  //   code: 'CS507',
  //   semester: 5,
  //   track: 'Data Science',
  //   description: 'Hadoop, Spark, and distributed computing',
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '8',
  //   name: 'Data Visualization',
  //   code: 'CS508',
  //   semester: 6,
  //   track: 'Data Science',
  //   description: 'Interactive dashboards and visual storytelling',
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '9',
  //   name: 'Statistical Learning',
  //   code: 'CS509',
  //   semester: 7,
  //   track: 'Data Science',
  //   description: 'Statistical models and hypothesis testing',
  //   prerequisites: ['7'],
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center'
  // },
  // // Web Development Track - Computer Science & Engineering (Departmental Electives)
  // {
  //   id: '10',
  //   name: 'Full Stack Development',
  //   code: 'CS510',
  //   semester: 5,
  //   track: 'Web Development',
  //   description: 'MERN/MEAN stack development and deployment',
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '11',
  //   name: 'Cloud Computing',
  //   code: 'CS511',
  //   semester: 6,
  //   track: 'Web Development',
  //   description: 'AWS, Azure, and cloud architecture patterns',
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '12',
  //   name: 'Mobile Development',
  //   code: 'CS512',
  //   semester: 7,
  //   track: 'Web Development',
  //   description: 'React Native, Flutter, and cross-platform development',
  //   prerequisites: ['10'],
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop&crop=center'
  // },
  // // Digital Signal Processing Track - Electronics & Communication (Departmental Electives)
  // {
  //   id: '13',
  //   name: 'Advanced Signal Processing',
  //   code: 'EC501',
  //   semester: 5,
  //   track: 'Digital Signal Processing',
  //   description: 'Digital filters, transforms, and signal analysis',
  //   credits: 3,
  //   department: 'Electronics & Communication',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '14',
  //   name: 'Communication Systems',
  //   code: 'EC502',
  //   semester: 6,
  //   track: 'Digital Signal Processing',
  //   description: 'Modulation, coding, and wireless communication',
  //   credits: 3,
  //   department: 'Electronics & Communication',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1476357471311-43c0db9fb2b4?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '15',
  //   name: 'Image Processing',
  //   code: 'EC503',
  //   semester: 7,
  //   track: 'Digital Signal Processing',
  //   description: 'Digital image enhancement and computer vision',
  //   prerequisites: ['13'],
  //   credits: 3,
  //   department: 'Electronics & Communication',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=400&h=300&fit=crop&crop=center'
  // },
  // // VLSI Design Track - Electronics & Communication (Departmental Electives)
  // {
  //   id: '16',
  //   name: 'VLSI Circuit Design',
  //   code: 'EC504',
  //   semester: 5,
  //   track: 'VLSI Design',
  //   description: 'CMOS circuit design and layout optimization',
  //   credits: 3,
  //   department: 'Electronics & Communication',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '17',
  //   name: 'System-on-Chip Design',
  //   code: 'EC505',
  //   semester: 6,
  //   track: 'VLSI Design',
  //   description: 'SoC architecture and design methodology',
  //   prerequisites: ['16'],
  //   credits: 3,
  //   department: 'Electronics & Communication',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '18',
  //   name: 'FPGA Programming',
  //   code: 'EC506',
  //   semester: 7,
  //   track: 'VLSI Design',
  //   description: 'HDL programming and FPGA implementation',
  //   credits: 3,
  //   department: 'Electronics & Communication',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // // Humanities Electives
  // {
  //   id: '19',
  //   name: 'Philosophy of Technology',
  //   code: 'HU501',
  //   semester: 5,
  //   track: 'Philosophy',
  //   description: 'Exploring the relationship between technology and society',
  //   credits: 2,
  //   department: 'Humanities',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '20',
  //   name: 'Technical Communication',
  //   code: 'HU502',
  //   semester: 6,
  //   track: 'Communication',
  //   description: 'Advanced writing and presentation skills for engineers',
  //   credits: 2,
  //   department: 'Humanities',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '21',
  //   name: 'Engineering Economics',
  //   code: 'HU503',
  //   semester: 7,
  //   track: 'Economics',
  //   description: 'Economic principles applied to engineering decisions',
  //   credits: 3,
  //   department: 'Humanities',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '22',
  //   name: 'Innovation Management',
  //   code: 'HU504',
  //   semester: 5,
  //   track: 'Management',
  //   description: 'Managing innovation processes in technology companies',
  //   credits: 3,
  //   department: 'Humanities',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // // Open Electives
  // {
  //   id: '23',
  //   name: 'Digital Marketing',
  //   code: 'OE501',
  //   semester: 5,
  //   track: 'Marketing',
  //   description: 'Online marketing strategies and social media management',
  //   credits: 3,
  //   department: 'Open',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '24',
  //   name: 'Financial Literacy',
  //   code: 'OE502',
  //   semester: 6,
  //   track: 'Web Development',
  //   description: 'Personal finance, investments, and financial planning',
  //   credits: 2,
  //   department: 'Open',
  //   category: 'Open',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '25',
  //   name: 'Environmental Science',
  //   code: 'OE503',
  //   semester: 7,
  //   track: 'Web Development',
  //   description: 'Environmental issues and sustainable development',
  //   credits: 3,
  //   department: 'Open',
  //   category: 'Open',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '26',
  //   name: 'Data Analytics for Business',
  //   code: 'OE504',
  //   semester: 5,
  //   track: 'Web Development',
  //   description: 'Using data science techniques for business insights',
  //   credits: 3,
  //   department: 'Open',
  //   category: 'Open',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '27',
  //   name: 'Entrepreneurship',
  //   code: 'OE505',
  //   semester: 6,
  //   track: 'Web Development',
  //   description: 'Starting and managing technology startups',
  //   credits: 3,
  //   department: 'Open',
  //   category: 'Open',
  //   electiveCategory: 'Elective'
  // },
  // // Humanities Electives
  // {
  //   id: '28',
  //   name: 'Technical Communication',
  //   code: 'HUM501',
  //   semester: 5,
  //   track: 'Communication & Leadership',
  //   description: 'Professional writing and presentation skills',
  //   credits: 2,
  //   department: 'Humanities',
  //   category: 'Humanities',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '29',
  //   name: 'Ethics in Engineering',
  //   code: 'HUM502',
  //   semester: 6,
  //   track: 'Philosophy & Ethics',
  //   description: 'Moral and ethical issues in engineering practice',
  //   credits: 2,
  //   department: 'Humanities',
  //   category: 'Humanities',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '30',
  //   name: 'Psychology of Technology',
  //   code: 'HUM503',
  //   semester: 7,
  //   track: 'Communication & Leadership',
  //   description: 'Human behavior and technology interaction',
  //   credits: 3,
  //   department: 'Humanities',
  //   category: 'Humanities',
  //   electiveCategory: 'Elective'
  // }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [electives, setElectives] = useState<Elective[]>([]);
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentElectives, setStudentElectives] = useState<StudentElective[]>([]);
  const [electiveFeedbacks, setElectiveFeedbacks] = useState<ElectiveFeedbackForm[]>([]);
  
  // Admin-configured data
  const [adminDepartments, setAdminDepartments] = useState<string[]>([]);
  const [adminSections, setAdminSections] = useState<string[]>([]);
  const [adminSemesters, setAdminSemesters] = useState<number[]>([]);
  
  // Alert and feedback system
  const [alertNotifications, setAlertNotifications] = useState<AlertNotification[]>([]);
  const [feedbackTemplates, setFeedbackTemplates] = useState<FeedbackTemplate[]>([]);
  const [feedbackResponses, setFeedbackResponses] = useState<FeedbackResponse[]>([]);
  
  // Syllabus management
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);

  useEffect(() => {
    // Load data from backend API
    const loadData = async () => {
      console.log('🔄 Loading data from backend...');
      
      // Fetch electives from backend
      const backendElectives = await fetchElectives();
      if (backendElectives.length > 0) {
        console.log('✅ Loaded electives from backend:', backendElectives.length);
        setElectives(backendElectives);
        localStorage.setItem('electives', JSON.stringify(backendElectives));
      } else {
        // Fallback to stored or initial data
        const storedElectives = localStorage.getItem('electives');
        if (storedElectives) {
          setElectives(JSON.parse(storedElectives));
        } else {
          setElectives(initialElectives);
          localStorage.setItem('electives', JSON.stringify(initialElectives));
        }
      }

      // Fetch users from backend  
      const backendUsers = await fetchUsers();
      if (backendUsers.length > 0) {
        console.log('✅ Loaded users from backend:', backendUsers.length);
        // Convert users to students format and store them
        const studentsData = backendUsers
          .filter((user: any) => user.role === 'student')
          .map((user: any) => ({
            id: user._id || user.id,
            name: user.name,
            rollNumber: user.rollNumber || user.rollNo,
            email: user.email,
            department: user.department,
            yearOfStudy: Math.ceil((user.semester || 1) / 2),
            semester: user.semester || 1,
            section: user.section || 'A',
            cgpa: user.cgpa || 0,
            completedCredits: user.completedCredits || 0,
            profile: user.preferences || {
              interests: [],
              careerGoals: [],
              preferredLearningStyle: ''
            }
          }));
        
        setStudents(studentsData);
        localStorage.setItem('students', JSON.stringify(studentsData));
      } else {
        // Load from localStorage if backend fails
        const storedStudents = localStorage.getItem('students');
        if (storedStudents) {
          setStudents(JSON.parse(storedStudents));
        }
      }
    };

    loadData();

    // Initialize other data from localStorage or use defaults
    const storedStudentElectives = localStorage.getItem('studentElectives');
    const storedElectiveFeedbacks = localStorage.getItem('electiveFeedbacks');
    
    // Initialize admin-configured data
    const storedAdminDepartments = localStorage.getItem('adminDepartments');
    const storedAdminSections = localStorage.getItem('adminSections');
    const storedAdminSemesters = localStorage.getItem('adminSemesters');
    const storedTracks = localStorage.getItem('tracks');
    const storedAdminCategories = localStorage.getItem('adminCategories');
    
    // Initialize alert and feedback data
    const storedAlerts = localStorage.getItem('alertNotifications');
    const storedFeedbackTemplates = localStorage.getItem('feedbackTemplates');
    const storedFeedbackResponses = localStorage.getItem('feedbackResponses');
    const storedSyllabi = localStorage.getItem('syllabi');

    if (storedStudentElectives) {
      setStudentElectives(JSON.parse(storedStudentElectives));
    }
    
    if (storedAdminDepartments) {
      setAdminDepartments(JSON.parse(storedAdminDepartments));
    }
    
    if (storedAdminSections) {
      setAdminSections(JSON.parse(storedAdminSections));
    }
    
    if (storedAdminSemesters) {
      setAdminSemesters(JSON.parse(storedAdminSemesters));
    }

    if (storedTracks) {
      setTracks(JSON.parse(storedTracks));
    } else {
      localStorage.setItem('tracks', JSON.stringify(initialTracks));
    }

    if (storedAdminCategories) {
      setAdminCategories(JSON.parse(storedAdminCategories));
    } else {
      const defaultCategories: string[] = ['Departmental', 'Open', 'Humanities'];
      setAdminCategories(defaultCategories);
      localStorage.setItem('adminCategories', JSON.stringify(defaultCategories));
    }

    if (storedElectiveFeedbacks) {
      setElectiveFeedbacks(JSON.parse(storedElectiveFeedbacks));
    }
    
    if (storedAlerts) {
      const parsedAlerts = JSON.parse(storedAlerts).map((alert: any) => ({
        ...alert,
        createdAt: new Date(alert.createdAt)
      }));
      setAlertNotifications(parsedAlerts);
    }
    
    if (storedFeedbackTemplates) {
      setFeedbackTemplates(JSON.parse(storedFeedbackTemplates));
    }
    
    if (storedFeedbackResponses) {
      const parsedResponses = JSON.parse(storedFeedbackResponses).map((response: any) => ({
        ...response,
        submittedAt: new Date(response.submittedAt)
      }));
      setFeedbackResponses(parsedResponses);
    }
    
    if (storedSyllabi) {
      const parsedSyllabi = JSON.parse(storedSyllabi).map((syllabus: any) => ({
        ...syllabus,
        uploadedAt: new Date(syllabus.uploadedAt)
      }));
      setSyllabi(parsedSyllabi);
    }
  }, []);

  const addElective = async (elective: Omit<Elective, 'id'>): Promise<boolean> => {
    try {
      console.log('Adding elective:', elective);
      
      // Save to database via API
      const response = await fetch(`${getApiBaseUrl()}/electives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(elective)
      });
      
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        
        const newElective = {
          ...data.elective,
          id: data.elective._id || data.elective.id
        };
        
        console.log('Mapped elective:', newElective);
        
        // Update local state immediately
        const updatedElectives = [...electives, newElective];
        setElectives(updatedElectives);
        localStorage.setItem('electives', JSON.stringify(updatedElectives));
        
        // Refresh data from backend to ensure consistency
        setTimeout(async () => {
          console.log('Refreshing electives...');
          await refreshElectives();
        }, 500);
        
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to save elective to database:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error adding elective:', error);
      // Fallback to local storage only
      const newElective = {
        ...elective,
        id: Date.now().toString()
      };
      const updatedElectives = [...electives, newElective];
      setElectives(updatedElectives);
      localStorage.setItem('electives', JSON.stringify(updatedElectives));
      return true;
    }
  };

  const updateElective = async (id: string, updates: Partial<Elective>): Promise<boolean> => {
    try {
      // Update in database via API
      const response = await fetch(`${getApiBaseUrl()}/electives/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        // Update local state
        const updatedElectives = electives.map(e => 
          e.id === id ? { ...e, ...updates } : e
        );
        setElectives(updatedElectives);
        localStorage.setItem('electives', JSON.stringify(updatedElectives));
        return true;
      } else {
        console.error('Failed to update elective in database');
        return false;
      }
    } catch (error) {
      console.error('Error updating elective:', error);
      // Fallback to local storage only
      const updatedElectives = electives.map(e => 
        e.id === id ? { ...e, ...updates } : e
      );
      setElectives(updatedElectives);
      localStorage.setItem('electives', JSON.stringify(updatedElectives));
      return true;
    }
  };

  const removeElective = async (studentElectiveId: string): Promise<boolean> => {
    try {
      // Remove from student electives
      const updatedStudentElectives = studentElectives.filter(se => se.id !== studentElectiveId);
      setStudentElectives(updatedStudentElectives);
      localStorage.setItem('studentElectives', JSON.stringify(updatedStudentElectives));
      return true;
    } catch (error) {
      console.error('Error removing elective:', error);
      return false;
    }
  };

  const submitFeedback = async (studentElectiveId: string, feedback: object): Promise<boolean> => {
    try {
      // Update the student elective with feedback
      const updatedStudentElectives = studentElectives.map(se => 
        se.id === studentElectiveId 
          ? { 
              ...se, 
              feedback: {
                rating: (feedback as any).rating || se.feedback?.rating || 0,
                comment: (feedback as any).comment || se.feedback?.comment || '',
                difficulty: (feedback as any).difficulty || se.feedback?.difficulty || 'medium',
                recommendation: (feedback as any).recommendation || se.feedback?.recommendation || false
              }, 
              feedbackSubmitted: true 
            }
          : se
      );
      setStudentElectives(updatedStudentElectives);
      localStorage.setItem('studentElectives', JSON.stringify(updatedStudentElectives));
      return true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }
  };

  const deleteElective = async (id: string): Promise<boolean> => {
    try {
      console.log('Deleting elective:', id);
      
      // Delete from database via API
      const response = await fetch(`${getApiBaseUrl()}/electives/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      console.log('Delete API response status:', response.status);
      
      if (response.ok) {
        // Update local state
        const updatedElectives = electives.filter(e => e.id !== id);
        setElectives(updatedElectives);
        localStorage.setItem('electives', JSON.stringify(updatedElectives));
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to delete elective:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error deleting elective:', error);
      return false;
    }
  };

  const selectElective = async (studentId: string, electiveId: string, semester: number): Promise<boolean> => {
    const elective = electives.find(e => e.id === electiveId);
    if (!elective) return false;

    const studentElective: StudentElective = {
      id: `se_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      electiveId,
      semester,
      dateSelected: new Date().toISOString(),
      track: elective.track
    };

    const updatedStudentElectives = [...studentElectives, studentElective];
    setStudentElectives(updatedStudentElectives);
    localStorage.setItem('studentElectives', JSON.stringify(updatedStudentElectives));
    return true;
  };

  const getStudentElectives = (studentId: string): StudentElective[] => {
    return studentElectives.filter(se => se.studentId === studentId);
  };

  const getRecommendations = (studentId: string, semester: number): Elective[] => {
    const userElectives = getStudentElectives(studentId);
    const completedTracks = userElectives.map(se => se.track);
    const completedElectiveIds = userElectives.map(se => se.electiveId);
    
    // Get electives for current semester that haven't been taken
    return electives.filter(e => 
      e.semester === semester && 
      !completedElectiveIds.includes(e.id) &&
      (!e.prerequisites || e.prerequisites.every(prereq => completedElectiveIds.includes(prereq)))
    ).sort((a, b) => {
      // Prioritize electives in Tracks the student has already explored
      const aInProgress = completedTracks.includes(a.track);
      const bInProgress = completedTracks.includes(b.track);
      
      if (aInProgress && !bInProgress) return -1;
      if (!aInProgress && bInProgress) return 1;
      return 0;
    });
  };

  const getElectivesByDepartment = (department: string): Elective[] => {
    return electives.filter(e => e.department === department);
  };

  const getTracksByDepartment = (department: string): Track[] => {
    return tracks.filter(d => d.department === department);
  };

  const getTracksByCategory = (category: string): Track[] => {
    return tracks.filter(t => t.category === category);
  };

  const getElectivesByCategory = (category: 'Humanities' | 'Departmental' | 'Open Elective'): Elective[] => {
    const mappedCategory = category === 'Open Elective' ? 'Open' : category;
    return electives.filter(e => e.category === mappedCategory);
  };

  const getElectivesByCategoryAndDepartment = (category: string, department?: string, semester?: number): Elective[] => {
    const mappedCategory = category === 'Open Elective' ? 'Open' : category as 'Humanities' | 'Departmental' | 'Open';
    return electives.filter(e => {
      let categoryMatch = false;
      
      if (mappedCategory === 'Open') {
        // For Open electives, check if the user's department is in eligibleDepartments
        // or if no eligibleDepartments is specified (backward compatibility)
        const hasEligibleDepts = e.eligibleDepartments && e.eligibleDepartments.length > 0;
        const isDeptEligible = department && hasEligibleDepts ? e.eligibleDepartments!.includes(department) : true;
        categoryMatch = e.category === mappedCategory && (!hasEligibleDepts || isDeptEligible);
      } else if (mappedCategory === 'Departmental') {
        // For Departmental electives, must match user's department
        categoryMatch = e.category === mappedCategory && e.department === department;
      } else {
        // For Humanities and other categories
        categoryMatch = e.category === mappedCategory;
      }
      
      const semesterMatch = semester ? e.semester === semester : true;
      return categoryMatch && semesterMatch;
    });
  };

  // New functions for additional features
  const setElectiveDeadline = (electiveId: string, deadline: string) => {
    setElectives(prev => prev.map(e => 
      e.id === electiveId ? { ...e, selectionDeadline: deadline } : e
    ));
    localStorage.setItem('electives', JSON.stringify(electives));
  };

  const getElectiveDeadline = (electiveId: string): string | null => {
    const elective = electives.find(e => e.id === electiveId);
    return elective?.selectionDeadline || null;
  };

  const isElectiveSelectionOpen = (electiveId: string): boolean => {
    const deadline = getElectiveDeadline(electiveId);
    if (!deadline) return true; // No deadline set means always open
    return new Date() <= new Date(deadline);
  };

  // Get available departments from admin-configured data first, then fallback to electives and students data
  const getAvailableDepartments = (): string[] => {
    if (adminDepartments.length > 0) {
      return adminDepartments.sort();
    }
    
    const departmentsFromElectives = [...new Set(electives.map(e => e.department))];
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const departmentsFromStudents = [...new Set(users.filter((u: any) => u.role === 'student').map((s: any) => s.department))] as string[];
    const allDepartments = [...new Set([...departmentsFromElectives, ...departmentsFromStudents])] as string[];
    return allDepartments.filter((dept: string) => dept && dept.trim() !== '').sort();
  };

  // Get available sections from admin-configured data first, then fallback to students data
  const getAvailableSections = (): string[] => {
    if (adminSections.length > 0) {
      return adminSections.sort();
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const sections = [...new Set(users.filter((u: any) => u.role === 'student').map((s: any) => s.section))] as string[];
    return sections.filter((section: string) => section && section.trim() !== '').sort();
  };

  // Get available semesters from admin-configured data first, then fallback to electives data
  const getAvailableSemesters = (): number[] => {
    if (adminSemesters.length > 0) {
      return adminSemesters.sort((a, b) => a - b);
    }
    
    const semesters = [...new Set(electives.map(e => e.semester))];
    return semesters.filter(sem => sem > 0).sort((a, b) => a - b);
  };

  // Admin management functions for departments
  const addDepartment = (department: string): boolean => {
    if (!department.trim() || adminDepartments.includes(department)) {
      return false;
    }
    const updatedDepartments = [...adminDepartments, department].sort();
    setAdminDepartments(updatedDepartments);
    localStorage.setItem('adminDepartments', JSON.stringify(updatedDepartments));
    return true;
  };

  const removeDepartment = (department: string): boolean => {
    const updatedDepartments = adminDepartments.filter(d => d !== department);
    setAdminDepartments(updatedDepartments);
    localStorage.setItem('adminDepartments', JSON.stringify(updatedDepartments));
    return true;
  };

  // Admin management functions for sections
  const addSection = (section: string): boolean => {
    if (!section.trim() || adminSections.includes(section)) {
      return false;
    }
    const updatedSections = [...adminSections, section].sort();
    setAdminSections(updatedSections);
    localStorage.setItem('adminSections', JSON.stringify(updatedSections));
    return true;
  };

  const removeSection = (section: string): boolean => {
    const updatedSections = adminSections.filter(s => s !== section);
    setAdminSections(updatedSections);
    localStorage.setItem('adminSections', JSON.stringify(updatedSections));
    return true;
  };

  // Admin management functions for semesters
  const addSemester = (semester: number): boolean => {
    if (semester <= 0 || adminSemesters.includes(semester)) {
      return false;
    }
    const updatedSemesters = [...adminSemesters, semester].sort((a, b) => a - b);
    setAdminSemesters(updatedSemesters);
    localStorage.setItem('adminSemesters', JSON.stringify(updatedSemesters));
    return true;
  };

  const removeSemester = (semester: number): boolean => {
    const updatedSemesters = adminSemesters.filter(s => s !== semester);
    setAdminSemesters(updatedSemesters);
    localStorage.setItem('adminSemesters', JSON.stringify(updatedSemesters));
    return true;
  };

  // Admin-configured categories state
  const [adminCategories, setAdminCategories] = useState<string[]>([
    'Departmental', 'Open', 'Humanities'
  ]);

  // Track management functions
  const addTrack = (track: Omit<Track, 'id'>): boolean => {
    if (!track.name.trim() || tracks.some(t => t.name === track.name)) {
      return false;
    }
    const newTrack: Track = {
      ...track,
      id: Date.now().toString()
    };
    const updatedTracks = [...tracks, newTrack];
    setTracks(updatedTracks);
    localStorage.setItem('tracks', JSON.stringify(updatedTracks));
    return true;
  };

  const updateTrack = (id: string, updates: Partial<Track>): boolean => {
    const updatedTracks = tracks.map(track => 
      track.id === id ? { ...track, ...updates } : track
    );
    setTracks(updatedTracks);
    localStorage.setItem('tracks', JSON.stringify(updatedTracks));
    return true;
  };

  const removeTrack = (id: string): boolean => {
    // Check if any electives are using this track
    const trackInUse = electives.some(e => e.track === tracks.find(t => t.id === id)?.name);
    if (trackInUse) {
      return false; // Cannot remove track that's in use
    }
    const updatedTracks = tracks.filter(t => t.id !== id);
    setTracks(updatedTracks);
    localStorage.setItem('tracks', JSON.stringify(updatedTracks));
    return true;
  };

  // Category management functions
  const getAvailableCategories = (): string[] => {
    return adminCategories;
  };

  const addCategory = (category: string): boolean => {
    if (adminCategories.includes(category)) {
      return false;
    }
    const updatedCategories = [...adminCategories, category];
    setAdminCategories(updatedCategories);
    localStorage.setItem('adminCategories', JSON.stringify(updatedCategories));
    return true;
  };

  const removeCategory = (category: string): boolean => {
    // Check if any tracks or electives are using this category
    const categoryInUse = tracks.some(t => t.category === category) || 
                          electives.some(e => e.category === category);
    if (categoryInUse) {
      return false; // Cannot remove category that's in use
    }
    const updatedCategories = adminCategories.filter(c => c !== category);
    setAdminCategories(updatedCategories);
    localStorage.setItem('adminCategories', JSON.stringify(updatedCategories));
    return true;
  };

  const addElectiveFeedback = (feedback: Omit<ElectiveFeedbackForm, 'id'>) => {
    const newFeedback: ElectiveFeedbackForm = {
      ...feedback,
      id: Date.now().toString()
    };
    setElectiveFeedbacks(prev => [...prev, newFeedback]);
    localStorage.setItem('electiveFeedbacks', JSON.stringify([...electiveFeedbacks, newFeedback]));
  };

  const getFutureElectives = (currentElectiveId: string): Elective[] => {
    const currentElective = electives.find(e => e.id === currentElectiveId);
    if (!currentElective || !currentElective.futureOpportunities) return [];
    
    return electives.filter(e => currentElective.futureOpportunities?.includes(e.id));
  };

  const exportDataAsExcel = () => {
    import('xlsx').then((XLSX) => {
      // Prepare data for Excel export
      const electiveData = electives.map(e => ({
        'Elective Name': e.name,
        'Code': e.code || 'No code',
        'Semester': e.semester,
        'Track': e.track,
        'Department': e.department,
        'Category': e.category,
        'Elective Category': e.electiveCategory,
        'Credits': e.credits,
        'Description': e.description,
        'Prerequisites': e.prerequisites?.length || 0,
        'Selection Deadline': e.selectionDeadline ? new Date(e.selectionDeadline).toLocaleDateString() : 'No deadline'
      }));

      const studentElectiveData = studentElectives.map(se => {
        const elective = electives.find(e => e.id === se.electiveId);
        return {
          'Roll Number': se.rollNumber || 'Not Available',
          'Student ID': se.studentId,
          'Student Name': se.studentName || 'Unknown',
          'Elective Name': elective?.name || 'Unknown',
          'Code': elective?.code || 'Unknown',
          'Semester': se.semester,
          'Track': se.track,
          'Department': elective?.department || 'Unknown',
          'Credits': elective?.credits || 0,
          'Enrolled Date': se.enrolledAt ? new Date(se.enrolledAt).toLocaleDateString() : 'Unknown'
        };
      });

      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new();
      
      // Add electives sheet
      const electiveWs = XLSX.utils.json_to_sheet(electiveData);
      XLSX.utils.book_append_sheet(wb, electiveWs, 'Electives');
      
      // Add student selections sheet
      const studentWs = XLSX.utils.json_to_sheet(studentElectiveData);
      XLSX.utils.book_append_sheet(wb, studentWs, 'Student Selections');

      // Download file
      XLSX.writeFile(wb, `elective_data_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  };

  const exportDataAsPDF = () => {
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        
        // Title
        doc.setFontSize(20);
        doc.text('Elective Selection Report', 20, 20);
        
        // Date
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
        
        // Student Selections Table
        doc.setFontSize(16);
        doc.text('Student Elective Selections', 20, 50);
        
        const studentTableData = studentElectives.map(se => {
          const elective = electives.find(e => e.id === se.electiveId);
          return [
            se.rollNumber || 'N/A',
            se.studentId,
            se.studentName || 'Unknown',
            elective?.name || 'Unknown',
            elective?.code || 'Unknown',
            se.semester.toString(),
            se.track,
            elective?.department || 'Unknown',
            (elective?.credits || 0).toString(),
            se.enrolledAt ? new Date(se.enrolledAt).toLocaleDateString() : se.dateSelected
          ];
        });

        doc.autoTable({
          head: [['Roll No.', 'Student ID', 'Student Name', 'Elective Name', 'Code', 'Semester', 'Track', 'Department', 'Credits', 'Date']],
          body: studentTableData,
          startY: 60,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 98, 255] }
        });

        // Electives Summary
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(16);
        doc.text('Electives Summary', 20, finalY);
        
        const electiveTableData = electives.map(e => [
          e.name,
          e.code,
          e.semester.toString(),
          e.track,
          e.department,
          e.electiveCategory,
          e.credits.toString()
        ]);

        doc.autoTable({
          head: [['Name', 'Code', 'Semester', 'Track', 'Department', 'Category', 'Credits']],
          body: electiveTableData,
          startY: finalY + 10,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [34, 197, 94] }
        });

        // Save the PDF
        doc.save(`elective_report_${new Date().toISOString().split('T')[0]}.pdf`);
      });
    });
  };

  const exportDataAsCSV = (dataType: 'students' | 'electives' | 'student-electives'): void => {
    let csvContent = '';
    let filename = '';

    switch (dataType) {
      case 'students':
        csvContent = 'ID,Name,Roll Number,Email,Department,Semester,Year of Study\n';
        csvContent += students.map(s => 
          `${s.id},"${s.name}","${s.rollNumber}","${s.email}","${s.department}",${s.semester},${s.yearOfStudy}`
        ).join('\n');
        filename = `students_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'electives':
        csvContent = 'ID,Name,Code,Credits,Department,Semester,Category,Track,Description\n';
        csvContent += electives.map(e => 
          `${e.id},"${e.name}","${e.code || 'No code'}",${e.credits},"${e.department}",${e.semester},"${e.category}","${e.track}","${e.description}"`
        ).join('\n');
        filename = `electives_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'student-electives':
        csvContent = 'Student ID,Student Name,Roll Number,Elective ID,Elective Name,Semester,Credits\n';
        csvContent += studentElectives.map(se => {
          const student = students.find(s => s.id === se.studentId);
          const elective = electives.find(e => e.id === se.electiveId);
          return `${se.studentId},"${student?.name || 'Unknown'}","${student?.rollNumber || 'Unknown'}",${se.electiveId},"${elective?.name || 'Unknown'}",${se.semester},${elective?.credits || 0}`;
        }).join('\n');
        filename = `student_electives_${new Date().toISOString().split('T')[0]}.csv`;
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportDataAsTXT = (dataType: 'students' | 'electives' | 'student-electives'): void => {
    let txtContent = '';
    let filename = '';

    switch (dataType) {
      case 'students':
        txtContent = 'STUDENTS REPORT\n';
        txtContent += '===============\n\n';
        students.forEach(s => {
          txtContent += `Name: ${s.name}\n`;
          txtContent += `Roll Number: ${s.rollNumber}\n`;
          txtContent += `Email: ${s.email}\n`;
          txtContent += `Department: ${s.department}\n`;
          txtContent += `Semester: ${s.semester}\n`;
          txtContent += `Year of Study: ${s.yearOfStudy}\n`;
          txtContent += '---\n';
        });
        filename = `students_${new Date().toISOString().split('T')[0]}.txt`;
        break;
        
      case 'electives':
        txtContent = 'ELECTIVES REPORT\n';
        txtContent += '================\n\n';
        electives.forEach(e => {
          txtContent += `Name: ${e.name}\n`;
          txtContent += `Code: ${e.code || 'No code'}\n`;
          txtContent += `Credits: ${e.credits}\n`;
          txtContent += `Department: ${e.department}\n`;
          txtContent += `Semester: ${e.semester}\n`;
          txtContent += `Category: ${e.category}\n`;
          txtContent += `Track: ${e.track}\n`;
          txtContent += `Description: ${e.description}\n`;
          txtContent += '---\n';
        });
        filename = `electives_${new Date().toISOString().split('T')[0]}.txt`;
        break;
        
      case 'student-electives':
        txtContent = 'STUDENT ELECTIVES REPORT\n';
        txtContent += '========================\n\n';
        studentElectives.forEach(se => {
          const student = students.find(s => s.id === se.studentId);
          const elective = electives.find(e => e.id === se.electiveId);
          txtContent += `Student: ${student?.name || 'Unknown'} (${student?.rollNumber || 'Unknown'})\n`;
          txtContent += `Elective: ${elective?.name || 'Unknown'} (${elective?.code || 'Unknown'})\n`;
          txtContent += `Semester: ${se.semester}\n`;
          txtContent += `Credits: ${elective?.credits || 0}\n`;
          txtContent += '---\n';
        });
        filename = `student_electives_${new Date().toISOString().split('T')[0]}.txt`;
        break;
    }

    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getElectiveRecommendation = (
    studentId: string, 
    userPreferences: { interests: string[]; careerGoals: string; difficulty: string }
  ): Elective[] => {
    const studentElectiveHistory = getStudentElectives(studentId);
    const completedElectiveIds = studentElectiveHistory.map(se => se.electiveId);
    
    return electives
      .filter(e => !completedElectiveIds.includes(e.id))
      .sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        
        // Score based on interests (Track matching)
        if (userPreferences.interests.includes(a.track)) scoreA += 3;
        if (userPreferences.interests.includes(b.track)) scoreB += 3;
        
        // Score based on career goals (simple keyword matching)
        if (a.description.toLowerCase().includes(userPreferences.careerGoals.toLowerCase())) scoreA += 2;
        if (b.description.toLowerCase().includes(userPreferences.careerGoals.toLowerCase())) scoreB += 2;
        
        // Score based on difficulty preference
        if (userPreferences.difficulty === 'easy' && a.category === 'Humanities') scoreA += 1;
        if (userPreferences.difficulty === 'easy' && b.category === 'Humanities') scoreB += 1;
        if (userPreferences.difficulty === 'challenging' && a.category === 'Departmental') scoreA += 1;
        if (userPreferences.difficulty === 'challenging' && b.category === 'Departmental') scoreB += 1;
        
        return scoreB - scoreA; // Higher score first
      })
      .slice(0, 5); // Return top 5 recommendations
  };

  // Alert notification functions
  const createAlert = (alert: Omit<AlertNotification, 'id' | 'createdAt'>): void => {
    const newAlert: AlertNotification = {
      ...alert,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    const updatedAlerts = [...alertNotifications, newAlert];
    setAlertNotifications(updatedAlerts);
    localStorage.setItem('alertNotifications', JSON.stringify(updatedAlerts));
  };

  const getActiveAlerts = (department?: string, semester?: number): AlertNotification[] => {
    return alertNotifications.filter(alert => {
      if (department && alert.targetDepartment && alert.targetDepartment !== department) {
        return false;
      }
      if (semester && alert.targetSemester && alert.targetSemester !== semester) {
        return false;
      }
      return true;
    });
  };

  const deleteAlert = (alertId: string): void => {
    const updatedAlerts = alertNotifications.filter(alert => alert.id !== alertId);
    setAlertNotifications(updatedAlerts);
    localStorage.setItem('alertNotifications', JSON.stringify(updatedAlerts));
  };

  // Feedback template functions
  const createFeedbackTemplate = (template: Omit<FeedbackTemplate, 'id' | 'createdAt'>): void => {
    const newTemplate: FeedbackTemplate = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    const updatedTemplates = [...feedbackTemplates, newTemplate];
    setFeedbackTemplates(updatedTemplates);
    localStorage.setItem('feedbackTemplates', JSON.stringify(updatedTemplates));
  };

  const updateFeedbackTemplate = (templateId: string, updates: Partial<FeedbackTemplate>): void => {
    const updatedTemplates = feedbackTemplates.map(template =>
      template.id === templateId ? { ...template, ...updates } : template
    );
    setFeedbackTemplates(updatedTemplates);
    localStorage.setItem('feedbackTemplates', JSON.stringify(updatedTemplates));
  };

  const deleteFeedbackTemplate = (templateId: string): void => {
    const updatedTemplates = feedbackTemplates.filter(template => template.id !== templateId);
    setFeedbackTemplates(updatedTemplates);
    localStorage.setItem('feedbackTemplates', JSON.stringify(updatedTemplates));
  };

  const getActiveFeedbackTemplates = (category?: string): FeedbackTemplate[] => {
    return feedbackTemplates.filter(template => {
      if (!template.isActive) return false;
      if (category && template.targetCategory && template.targetCategory !== category) {
        return false;
      }
      return true;
    });
  };

  // Feedback response functions
  const submitFeedbackResponse = (response: Omit<FeedbackResponse, 'id' | 'submittedAt'>): void => {
    const newResponse: FeedbackResponse = {
      ...response,
      id: Date.now().toString(),
      submittedAt: new Date()
    };
    
    const updatedResponses = [...feedbackResponses, newResponse];
    setFeedbackResponses(updatedResponses);
    localStorage.setItem('feedbackResponses', JSON.stringify(updatedResponses));
  };

  const getFeedbackResponses = (templateId?: string, studentId?: string): FeedbackResponse[] => {
    return feedbackResponses.filter(response => {
      if (templateId && response.templateId !== templateId) return false;
      if (studentId && response.studentId !== studentId) return false;
      return true;
    });
  };

  const getStudentSubmittedTemplates = (studentId: string): string[] => {
    return feedbackResponses
      .filter(response => response.studentId === studentId)
      .map(response => response.templateId);
  };

  const deleteFeedbackResponse = (responseId: string): void => {
    const updatedResponses = feedbackResponses.filter(response => response.id !== responseId);
    setFeedbackResponses(updatedResponses);
    localStorage.setItem('feedbackResponses', JSON.stringify(updatedResponses));
  };

  // Get current enrollment count for an elective
  const getElectiveEnrollmentCount = (electiveId: string): number => {
    return studentElectives.filter(se => se.electiveId === electiveId).length;
  };

  // Check if an elective is available for enrollment
  const isElectiveAvailable = (electiveId: string): { available: boolean; reason?: string } => {
    const elective = electives.find(e => e.id === electiveId);
    if (!elective) return { available: false, reason: 'Elective not found' };

    const currentEnrollment = getElectiveEnrollmentCount(electiveId);
    
    if (elective.maxEnrollment && currentEnrollment >= elective.maxEnrollment) {
      return { available: false, reason: 'Maximum enrollment reached' };
    }

    return { available: true };
  };

  // Syllabus management functions
  const uploadSyllabus = async (electiveId: string, file: File, description: string): Promise<boolean> => {
    try {
      // Simulate file upload (in real app, upload to server/cloud storage)
      const fileUrl = URL.createObjectURL(file);
      const newSyllabus: Syllabus = {
        id: Date.now().toString(),
        electiveId,
        title: `${file.name} - Syllabus`,
        description,
        pdfUrl: fileUrl,
        pdfFileName: file.name,
        uploadedBy: 'admin', // In real app, get from auth context
        uploadedAt: new Date(),
        academicYear: '2024-25',
        semester: new Date().getMonth() >= 6 ? 1 : 2, // Simple logic
        version: 1,
        isActive: true
      };

      // Deactivate previous versions
      const updatedSyllabi = syllabi.map(s => 
        s.electiveId === electiveId ? { ...s, isActive: false } : s
      );
      
      const finalSyllabi = [...updatedSyllabi, newSyllabus];
      setSyllabi(finalSyllabi);
      localStorage.setItem('syllabi', JSON.stringify(finalSyllabi));
      return true;
    } catch (error) {
      console.error('Error uploading syllabus:', error);
      return false;
    }
  };

  const getSyllabus = (electiveId: string): Syllabus | null => {
    return syllabi.find(s => s.electiveId === electiveId && s.isActive) || null;
  };

  const getAllSyllabi = (): Syllabus[] => {
    return syllabi.filter(s => s.isActive);
  };

  const updateSyllabus = async (syllabusId: string, updates: Partial<Syllabus>): Promise<boolean> => {
    try {
      const updatedSyllabi = syllabi.map(s => 
        s.id === syllabusId ? { ...s, ...updates } : s
      );
      setSyllabi(updatedSyllabi);
      localStorage.setItem('syllabi', JSON.stringify(updatedSyllabi));
      return true;
    } catch (error) {
      console.error('Error updating syllabus:', error);
      return false;
    }
  };

  const deleteSyllabus = async (syllabusId: string): Promise<boolean> => {
    try {
      const updatedSyllabi = syllabi.filter(s => s.id !== syllabusId);
      setSyllabi(updatedSyllabi);
      localStorage.setItem('syllabi', JSON.stringify(updatedSyllabi));
      return true;
    } catch (error) {
      console.error('Error deleting syllabus:', error);
      return false;
    }
  };

  const refreshElectives = async (): Promise<boolean> => {
    try {
      const refreshedElectives = await fetchElectives();
      if (refreshedElectives.length >= 0) {
        setElectives(refreshedElectives);
        localStorage.setItem('electives', JSON.stringify(refreshedElectives));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing electives:', error);
      return false;
    }
  };

  const refreshUsers = async (): Promise<boolean> => {
    try {
      const refreshedUsers = await fetchUsers();
      if (refreshedUsers.length >= 0) {
        // Update localStorage since users don't have React state
        localStorage.setItem('users', JSON.stringify(refreshedUsers));
        
        // Update students state if we have it
        const studentsData = refreshedUsers
          .filter((user: any) => user.role === 'student')
          .map((user: any) => ({
            id: user._id || user.id,
            name: user.name,
            rollNumber: user.rollNumber || user.rollNo,
            email: user.email,
            department: user.department,
            semester: user.semester,
            section: user.section
          }));
        setStudents(studentsData);
        localStorage.setItem('students', JSON.stringify(studentsData));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing users:', error);
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      // Delete user via API
      const response = await fetch(`${getApiBaseUrl()}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Refresh users data to update the local state
        await refreshUsers();
        return true;
      } else {
        console.error('Failed to delete user:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  return (
    <DataContext.Provider value={{
      electives,
      tracks,
      students,
      studentElectives,
      electiveFeedbacks,
      addElective,
      updateElective,
      deleteElective,
      removeElective,
      submitFeedback,
      refreshElectives,
      refreshUsers,
      deleteUser,
      selectElective,
      getStudentElectives,
      getRecommendations,
      getElectivesByDepartment,
      getTracksByDepartment,
      getTracksByCategory,
      getElectivesByCategory,
      getElectivesByCategoryAndDepartment,
      setElectiveDeadline,
      getElectiveDeadline,
      isElectiveSelectionOpen,
      addElectiveFeedback,
      getFutureElectives,
      exportDataAsExcel,
      exportDataAsPDF,
      exportDataAsCSV,
      exportDataAsTXT,
      getElectiveRecommendation,
      getAvailableDepartments,
      getAvailableSections,
      getAvailableSemesters,
      getElectiveEnrollmentCount,
      isElectiveAvailable,
      addDepartment,
      removeDepartment,
      addSection,
      removeSection,
      addSemester,
      removeSemester,
      // Track management functions
      addTrack,
      updateTrack,
      removeTrack,
      getAvailableCategories,
      addCategory,
      removeCategory,
      // Alert system functions
      createAlert,
      getActiveAlerts,
      deleteAlert,
      // Feedback template functions
      createFeedbackTemplate,
      updateFeedbackTemplate,
      deleteFeedbackTemplate,
      getActiveFeedbackTemplates,
      // Feedback response functions
      submitFeedbackResponse,
      getFeedbackResponses,
      getStudentSubmittedTemplates,
      deleteFeedbackResponse,
      // Syllabus management functions
      uploadSyllabus,
      getSyllabus,
      getAllSyllabi,
      updateSyllabus,
      deleteSyllabus,
    }}>
      {children}
    </DataContext.Provider>
  );
};
