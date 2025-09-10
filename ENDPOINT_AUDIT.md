# API Endpoints Audit for Elective Selection System

## Current Endpoints Found:
- GET /api/health ✅
- POST /api/auth/login ✅
- POST /api/auth/register ✅
- GET /api/auth/profile ✅ (with auth)
- PUT /api/auth/profile ✅ (with auth)
- GET /api/users ❌ (no auth protection)
- GET /api/electives ❌ (no auth protection)
- POST /api/electives ❌ (no auth protection)
- PUT /api/electives/:id ✅
- DELETE /api/electives/:id ✅

## Missing Critical Endpoints:
- POST /api/student-electives (select elective)
- GET /api/student-electives/:studentId (get student's electives)
- DELETE /api/student-electives/:id (remove elective selection)
- POST /api/elective-feedback (submit feedback)
- GET /api/elective-feedback/:electiveId (get feedback)
- GET /api/analytics/dashboard (admin analytics)

## Authentication Issues:
- Elective endpoints need proper auth protection
- Admin-only endpoints need role checking
- Student endpoints need student role verification

## Schema Issues to Check:
- StudentElective model missing
- ElectiveFeedback model missing
- Proper relationships between models
