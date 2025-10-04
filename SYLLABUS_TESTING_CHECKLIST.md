# 🧪 Syllabus Viewing - Testing Checklist

## Pre-Test Setup

### For Admin:
- [ ] Login to admin account
- [ ] Go to Dashboard → Syllabus Management tab
- [ ] Upload at least one test PDF (any small PDF file)
- [ ] Assign it to an elective or upload as "Complete Syllabus"
- [ ] Ensure "Active" checkbox is checked
- [ ] Note the file name and which elective it's for

### For Testing:
- [ ] Open browser (Chrome or Edge recommended)
- [ ] Press F12 to open Developer Tools
- [ ] Click on "Console" tab
- [ ] Keep console open during all tests

---

## Test Scenario 1: View Complete Syllabus

**Steps:**
1. Login as student
2. Navigate to "Syllabus Management" page
3. Look for "Complete Syllabus Document" section
4. Click the **"View Document"** button

**Expected Results:**
- [ ] Console shows: `🔍 Viewing syllabus for elective: COMPLETE_SYLLABUS`
- [ ] Console shows: `📄 Syllabus data retrieved: { found: true, hasData: true ... }`
- [ ] Console shows: `✅ PDF opened in new window`
- [ ] New browser tab/window opens
- [ ] PDF displays correctly in new tab

**If Failed:**
- [ ] Check console for error messages
- [ ] Verify "Complete Syllabus" was uploaded in admin panel
- [ ] Check if popup blocker is preventing window

---

## Test Scenario 2: View Individual Elective Syllabus

**Steps:**
1. Scroll to "Elective Syllabi" section
2. Find any elective card with syllabus
3. Click the purple **"View PDF"** button

**Expected Results:**
- [ ] Console shows: `🔍 Viewing syllabus for elective: [elective_id]`
- [ ] Console shows syllabus data with `found: true`
- [ ] New window opens with PDF
- [ ] PDF is readable and displays correctly

**If Failed:**
- [ ] Note the elective name/ID from console
- [ ] Check admin panel if syllabus exists for that elective
- [ ] Verify `isActive: true` in console logs

---

## Test Scenario 3: Download Syllabus

**Steps:**
1. Find any syllabus (complete or individual)
2. Click the green **"Download"** button

**Expected Results:**
- [ ] PDF file downloads to computer
- [ ] File has correct name (matches uploaded file)
- [ ] Downloaded PDF opens successfully in PDF reader

---

## Test Scenario 4: Check Data Loading

**Steps:**
1. Refresh the page
2. Immediately check console

**Expected Console Output:**
```
📚 Fetching syllabi from MongoDB API...
✅ Syllabi fetched successfully from MongoDB: [number]
📄 Syllabi details: [array of syllabi info]
📚 Getting all syllabi: [number] active out of [number] total
```

**Verify:**
- [ ] Number of syllabi > 0
- [ ] Each syllabus has `hasData: true`
- [ ] Each syllabus has `dataLength > 0`
- [ ] Each syllabus has `isActive: true`

**If Failed:**
- [ ] Check if backend server is running
- [ ] Test API endpoint: `http://localhost:5000/api/syllabi`
- [ ] Check MongoDB connection

---

## Test Scenario 5: Popup Blocker Test

**Steps:**
1. Enable popup blocker in browser
2. Try to view a syllabus
3. Check for alert message

**Expected Results:**
- [ ] Alert appears: "Please allow popups for this site to view the syllabus"
- [ ] Console shows: `❌ Failed to open new window (popup blocker?)`
- [ ] User is informed to enable popups

---

## Test Scenario 6: Missing Syllabus

**Steps:**
1. In admin panel, note an elective WITHOUT a syllabus
2. Login as student
3. Check if that elective appears in syllabus list

**Expected Results:**
- [ ] Elective without syllabus does NOT appear in list
- [ ] Only electives with uploaded syllabi are shown
- [ ] No broken cards or empty displays

---

## Test Scenario 7: Browser Compatibility

**Test in Multiple Browsers:**

### Chrome/Edge:
- [ ] PDF viewing works
- [ ] Download works
- [ ] Console logs appear correctly

### Firefox:
- [ ] PDF viewing works (may require popup permission)
- [ ] Download works
- [ ] No JavaScript errors in console

### Safari (if available):
- [ ] PDF viewing works
- [ ] Download works
- [ ] Allow popups when prompted

---

## Test Scenario 8: Mobile Browser (Optional)

**On Mobile Device:**
- [ ] Syllabus page loads correctly
- [ ] Cards are responsive
- [ ] View button works (may open PDF in browser)
- [ ] Download button works
- [ ] PDF is viewable on mobile

---

## Debugging Checklist

### If PDF Won't Open:

- [ ] Check console for error messages
- [ ] Verify `hasData: true` in console
- [ ] Verify `dataLength > 0` in console
- [ ] Check if popup blocker is enabled
- [ ] Try different browser
- [ ] Use Download instead of View

### If "Syllabus not available" Alert:

- [ ] Check console: `found: false`
- [ ] Verify syllabus was uploaded for that elective
- [ ] Check `isActive: true` in admin panel
- [ ] Refresh page and try again

### If No Syllabi Show Up:

- [ ] Check console for MongoDB fetch errors
- [ ] Verify backend server is running
- [ ] Test API: `http://localhost:5000/api/syllabi`
- [ ] Check MongoDB connection string
- [ ] Verify syllabi were uploaded in admin panel

### If Blank Page Opens:

- [ ] Check PDF data format in console
- [ ] Verify data starts with `data:application/pdf;base64,`
- [ ] Check `dataLength` is reasonable (> 10000)
- [ ] Re-upload PDF from admin panel
- [ ] Try downloading instead

---

## Console Log Examples

### ✅ GOOD (Everything Working):
```
📚 Fetching syllabi from MongoDB API...
✅ Syllabi fetched successfully from MongoDB: 3
📄 Syllabi details: [
  {
    id: "678f...",
    electiveId: "COMPLETE_SYLLABUS",
    fileName: "Complete_Syllabus_2025.pdf",
    hasData: true,
    dataLength: 256789,
    isActive: true
  }
]

[User clicks View]

🔍 Viewing syllabus for elective: COMPLETE_SYLLABUS
   Available syllabi count: 3
   All elective IDs: ["COMPLETE_SYLLABUS", "elec_ml", "elec_ds"]
   Found syllabus: true (Complete_Syllabus_2025.pdf)
   
📄 Syllabus data retrieved: {
  found: true,
  hasData: true,
  fileName: "Complete_Syllabus_2025.pdf",
  dataLength: 256789
}
✅ PDF opened in new window
```

### ❌ BAD (No Syllabi):
```
📚 Fetching syllabi from MongoDB API...
❌ Error fetching syllabi from MongoDB: Failed to fetch
⚠️ Using syllabi from localStorage fallback: 0
⚠️ No syllabi found in localStorage either
```
**Action**: Check backend server, verify MongoDB connection

### ⚠️ WARNING (Syllabus Missing):
```
🔍 Viewing syllabus for elective: elec_unknown
   Available syllabi count: 3
   All elective IDs: ["COMPLETE_SYLLABUS", "elec_ml", "elec_ds"]
   Found syllabus: false Not found

⚠️ No syllabus data available
```
**Action**: Upload syllabus for that elective in admin panel

---

## Success Criteria

All tests PASS when:

- [ ] **At least 1 syllabus uploads successfully** (Admin panel)
- [ ] **Syllabi appear in student view** (Count > 0)
- [ ] **View button opens PDF in new window** (No errors)
- [ ] **Download button downloads PDF** (File opens correctly)
- [ ] **Console shows detailed logs** (No errors in red)
- [ ] **Multiple browsers work** (Chrome, Firefox, Edge)
- [ ] **Error messages are clear** (User knows what to do)

---

## Report Issues

If tests fail, provide:

1. **Browser & Version**: Chrome 120, Firefox 115, etc.
2. **Console Output**: Copy all console messages
3. **Steps to Reproduce**: What you clicked
4. **Expected vs Actual**: What should happen vs what happened
5. **Screenshots**: Error messages, console, blank pages

---

## Quick Reference

| Feature | Location | What to Test |
|---------|----------|--------------|
| Upload Syllabus | Admin → Dashboard → Syllabus Tab | Upload PDF, set active |
| View Complete Syllabus | Student → Syllabus Mgmt | Blue "View Document" button |
| View Elective Syllabus | Student → Syllabus Mgmt | Purple "View PDF" button |
| Download Syllabus | Student → Syllabus Mgmt | Green "Download" button |
| Console Logs | Browser DevTools (F12) | Check for errors |

---

## Estimated Testing Time

- **Quick Test** (Basic functionality): 5 minutes
- **Full Test** (All scenarios): 15-20 minutes
- **Multi-Browser Test**: 30 minutes
- **Mobile Test**: 10 minutes

---

**Remember**: 
- Keep console open during all tests
- Take screenshots of errors
- Test both View and Download
- Try multiple syllabi if available
- Use Chrome/Edge for best experience
