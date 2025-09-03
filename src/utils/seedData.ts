// Utility to seed initial data for demo purposes
export const seedInitialData = () => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  // Add demo users if none exist
  if (users.length === 0) {
    const demoUsers = [
      {
        id: 'student1',
        name: 'John Smith',
        email: 'student@example.com',
        password: 'password123',
        role: 'student',
        rollNo: '20CS101',
        department: 'Computer Science & Engineering',
        semester: 6,
        section: 'A',
        isNewUser: false
      },
      {
        id: 'student2',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: 'password123',
        role: 'student',
        rollNo: '20CS102',
        department: 'Computer Science & Engineering',
        semester: 5,
        section: 'B',
        isNewUser: true
      },
      {
        id: 'admin1',
        name: 'Dr. Admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        isNewUser: false
      }
    ];

    localStorage.setItem('users', JSON.stringify(demoUsers));

    // Add some demo student electives
    const demoStudentElectives = [
      {
        studentId: 'student1',
        electiveId: '1',
        semester: 5,
        domain: 'Artificial Intelligence',
        completedAt: new Date('2024-06-15')
      },
      {
        studentId: 'student1',
        electiveId: '4',
        semester: 6,
        domain: 'Cybersecurity',
        completedAt: new Date('2024-12-15')
      },
      {
        studentId: 'student2',
        electiveId: '7',
        semester: 5,
        domain: 'Data Science',
        completedAt: new Date('2024-06-15')
      }
    ];

    localStorage.setItem('studentElectives', JSON.stringify(demoStudentElectives));
  }
};

// Call this to initialize demo data
export const initializeDemoData = () => {
  if (typeof window !== 'undefined') {
    seedInitialData();
  }
};