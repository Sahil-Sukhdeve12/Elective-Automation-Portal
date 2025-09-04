import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Elective {
  id: string;
  name: string;
  code: string;
  semester: number;
  domain: string;
  description: string;
  prerequisites?: string[];
  credits: number;
  department: string;
  category: 'Theory' | 'Practical';
  electiveCategory: 'Humanities' | 'Departmental' | 'Open Elective';
  infoImage?: string; // URL or base64 string for the info image
  selectionDeadline?: string; // ISO date string for deadline
  futureOptions?: string[]; // Array of elective IDs that become available after this
}

export interface Domain {
  id: string;
  name: string;
  description: string;
  color: string;
  suggestedElectives: string[];
  department: string;
}

export interface StudentElective {
  studentId: string;
  electiveId: string;
  semester: number;
  domain: string;
  completedAt: Date;
  feedback?: {
    rating: number;
    comment: string;
    submittedAt: Date;
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

interface DataContextType {
  electives: Elective[];
  domains: Domain[];
  studentElectives: StudentElective[];
  electiveFeedbacks: ElectiveFeedbackForm[];
  addElective: (elective: Omit<Elective, 'id'>) => void;
  updateElective: (id: string, elective: Partial<Elective>) => void;
  deleteElective: (id: string) => void;
  selectElective: (studentId: string, electiveId: string, semester: number) => void;
  getStudentElectives: (studentId: string) => StudentElective[];
  getRecommendations: (studentId: string, semester: number) => Elective[];
  getElectivesByDepartment: (department: string) => Elective[];
  getDomainsByDepartment: (department: string) => Domain[];
  getElectivesByCategory: (category: 'Humanities' | 'Departmental' | 'Open Elective') => Elective[];
  getElectivesByCategoryAndDepartment: (category: 'Humanities' | 'Departmental' | 'Open Elective', department: string) => Elective[];
  setElectiveDeadline: (electiveId: string, deadline: string) => void;
  getElectiveDeadline: (electiveId: string) => string | null;
  isElectiveSelectionOpen: (electiveId: string) => boolean;
  addElectiveFeedback: (feedback: Omit<ElectiveFeedbackForm, 'id'>) => void;
  getFutureElectives: (currentElectiveId: string) => Elective[];
  exportDataAsExcel: () => void;
  exportDataAsPDF: () => void;
  getElectiveRecommendation: (studentId: string, userPreferences: { interests: string[]; careerGoals: string; difficulty: string }) => Elective[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const initialDomains: Domain[] = [
  {
    id: '1',
    name: 'Artificial Intelligence',
    description: 'Machine Learning, Deep Learning, Neural Networks',
    color: 'bg-blue-500',
    suggestedElectives: ['1', '2', '3'],
    department: 'Computer Science & Engineering'
  },
  {
    id: '2',
    name: 'Cybersecurity',
    description: 'Network Security, Ethical Hacking, Cryptography',
    color: 'bg-red-500',
    suggestedElectives: ['4', '5', '6'],
    department: 'Computer Science & Engineering'
  },
  {
    id: '3',
    name: 'Data Science',
    description: 'Big Data, Analytics, Visualization',
    color: 'bg-green-500',
    suggestedElectives: ['7', '8', '9'],
    department: 'Computer Science & Engineering'
  },
  {
    id: '4',
    name: 'Web Development',
    description: 'Full Stack Development, UI/UX, Cloud Computing',
    color: 'bg-purple-500',
    suggestedElectives: ['10', '11', '12'],
    department: 'Computer Science & Engineering'
  },
  {
    id: '5',
    name: 'Digital Signal Processing',
    description: 'Signal Analysis, Filtering, Communications',
    color: 'bg-orange-500',
    suggestedElectives: ['13', '14', '15'],
    department: 'Electronics & Communication'
  },
  {
    id: '6',
    name: 'VLSI Design',
    description: 'Chip Design, Circuit Optimization, Layout',
    color: 'bg-indigo-500',
    suggestedElectives: ['16', '17', '18'],
    department: 'Electronics & Communication'
  }
];

const initialElectives: Elective[] = [
  // AI Domain - Computer Science & Engineering (Departmental Electives)
  {
    id: '1',
    name: 'Machine Learning Fundamentals',
    code: 'CS501',
    semester: 5,
    domain: 'Artificial Intelligence',
    description: 'Introduction to supervised and unsupervised learning algorithms',
    credits: 3,
    department: 'Computer Science & Engineering',
    category: 'Theory',
    electiveCategory: 'Departmental'
  },
  {
    id: '2',
    name: 'Deep Learning',
    code: 'CS502',
    semester: 6,
    domain: 'Artificial Intelligence',
    description: 'Neural networks, CNNs, RNNs and their applications',
    prerequisites: ['1'],
    credits: 3,
    department: 'Computer Science & Engineering',
    category: 'Practical',
    electiveCategory: 'Departmental'
  },
  {
    id: '3',
    name: 'Natural Language Processing',
    code: 'CS503',
    semester: 7,
    domain: 'Artificial Intelligence',
    description: 'Text processing, sentiment analysis, and language models',
    prerequisites: ['1'],
    credits: 3,
    department: 'Computer Science & Engineering',
    category: 'Theory',
    electiveCategory: 'Departmental'
  },
  // Cybersecurity Domain - Computer Science & Engineering (Departmental Electives)
  {
    id: '4',
    name: 'Network Security',
    code: 'CS504',
    semester: 5,
    domain: 'Cybersecurity',
    description: 'Firewalls, intrusion detection, and network protocols',
    credits: 3,
    department: 'Computer Science & Engineering',
    category: 'Theory',
    electiveCategory: 'Departmental'
  },
  {
    id: '5',
    name: 'Ethical Hacking',
    code: 'CS505',
    semester: 6,
    domain: 'Cybersecurity',
    description: 'Penetration testing, vulnerability assessment',
    prerequisites: ['4'],
    credits: 3,
    department: 'Computer Science & Engineering',
    category: 'Practical',
    electiveCategory: 'Departmental'
  },
  {
    id: '6',
    name: 'Cryptography',
    code: 'CS506',
    semester: 7,
    domain: 'Cybersecurity',
    description: 'Encryption algorithms, digital signatures, blockchain',
    credits: 3,
    department: 'Computer Science & Engineering',
    category: 'Theory',
    electiveCategory: 'Departmental'
  },
  // Data Science Domain - Computer Science & Engineering (Departmental Electives)
  {
    id: '7',
    name: 'Big Data Analytics',
    code: 'CS507',
    semester: 5,
    domain: 'Data Science',
    description: 'Hadoop, Spark, and distributed computing',
    credits: 3,
    department: 'Computer Science & Engineering',
    category: 'Practical',
    electiveCategory: 'Departmental'
  },
  {
    id: '8',
    name: 'Data Visualization',
    code: 'CS508',
    semester: 6,
    domain: 'Data Science',
    description: 'Interactive dashboards and visual storytelling',
    credits: 3,
    department: 'Computer Science & Engineering',
    category: 'Practical',
    electiveCategory: 'Departmental'
  },
  {
    id: '9',
    name: 'Statistical Learning',
    code: 'CS509',
    semester: 7,
    domain: 'Data Science',
    description: 'Statistical models and hypothesis testing',
    prerequisites: ['7'],
    credits: 3,
    department: 'Computer Science & Engineering',
    category: 'Theory',
    electiveCategory: 'Departmental'
  },
  // Web Development Domain - Computer Science & Engineering (Departmental Electives)
  {
    id: '10',
    name: 'Full Stack Development',
    code: 'CS510',
    semester: 5,
    domain: 'Web Development',
    description: 'MERN/MEAN stack development and deployment',
    credits: 3,
    department: 'Computer Science & Engineering',
    category: 'Practical',
    electiveCategory: 'Departmental'
  },
  {
    id: '11',
    name: 'Cloud Computing',
    code: 'CS511',
    semester: 6,
    domain: 'Web Development',
    description: 'AWS, Azure, and cloud architecture patterns',
    credits: 3,
    department: 'Computer Science & Engineering',
    category: 'Practical',
    electiveCategory: 'Departmental'
  },
  {
    id: '12',
    name: 'Mobile Development',
    code: 'CS512',
    semester: 7,
    domain: 'Web Development',
    description: 'React Native, Flutter, and cross-platform development',
    prerequisites: ['10'],
    credits: 3,
    department: 'Computer Science & Engineering',
    category: 'Practical',
    electiveCategory: 'Departmental'
  },
  // Digital Signal Processing Domain - Electronics & Communication (Departmental Electives)
  {
    id: '13',
    name: 'Advanced Signal Processing',
    code: 'EC501',
    semester: 5,
    domain: 'Digital Signal Processing',
    description: 'Digital filters, transforms, and signal analysis',
    credits: 3,
    department: 'Electronics & Communication',
    category: 'Theory',
    electiveCategory: 'Departmental'
  },
  {
    id: '14',
    name: 'Communication Systems',
    code: 'EC502',
    semester: 6,
    domain: 'Digital Signal Processing',
    description: 'Modulation, coding, and wireless communication',
    credits: 3,
    department: 'Electronics & Communication',
    category: 'Theory',
    electiveCategory: 'Departmental'
  },
  {
    id: '15',
    name: 'Image Processing',
    code: 'EC503',
    semester: 7,
    domain: 'Digital Signal Processing',
    description: 'Digital image enhancement and computer vision',
    prerequisites: ['13'],
    credits: 3,
    department: 'Electronics & Communication',
    category: 'Practical',
    electiveCategory: 'Departmental'
  },
  // VLSI Design Domain - Electronics & Communication (Departmental Electives)
  {
    id: '16',
    name: 'VLSI Circuit Design',
    code: 'EC504',
    semester: 5,
    domain: 'VLSI Design',
    description: 'CMOS circuit design and layout optimization',
    credits: 3,
    department: 'Electronics & Communication',
    category: 'Practical',
    electiveCategory: 'Departmental'
  },
  {
    id: '17',
    name: 'System-on-Chip Design',
    code: 'EC505',
    semester: 6,
    domain: 'VLSI Design',
    description: 'SoC architecture and design methodology',
    prerequisites: ['16'],
    credits: 3,
    department: 'Electronics & Communication',
    category: 'Practical',
    electiveCategory: 'Departmental'
  },
  {
    id: '18',
    name: 'FPGA Programming',
    code: 'EC506',
    semester: 7,
    domain: 'VLSI Design',
    description: 'HDL programming and FPGA implementation',
    credits: 3,
    department: 'Electronics & Communication',
    category: 'Practical',
    electiveCategory: 'Departmental'
  },
  // Humanities Electives
  {
    id: '19',
    name: 'Philosophy of Technology',
    code: 'HU501',
    semester: 5,
    domain: 'Philosophy',
    description: 'Exploring the relationship between technology and society',
    credits: 2,
    department: 'Humanities',
    category: 'Theory',
    electiveCategory: 'Humanities'
  },
  {
    id: '20',
    name: 'Technical Communication',
    code: 'HU502',
    semester: 6,
    domain: 'Communication',
    description: 'Advanced writing and presentation skills for engineers',
    credits: 2,
    department: 'Humanities',
    category: 'Practical',
    electiveCategory: 'Humanities'
  },
  {
    id: '21',
    name: 'Engineering Economics',
    code: 'HU503',
    semester: 7,
    domain: 'Economics',
    description: 'Economic principles applied to engineering decisions',
    credits: 3,
    department: 'Humanities',
    category: 'Theory',
    electiveCategory: 'Humanities'
  },
  {
    id: '22',
    name: 'Innovation Management',
    code: 'HU504',
    semester: 5,
    domain: 'Management',
    description: 'Managing innovation processes in technology companies',
    credits: 3,
    department: 'Humanities',
    category: 'Theory',
    electiveCategory: 'Humanities'
  },
  // Open Electives
  {
    id: '23',
    name: 'Digital Marketing',
    code: 'OE501',
    semester: 5,
    domain: 'Marketing',
    description: 'Online marketing strategies and social media management',
    credits: 3,
    department: 'Open',
    category: 'Practical',
    electiveCategory: 'Open Elective'
  },
  {
    id: '24',
    name: 'Financial Literacy',
    code: 'OE502',
    semester: 6,
    domain: 'Finance',
    description: 'Personal finance, investments, and financial planning',
    credits: 2,
    department: 'Open',
    category: 'Theory',
    electiveCategory: 'Open Elective'
  },
  {
    id: '25',
    name: 'Environmental Science',
    code: 'OE503',
    semester: 7,
    domain: 'Environmental Studies',
    description: 'Environmental issues and sustainable development',
    credits: 3,
    department: 'Open',
    category: 'Theory',
    electiveCategory: 'Open Elective'
  },
  {
    id: '26',
    name: 'Data Analytics for Business',
    code: 'OE504',
    semester: 5,
    domain: 'Business Analytics',
    description: 'Using data science techniques for business insights',
    credits: 3,
    department: 'Open',
    category: 'Practical',
    electiveCategory: 'Open Elective'
  },
  {
    id: '27',
    name: 'Entrepreneurship',
    code: 'OE505',
    semester: 6,
    domain: 'Business',
    description: 'Starting and managing technology startups',
    credits: 3,
    department: 'Open',
    category: 'Practical',
    electiveCategory: 'Open Elective'
  }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [electives, setElectives] = useState<Elective[]>([]);
  const [domains] = useState<Domain[]>(initialDomains);
  const [studentElectives, setStudentElectives] = useState<StudentElective[]>([]);
  const [electiveFeedbacks, setElectiveFeedbacks] = useState<ElectiveFeedbackForm[]>([]);

  useEffect(() => {
    // Initialize data from localStorage or use defaults
    const storedElectives = localStorage.getItem('electives');
    const storedStudentElectives = localStorage.getItem('studentElectives');
    const storedElectiveFeedbacks = localStorage.getItem('electiveFeedbacks');

    if (storedElectives) {
      setElectives(JSON.parse(storedElectives));
    } else {
      setElectives(initialElectives);
      localStorage.setItem('electives', JSON.stringify(initialElectives));
    }

    if (storedStudentElectives) {
      setStudentElectives(JSON.parse(storedStudentElectives));
    }

    if (storedElectiveFeedbacks) {
      setElectiveFeedbacks(JSON.parse(storedElectiveFeedbacks));
    }
  }, []);

  const addElective = (elective: Omit<Elective, 'id'>) => {
    const newElective = {
      ...elective,
      id: Date.now().toString()
    };
    const updatedElectives = [...electives, newElective];
    setElectives(updatedElectives);
    localStorage.setItem('electives', JSON.stringify(updatedElectives));
  };

  const updateElective = (id: string, updates: Partial<Elective>) => {
    const updatedElectives = electives.map(e => 
      e.id === id ? { ...e, ...updates } : e
    );
    setElectives(updatedElectives);
    localStorage.setItem('electives', JSON.stringify(updatedElectives));
  };

  const deleteElective = (id: string) => {
    const updatedElectives = electives.filter(e => e.id !== id);
    setElectives(updatedElectives);
    localStorage.setItem('electives', JSON.stringify(updatedElectives));
  };

  const selectElective = (studentId: string, electiveId: string, semester: number) => {
    const elective = electives.find(e => e.id === electiveId);
    if (!elective) return;

    const studentElective: StudentElective = {
      studentId,
      electiveId,
      semester,
      domain: elective.domain,
      completedAt: new Date()
    };

    const updatedStudentElectives = [...studentElectives, studentElective];
    setStudentElectives(updatedStudentElectives);
    localStorage.setItem('studentElectives', JSON.stringify(updatedStudentElectives));
  };

  const getStudentElectives = (studentId: string): StudentElective[] => {
    return studentElectives.filter(se => se.studentId === studentId);
  };

  const getRecommendations = (studentId: string, semester: number): Elective[] => {
    const userElectives = getStudentElectives(studentId);
    const completedDomains = userElectives.map(se => se.domain);
    const completedElectiveIds = userElectives.map(se => se.electiveId);
    
    // Get electives for current semester that haven't been taken
    return electives.filter(e => 
      e.semester === semester && 
      !completedElectiveIds.includes(e.id) &&
      (!e.prerequisites || e.prerequisites.every(prereq => completedElectiveIds.includes(prereq)))
    ).sort((a, b) => {
      // Prioritize electives in domains the student has already explored
      const aInProgress = completedDomains.includes(a.domain);
      const bInProgress = completedDomains.includes(b.domain);
      
      if (aInProgress && !bInProgress) return -1;
      if (!aInProgress && bInProgress) return 1;
      return 0;
    });
  };

  const getElectivesByDepartment = (department: string): Elective[] => {
    return electives.filter(e => e.department === department);
  };

  const getDomainsByDepartment = (department: string): Domain[] => {
    return domains.filter(d => d.department === department);
  };

  const getElectivesByCategory = (category: 'Humanities' | 'Departmental' | 'Open Elective'): Elective[] => {
    return electives.filter(e => e.electiveCategory === category);
  };

  const getElectivesByCategoryAndDepartment = (category: 'Humanities' | 'Departmental' | 'Open Elective', department: string): Elective[] => {
    return electives.filter(e => e.electiveCategory === category && (category !== 'Departmental' || e.department === department));
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
    if (!currentElective || !currentElective.futureOptions) return [];
    
    return electives.filter(e => currentElective.futureOptions?.includes(e.id));
  };

  const exportDataAsExcel = () => {
    import('xlsx').then((XLSX) => {
      // Prepare data for Excel export
      const electiveData = electives.map(e => ({
        'Elective Name': e.name,
        'Code': e.code,
        'Semester': e.semester,
        'Domain': e.domain,
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
          'Student ID': se.studentId,
          'Elective Name': elective?.name || 'Unknown',
          'Code': elective?.code || 'Unknown',
          'Semester': se.semester,
          'Domain': se.domain,
          'Department': elective?.department || 'Unknown',
          'Credits': elective?.credits || 0,
          'Completed Date': se.completedAt.toLocaleDateString()
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
            se.studentId,
            elective?.name || 'Unknown',
            elective?.code || 'Unknown',
            se.semester.toString(),
            se.domain,
            elective?.department || 'Unknown',
            (elective?.credits || 0).toString(),
            se.completedAt.toLocaleDateString()
          ];
        });

        doc.autoTable({
          head: [['Student ID', 'Elective Name', 'Code', 'Semester', 'Domain', 'Department', 'Credits', 'Date']],
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
          e.domain,
          e.department,
          e.electiveCategory,
          e.credits.toString()
        ]);

        doc.autoTable({
          head: [['Name', 'Code', 'Semester', 'Domain', 'Department', 'Category', 'Credits']],
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
        
        // Score based on interests (domain matching)
        if (userPreferences.interests.includes(a.domain)) scoreA += 3;
        if (userPreferences.interests.includes(b.domain)) scoreB += 3;
        
        // Score based on career goals (simple keyword matching)
        if (a.description.toLowerCase().includes(userPreferences.careerGoals.toLowerCase())) scoreA += 2;
        if (b.description.toLowerCase().includes(userPreferences.careerGoals.toLowerCase())) scoreB += 2;
        
        // Score based on difficulty preference
        if (userPreferences.difficulty === 'easy' && a.category === 'Theory') scoreA += 1;
        if (userPreferences.difficulty === 'easy' && b.category === 'Theory') scoreB += 1;
        if (userPreferences.difficulty === 'challenging' && a.category === 'Practical') scoreA += 1;
        if (userPreferences.difficulty === 'challenging' && b.category === 'Practical') scoreB += 1;
        
        return scoreB - scoreA; // Higher score first
      })
      .slice(0, 5); // Return top 5 recommendations
  };

  return (
    <DataContext.Provider value={{
      electives,
      domains,
      studentElectives,
      electiveFeedbacks,
      addElective,
      updateElective,
      deleteElective,
      selectElective,
      getStudentElectives,
      getRecommendations,
      getElectivesByDepartment,
      getDomainsByDepartment,
      getElectivesByCategory,
      getElectivesByCategoryAndDepartment,
      setElectiveDeadline,
      getElectiveDeadline,
      isElectiveSelectionOpen,
      addElectiveFeedback,
      getFutureElectives,
      exportDataAsExcel,
      exportDataAsPDF,
      getElectiveRecommendation,
    }}>
      {children}
    </DataContext.Provider>
  );
};