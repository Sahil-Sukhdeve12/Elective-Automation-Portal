// API Base URL
const API_BASE_URL = '/api';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  role: 'student' | 'admin';
  department?: string;
  semester?: number;
  isNewUser?: boolean;
  preferences?: {
    interests: string[];
    careerGoals: string;
    difficulty: 'easy' | 'balanced' | 'challenging';
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  rollNumber?: string;
  role: 'student' | 'admin';
  department?: string;
  semester?: number;
}

export interface ElectiveData {
  name: string;
  code: string;
  semester: number;
  track: string;
  description: string;
  credits: number;
  prerequisites?: string[];
  department: string;
  category: 'Departmental' | 'Humanities' | 'Open';
  electiveCategory: 'Elective';
  image?: string;
  selectionDeadline?: string;
}

export interface Elective extends ElectiveData {
  id: string;
  enrolledCount?: number;
  maxEnrollment?: number;
}

export interface StudentElectiveSelection {
  id: string;
  studentId: string;
  electiveId: string;
  semester: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// API Response types
interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
}

interface AuthResponse extends ApiResponse {
  token: string;
  user: User;
}

// Error handler
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new ApiError(response.status, errorData.message || 'An error occurred');
  }
  
  return response.json();
};

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Auth API
export const authApi = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse<AuthResponse>(response);
    
    // Store token in localStorage
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
    
    return result;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse<AuthResponse>(response);
    
    // Store token in localStorage
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
    
    return result;
  },

  async getProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse<User>(response);
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    return handleResponse<User>(response);
  },

  logout() {
    localStorage.removeItem('token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  }
};

// Electives API
export const electivesApi = {
  async getElectives(): Promise<Elective[]> {
    const response = await fetch(`${API_BASE_URL}/electives`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Elective[]>(response);
  },

  async getElectiveById(id: string): Promise<Elective> {
    const response = await fetch(`${API_BASE_URL}/electives/${id}`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Elective>(response);
  },

  async createElective(data: ElectiveData): Promise<Elective> {
    const response = await fetch(`${API_BASE_URL}/electives`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    return handleResponse<Elective>(response);
  },

  async updateElective(id: string, data: Partial<ElectiveData>): Promise<Elective> {
    const response = await fetch(`${API_BASE_URL}/electives/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    return handleResponse<Elective>(response);
  },

  async deleteElective(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/electives/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    await handleResponse(response);
  },

  async getStudentSelections(): Promise<StudentElectiveSelection[]> {
    const response = await fetch(`${API_BASE_URL}/electives/my-selections`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse<StudentElectiveSelection[]>(response);
  },

  async selectElective(electiveId: string): Promise<StudentElectiveSelection> {
    const response = await fetch(`${API_BASE_URL}/electives/select`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ electiveId }),
    });
    
    return handleResponse<StudentElectiveSelection>(response);
  },

  async unselectElective(selectionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/electives/unselect/${selectionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    await handleResponse(response);
  }
};

// Export the ApiError for error handling
export { ApiError };
