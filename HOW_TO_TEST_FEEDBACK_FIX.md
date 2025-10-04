# How to Test Feedback Template Database Integration

## Prerequisites
✅ Backend server running on port 5000
✅ Frontend server running on port 5173
✅ MongoDB Atlas connected

## Test Scenario 1: Admin Creates Template

### Steps:
1. Open browser and go to `http://localhost:5173`
2. Login as **admin** (use admin credentials)
3. Navigate to **Admin Dashboard** → **Feedback Management**
4. Click **"Create New Template"** button
5. Fill in template details:
   - Title: "End of Semester Feedback"
   - Description: "Please provide feedback about your elective"
   - Add questions (multiple choice, rating, text, yes/no)
   - Set target filters (optional): category, department, semester
6. Click **"Create Template"**

### Expected Results:
✅ Template appears in the list immediately
✅ Console shows: `✅ Feedback template created successfully: [template_id]`
✅ Template saved to MongoDB `feedbacktemplates` collection

### Verify in MongoDB:
```javascript
// In MongoDB Compass or Atlas
db.feedbacktemplates.find({})
```

---

## Test Scenario 2: Student Sees Template (Cross-User Visibility)

### Steps:
1. Open a **different browser** or **incognito window**
2. Go to `http://localhost:5173`
3. Login as **student** (use student credentials)
4. Navigate to **Student Dashboard** → **Feedback**

### Expected Results:
✅ Student sees the template created by admin
✅ Template appears in available feedback forms
✅ Console shows: `✅ Loaded feedback templates from backend: 1`

---

## Test Scenario 3: Student Submits Feedback

### Steps:
1. As student, click on the template "End of Semester Feedback"
2. Fill out all questions
3. Click **"Submit Feedback"**

### Expected Results:
✅ Feedback submitted successfully
✅ Console shows: `✅ Feedback response submitted successfully: [response_id]`
✅ Template marked as "Already Submitted" (cannot submit again)
✅ Response saved to MongoDB `feedbackresponses` collection

### Verify in MongoDB:
```javascript
// In MongoDB Compass or Atlas
db.feedbackresponses.find({})
```

---

## Test Scenario 4: Duplicate Submission Prevention

### Steps:
1. As the same student, try to submit feedback for the same template again
2. Click submit

### Expected Results:
✅ Error message appears: "You have already submitted feedback for this template"
✅ Duplicate submission prevented
✅ Database maintains only one response per student per template

---

## Test Scenario 5: Admin Views Responses

### Steps:
1. Login as **admin**
2. Navigate to **Admin Dashboard** → **Feedback Management**
3. Click on **"View Responses"** for the template
4. Review all student submissions

### Expected Results:
✅ All student responses displayed
✅ Shows student name, department, semester, section
✅ Shows all answers to each question
✅ Can filter by template

---

## Test Scenario 6: Template Persistence After Browser Clear

### Steps:
1. As admin or student, view available templates
2. **Clear browser cache and localStorage** (Ctrl+Shift+Delete)
3. Refresh the page
4. Login again

### Expected Results:
✅ All templates still visible (loaded from database, not localStorage)
✅ Templates not lost after cache clear
✅ Console shows: `✅ Loaded feedback templates from backend: [count]`

---

## Test Scenario 7: Cross-Device Access

### Steps:
1. Create template on **Device A** (desktop)
2. Login as student on **Device B** (laptop/mobile)
3. Check available templates

### Expected Results:
✅ Student sees template on different device
✅ Template accessible from any device with internet
✅ No device-specific localStorage limitations

---

## Test Scenario 8: Admin Updates Template

### Steps:
1. Login as **admin**
2. Navigate to **Feedback Management**
3. Find the template and click **"Edit"**
4. Modify:
   - Title: "Updated: End of Semester Feedback"
   - Add/remove questions
   - Change target filters
5. Click **"Save Changes"**

### Expected Results:
✅ Template updated immediately
✅ Console shows: `✅ Feedback template updated successfully: [template_id]`
✅ All users see updated version
✅ Changes reflected in MongoDB

---

## Test Scenario 9: Admin Deletes Template

### Steps:
1. Login as **admin**
2. Navigate to **Feedback Management**
3. Find template and click **"Delete"**
4. Confirm deletion

### Expected Results:
✅ Template removed from list
✅ Console shows: `✅ Feedback template deleted successfully: [template_id]`
✅ Template removed from MongoDB
✅ Students no longer see the template

---

## Test Scenario 10: Offline Behavior

### Steps:
1. Login and load templates with internet
2. **Disconnect from internet** (disable WiFi or network)
3. Refresh the page
4. Login again

### Expected Results:
✅ Templates still visible (loaded from localStorage cache)
✅ Console shows: `📦 Loaded feedback templates from localStorage: [count]`
✅ Offline fallback working

### Reconnect:
1. **Reconnect to internet**
2. Refresh page
3. Login

### Expected Results:
✅ Templates sync from database
✅ Console shows: `✅ Loaded feedback templates from backend: [count]`
✅ Latest templates from MongoDB displayed

---

## Debugging

### Check Console Logs

**Successful Template Fetch**:
```
Fetching feedback templates from API...
✅ Feedback templates fetched successfully: 1
✅ Loaded feedback templates from backend: 1
```

**Failed Fetch (Offline)**:
```
Fetching feedback templates from API...
Error fetching feedback templates: TypeError: Failed to fetch
📦 Loaded feedback templates from localStorage: 1
```

**Template Creation**:
```
Creating feedback template in database...
✅ Feedback template created successfully: 67abc123def456789
```

**Feedback Submission**:
```
Submitting feedback response to database...
✅ Feedback response submitted successfully: 67xyz987ghi654321
```

### Check MongoDB

**View Templates**:
```javascript
db.feedbacktemplates.find().pretty()
```

**View Responses**:
```javascript
db.feedbackresponses.find().pretty()
```

**Count Templates**:
```javascript
db.feedbacktemplates.countDocuments()
```

**Count Responses**:
```javascript
db.feedbackresponses.countDocuments()
```

**Find Template by ID**:
```javascript
db.feedbacktemplates.findOne({ _id: ObjectId("67abc123def456789") })
```

**Find Responses by Template**:
```javascript
db.feedbackresponses.find({ templateId: ObjectId("67abc123def456789") })
```

### Check API Endpoints

**Test GET Templates**:
```bash
curl http://localhost:5000/api/feedback/templates
```

**Test POST Template (with auth token)**:
```bash
curl -X POST http://localhost:5000/api/feedback/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "title": "Test Template",
    "description": "Test description",
    "questions": [
      {
        "id": "q1",
        "question": "How was the course?",
        "type": "rating",
        "required": true
      }
    ],
    "createdBy": "admin@example.com"
  }'
```

**Test GET Responses (admin only)**:
```bash
curl http://localhost:5000/api/feedback/responses \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

---

## Common Issues

### Issue: Templates not appearing for students

**Solution**:
1. Check console for errors
2. Verify backend is running on port 5000
3. Check MongoDB connection
4. Verify templates exist: `db.feedbacktemplates.find()`

### Issue: Duplicate submission allowed

**Solution**:
1. Check unique index exists: `db.feedbackresponses.getIndexes()`
2. Should see index on `{ templateId: 1, studentId: 1 }`
3. If missing, restart backend server (creates index automatically)

### Issue: Responses not saving

**Solution**:
1. Check student is authenticated (has valid token)
2. Verify template ID is correct
3. Check MongoDB connection
4. Review console for error messages

### Issue: Template CRUD operations not working

**Solution**:
1. Verify admin user is authenticated
2. Check user role is 'admin' in database
3. Verify auth token is valid
4. Check backend logs for authentication errors

---

## Success Criteria

✅ Admin creates template → Saved to MongoDB  
✅ Student on different device sees template  
✅ Student submits feedback → Saved to MongoDB  
✅ Duplicate submission prevented  
✅ Admin views all responses  
✅ Template update/delete works  
✅ Templates persist after browser cache clear  
✅ Offline fallback to localStorage works  
✅ Cross-device synchronization working  

---

**Status**: Ready for testing! Both servers running, database integration complete.
