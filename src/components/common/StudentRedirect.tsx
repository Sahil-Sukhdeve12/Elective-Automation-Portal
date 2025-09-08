import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const StudentRedirect: React.FC = () => {
  const { user, markUserAsExperienced } = useAuth();
  const { getStudentElectives } = useData();
  const hasMarkedRef = useRef(false);

  useEffect(() => {
    // Mark user as experienced when they access the app (only once)
    if (user?.isNewUser && !hasMarkedRef.current) {
      hasMarkedRef.current = true;
      markUserAsExperienced();
    }
  }, [user?.isNewUser, markUserAsExperienced]);

  if (!user || user.role !== 'student') {
    return <Navigate to="/login" replace />;
  }

  // Check if user has any selected electives
  const studentElectives = getStudentElectives(user.id);
  const hasSelectedElectives = studentElectives && studentElectives.length > 0;

  // If user is new or has no selected electives, redirect to electives page
  if (user.isNewUser || !hasSelectedElectives) {
    return <Navigate to="/electives" replace />;
  }

  // If user has selected electives, redirect to progress page
  return <Navigate to="/progress" replace />;
};

export default StudentRedirect;
