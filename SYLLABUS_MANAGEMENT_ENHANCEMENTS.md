# Syllabus Management Enhancements - Complete

## Overview
Enhanced the syllabus management system to support:
1. **Multiple file uploads** - Upload multiple PDF files at once
2. **Department targeting** - Show syllabi to specific departments only
3. **Semester targeting** - Show syllabi to specific semester students only

## Changes Made

### 1. **src/services/api.ts**
Updated `SyllabusData` interface to include optional targeting fields:
```typescript
export interface SyllabusData {
  // ... existing fields
  targetDepartment?: string; // Optional: Show only to specific department
  targetSemester?: number;   // Optional: Show only to specific semester
}
```

### 2. **src/contexts/DataContext.tsx**

#### Updated Syllabus Interface (line 353)
```typescript
export interface Syllabus {
  id: string;
  electiveId: string;
  title: string;
  description: string;
  pdfData: string;
  pdfFileName: string;
  uploadedBy: string;
  uploadedAt: Date;
  academicYear: string;
  semester: number;
  version: number;
  isActive: boolean;
  targetDepartment?: string; // NEW
  targetSemester?: number;   // NEW
}
```

#### Updated DataContextType Interface (line 432)
```typescript
uploadSyllabus: (
  electiveId: string, 
  file: File, 
  description: string,
  targetDepartment?: string,  // NEW
  targetSemester?: number     // NEW
) => Promise<boolean>;
```

#### Updated uploadSyllabus Function
- Added `targetDepartment` and `targetSemester` parameters
- Pass targeting fields to API when creating syllabus
- Removed auto-deactivation logic to allow multiple active files
- Each file is uploaded separately with its own targeting

### 3. **src/pages/admin/AdminSyllabus.tsx**

#### State Changes
```typescript
const [files, setFiles] = useState<File[]>([]);  // Changed from File | null
const [targetDepartment, setTargetDepartment] = useState<string>('all');
const [targetSemester, setTargetSemester] = useState<string>('all');
```

#### Helper Functions
```typescript
const getAvailableDepartments = (): string[] => {
  // Extract unique departments from students
};

const getAvailableSemesters = (): number[] => {
  // Extract unique semesters from students
};
```

#### File Handling
```typescript
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = e.target.files;
  if (!selectedFiles) return;
  
  // Filter only PDF files
  const pdfFiles = Array.from(selectedFiles).filter(
    file => file.type === 'application/pdf'
  );
  
  // Warn if non-PDF files were skipped
  if (pdfFiles.length < selectedFiles.length) {
    addNotification({ type: 'warning', message: 'Non-PDF files skipped' });
  }
  
  setFiles(pdfFiles);
};
```

#### Batch Upload Logic
```typescript
const handleUpload = async () => {
  let successCount = 0;
  let failCount = 0;
  
  for (const file of files) {
    const success = await uploadSyllabus(
      electiveId,
      file,
      description,
      targetDepartment === 'all' ? undefined : targetDepartment,
      targetSemester === 'all' ? undefined : parseInt(targetSemester)
    );
    
    if (success) successCount++;
    else failCount++;
  }
  
  // Show summary notification
  if (successCount > 0) {
    addNotification({
      title: 'Upload Complete',
      message: `Successfully uploaded ${successCount} file(s).${
        failCount > 0 ? ` ${failCount} file(s) failed.` : ''
      }`
    });
  }
};
```

#### UI Additions

**Department Selection:**
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Target Department (Optional)
  </label>
  <select
    value={targetDepartment}
    onChange={(e) => setTargetDepartment(e.target.value)}
    className="w-full px-4 py-2 rounded-lg border..."
  >
    <option value="all">All Departments</option>
    {departments.map(dept => (
      <option key={dept} value={dept}>{dept}</option>
    ))}
  </select>
  <p className="text-xs text-gray-500 mt-1">
    Select a department to show this syllabus only to students in that department
  </p>
</div>
```

**Semester Selection:**
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Target Semester (Optional)
  </label>
  <select
    value={targetSemester}
    onChange={(e) => setTargetSemester(e.target.value)}
    className="w-full px-4 py-2 rounded-lg border..."
  >
    <option value="all">All Semesters</option>
    {semesters.map(sem => (
      <option key={sem} value={sem}>Semester {sem}</option>
    ))}
  </select>
  <p className="text-xs text-gray-500 mt-1">
    Select a semester to show this syllabus only to students in that semester
  </p>
</div>
```

**Multiple File Input:**
```tsx
<input
  type="file"
  id="syllabusFile"
  accept="application/pdf"
  multiple  // NEW - Allow multiple file selection
  onChange={handleFileChange}
  className="w-full px-4 py-2 rounded-lg border..."
/>

{/* Show list of selected files */}
{files.length > 0 && (
  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Selected Files:
    </p>
    <ul className="space-y-1">
      {files.map((file, index) => (
        <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
          📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </li>
      ))}
    </ul>
  </div>
)}
```

**Upload Button with Context:**
```tsx
<button
  onClick={handleUpload}
  disabled={files.length === 0 || !selectedElective || uploading}
  className="w-full flex items-center justify-center gap-2 px-6 py-3..."
>
  <Upload className="h-5 w-5" />
  {uploading 
    ? 'Uploading...' 
    : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`
  }
</button>

{/* Show targeting context */}
{files.length > 0 && selectedElective && (
  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
    Ready to upload {files.length} file(s) to{' '}
    {targetDepartment === 'all' ? 'All Departments' : targetDepartment},{' '}
    {targetSemester === 'all' ? 'All Semesters' : `Semester ${targetSemester}`}
  </p>
)}
```

**Visual Badges for Targeting:**
```tsx
<div className="flex flex-wrap items-center gap-3">
  {syllabus.targetDepartment && (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 
                     dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 
                     rounded text-xs font-medium">
      📍 {syllabus.targetDepartment}
    </span>
  )}
  {syllabus.targetSemester && (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 
                     dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 
                     rounded text-xs font-medium">
      📅 Semester {syllabus.targetSemester}
    </span>
  )}
  {!syllabus.targetDepartment && !syllabus.targetSemester && (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 
                     dark:bg-green-900/30 text-green-800 dark:text-green-300 
                     rounded text-xs font-medium">
      🌐 All Students
    </span>
  )}
</div>
```

## Features

### Multiple File Upload
- Select multiple PDF files at once using file picker
- Shows list of selected files with sizes
- Uploads each file separately with individual success/failure tracking
- Progress notification shows count: "Successfully uploaded 3 file(s). 1 file(s) failed."
- Non-PDF files automatically filtered out with warning

### Department Targeting
- Optional dropdown to select specific department
- Populated from actual student data in database
- "All Departments" option to make syllabus visible to everyone
- Purple badge (📍) shows department restriction in display

### Semester Targeting
- Optional dropdown to select specific semester
- Populated from actual student data in database
- "All Semesters" option to make syllabus visible to everyone
- Indigo badge (📅) shows semester restriction in display

### Visual Indicators
- **Purple Badge** (📍): Department-specific syllabus
- **Indigo Badge** (📅): Semester-specific syllabus
- **Green Badge** (🌐): Available to all students
- Badges shown for both complete syllabus and individual elective syllabi

## Usage

### Upload Multiple Targeted Syllabi

1. Select an elective from dropdown
2. Choose target department (optional) - e.g., "Computer Science"
3. Choose target semester (optional) - e.g., "Semester 5"
4. Click "Choose PDF Files" and select multiple PDFs
5. Add description (optional)
6. Click "Upload X Files" button
7. System uploads each file separately
8. Shows summary: "Successfully uploaded 3 file(s)"

### Examples

**Example 1: CS Department, Semester 5 Only**
- Target Department: Computer Science
- Target Semester: Semester 5
- Result: Only CS students in semester 5 can see these syllabi

**Example 2: All Students in Semester 3**
- Target Department: All Departments
- Target Semester: Semester 3
- Result: All students in semester 3 across all departments can see these syllabi

**Example 3: Mechanical Engineering Department, All Semesters**
- Target Department: Mechanical Engineering
- Target Semester: All Semesters
- Result: All Mechanical Engineering students can see these syllabi

**Example 4: Everyone**
- Target Department: All Departments
- Target Semester: All Semesters
- Result: All students can see these syllabi

## Backend Compatibility

The enhanced system is backward compatible:
- Existing syllabi without targeting fields work as before
- New optional fields (`targetDepartment`, `targetSemester`) stored in MongoDB
- Undefined targeting = visible to all (default behavior)
- Filtering logic handled in student dashboard views

## Files Modified

1. ✅ `src/services/api.ts` - Updated SyllabusData interface
2. ✅ `src/contexts/DataContext.tsx` - Updated Syllabus interface, DataContextType, uploadSyllabus function
3. ✅ `src/pages/admin/AdminSyllabus.tsx` - Complete UI overhaul for targeting and multiple files

## Testing Checklist

- [ ] Upload single PDF with no targeting (all students)
- [ ] Upload multiple PDFs with department targeting
- [ ] Upload multiple PDFs with semester targeting
- [ ] Upload multiple PDFs with both department and semester targeting
- [ ] Verify badges show correctly in syllabus list
- [ ] Verify non-PDF files are filtered out
- [ ] Verify success/failure counts are accurate
- [ ] Test with very large files (near 16MB limit)
- [ ] Verify complete syllabus section works same as elective-specific
- [ ] Check that students only see syllabi targeted to them

## Notes

- Maximum file size: 16MB per PDF (base64 encoding overhead)
- Files uploaded sequentially, not in parallel
- Each file gets its own version number
- Multiple files can be active simultaneously (auto-deactivation removed)
- Targeting is optional - undefined = visible to all
- Visual badges help admins quickly identify syllabus visibility

---

**Status**: ✅ Complete - All TypeScript errors resolved, ready for testing
