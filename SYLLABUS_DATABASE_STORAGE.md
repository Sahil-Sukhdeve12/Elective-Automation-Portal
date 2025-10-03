# Syllabus Database Storage Documentation

## Overview
**YES!** All syllabus files uploaded by admins are stored in the **MongoDB database**, not in local storage or file system. The PDFs are converted to Base64 encoding and stored directly in the database.

## Database Schema

### Collection: `syllabi`

```javascript
{
  electiveId: String,        // 'COMPLETE_SYLLABUS' or specific elective ID
  title: String,             // Title of the syllabus document
  description: String,       // Optional description
  pdfData: String,           // Base64 encoded PDF data (REQUIRED)
  pdfFileName: String,       // Original filename (e.g., "ML_Syllabus.pdf")
  uploadedBy: String,        // Admin user ID who uploaded
  uploadedAt: Date,          // Timestamp of upload (auto-generated)
  academicYear: String,      // e.g., "2024-2025"
  semester: Number,          // Semester number
  version: Number,           // Version number (default: 1)
  isActive: Boolean,         // Active status (default: true)
  timestamps: true           // Mongoose timestamps (createdAt, updatedAt)
}
```

### Indexes:
- `{ electiveId: 1, isActive: 1 }` - For fast lookup of active syllabi

## Storage Method: Base64 Encoding

### What is Base64?
Base64 is a binary-to-text encoding scheme that converts binary data (like PDF files) into ASCII string format. This allows binary files to be stored in text-based databases like MongoDB.

### Why Base64?
✅ **Database Storage**: Can store PDFs directly in MongoDB without file system
✅ **Portability**: Database contains everything - no external file dependencies
✅ **Simplicity**: No need for separate file server or cloud storage
✅ **Backup**: PDFs are backed up with database backups
✅ **No File Paths**: No broken file path references

### Limitations:
⚠️ **Size**: Base64 increases file size by ~33% (100KB PDF → 133KB Base64)
⚠️ **MongoDB Limit**: BSON document size limit is 16MB
⚠️ **Memory**: Large PDFs consume more database memory

## API Endpoints

### 1. Upload Syllabus (Admin Only)
**Endpoint**: `POST /api/syllabi`

**Authentication**: Admin token required

**Request Body**:
```json
{
  "electiveId": "COMPLETE_SYLLABUS" or "elective_id_here",
  "title": "Complete Syllabus Document",
  "description": "Comprehensive syllabus for all electives",
  "pdfData": "data:application/pdf;base64,JVBERi0xLjQKJeLjz9M...",
  "pdfFileName": "Complete_Syllabus_2024.pdf",
  "uploadedBy": "admin_user_id",
  "academicYear": "2024-2025",
  "semester": 5,
  "version": 1,
  "isActive": true
}
```

**Process**:
1. Validates admin role
2. Deactivates previous versions for same `electiveId`
3. Saves new syllabus to MongoDB
4. Returns saved syllabus data

**Response**:
```json
{
  "success": true,
  "message": "Syllabus uploaded successfully",
  "syllabus": {
    "id": "507f1f77bcf86cd799439011",
    "electiveId": "COMPLETE_SYLLABUS",
    "title": "Complete Syllabus Document",
    "pdfData": "data:application/pdf;base64,...",
    "pdfFileName": "Complete_Syllabus_2024.pdf",
    "uploadedAt": "2025-10-04T10:30:00.000Z",
    "version": 1,
    "isActive": true
  }
}
```

### 2. Get All Syllabi (Public)
**Endpoint**: `GET /api/syllabi`

**Authentication**: Not required (students can access)

**Query**: Returns all active syllabi sorted by upload date (newest first)

**Response**:
```json
{
  "syllabi": [
    {
      "id": "507f1f77bcf86cd799439011",
      "electiveId": "COMPLETE_SYLLABUS",
      "title": "Complete Syllabus Document",
      "pdfData": "data:application/pdf;base64,...",
      "pdfFileName": "Complete_Syllabus_2024.pdf",
      "uploadedAt": "2025-10-04T10:30:00.000Z",
      "version": 1
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "electiveId": "elec_123",
      "title": "Machine Learning Syllabus",
      "pdfData": "data:application/pdf;base64,...",
      "pdfFileName": "ML_Syllabus.pdf",
      "uploadedAt": "2025-10-03T14:20:00.000Z",
      "version": 1
    }
  ]
}
```

### 3. Get Syllabus for Specific Elective (Public)
**Endpoint**: `GET /api/syllabi/elective/:electiveId`

**Authentication**: Not required

**Example**: `GET /api/syllabi/elective/elec_123`

**Response**:
```json
{
  "syllabus": {
    "id": "507f1f77bcf86cd799439012",
    "electiveId": "elec_123",
    "title": "Machine Learning Syllabus",
    "pdfData": "data:application/pdf;base64,...",
    "pdfFileName": "ML_Syllabus.pdf",
    "uploadedAt": "2025-10-03T14:20:00.000Z"
  }
}
```

## Frontend Integration

### DataContext.tsx - Fetching Syllabi

```typescript
// Fetch all syllabi from database
const fetchSyllabi = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/syllabi`);
    const data = await response.json();
    
    if (data.syllabi) {
      return data.syllabi.map((s: any) => ({
        id: s.id,
        electiveId: s.electiveId,
        title: s.title,
        description: s.description,
        pdfData: s.pdfData,
        pdfFileName: s.pdfFileName,
        uploadedAt: new Date(s.uploadedAt),
        version: s.version
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching syllabi:', error);
    return [];
  }
};
```

### AdminSyllabus.tsx - Uploading Syllabus

```typescript
const handleUpload = async () => {
  // Convert PDF file to Base64
  const reader = new FileReader();
  reader.readAsDataURL(file);
  
  reader.onload = async () => {
    const base64Data = reader.result; // data:application/pdf;base64,...
    
    const response = await fetch(`${API_BASE_URL}/syllabi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        electiveId: electiveId,
        title: title,
        description: description,
        pdfData: base64Data,
        pdfFileName: file.name,
        uploadedBy: user.id
      })
    });
    
    const data = await response.json();
    // Syllabus now saved to MongoDB!
  };
};
```

### StudentRoadmap.tsx - Viewing Syllabi

```typescript
// View PDF from Base64 data stored in database
const handleViewSyllabus = (electiveId: string) => {
  const syllabus = getSyllabus(electiveId); // Gets from DataContext
  
  if (syllabus?.pdfData) {
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head><title>${syllabus.pdfFileName}</title></head>
        <body style="margin:0">
          <embed width="100%" height="100%" 
                 src="${syllabus.pdfData}" 
                 type="application/pdf" />
        </body>
      </html>
    `);
  }
};

// Download PDF
const handleDownload = (syllabus) => {
  const link = document.createElement('a');
  link.href = syllabus.pdfData; // Base64 data URL
  link.download = syllabus.pdfFileName;
  link.click();
};
```

## Data Flow

### Upload Flow:
```
1. Admin selects PDF file in browser
2. FileReader converts PDF to Base64 string
3. Frontend sends Base64 to POST /api/syllabi
4. Backend validates admin role
5. Backend deactivates old versions (if any)
6. Backend saves Base64 to MongoDB Syllabus collection
7. Students can immediately see it (no refresh needed if real-time)
```

### Retrieval Flow:
```
1. Student opens Roadmap page
2. DataContext fetches GET /api/syllabi
3. Backend queries MongoDB for active syllabi
4. Backend returns array with Base64 PDF data
5. Frontend displays in grid with View/Download buttons
6. Click View → Opens Base64 in new tab
7. Click Download → Creates download link from Base64
```

## Version Management

When admin uploads a new syllabus for same elective:

```javascript
// Deactivate previous versions
await Syllabus.updateMany(
  { electiveId: 'elec_123', isActive: true },
  { $set: { isActive: false } }
);

// Create new version
const newSyllabus = new Syllabus({
  electiveId: 'elec_123',
  version: 2,  // Increment version
  isActive: true
  // ... other fields
});
```

**Result**: Only the latest version is shown to students (isActive: true)

## Storage Location

### Database Details:
- **Database**: MongoDB (via Mongoose ODM)
- **Collection Name**: `syllabi`
- **Connection**: Defined in `simple-server.cjs`
- **Model**: `Syllabus` model

### NOT Stored:
❌ Local file system
❌ Public folder
❌ Cloud storage (AWS S3, Google Cloud, etc.)
❌ Browser localStorage
❌ Session storage

## Benefits of Database Storage

✅ **Centralized**: All data in one MongoDB database
✅ **Persistent**: Survives server restarts, deployments
✅ **Backed Up**: Included in database backups
✅ **Secure**: Access controlled via API authentication
✅ **Queryable**: Can search, filter, version control
✅ **Portable**: Easy to move/deploy (just database)
✅ **No File Management**: No file paths, permissions issues

## Considerations

### File Size Limits:
- **MongoDB BSON Limit**: 16MB per document
- **Base64 Overhead**: ~33% larger than original
- **Practical Limit**: ~12MB original PDF size
- **Recommendation**: Keep PDFs under 10MB

### Performance:
- **Query Speed**: Fast with proper indexes
- **Memory**: Large PDFs consume more RAM when loaded
- **Network**: Base64 data sent over HTTP (consider compression)

### Alternatives (Not Implemented):
- **GridFS**: For files > 16MB (MongoDB's file storage system)
- **Cloud Storage**: AWS S3, Google Cloud Storage
- **File System**: Local server storage with file paths

## Example Documents in Database

### Complete Syllabus:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "electiveId": "COMPLETE_SYLLABUS",
  "title": "Complete Elective Syllabus 2024-2025",
  "description": "Comprehensive syllabus for all departmental and open electives",
  "pdfData": "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MNCjI...",
  "pdfFileName": "Complete_Syllabus_2024_2025.pdf",
  "uploadedBy": "admin_user_507f191e810c19729de860ea",
  "uploadedAt": ISODate("2025-10-04T10:30:00.000Z"),
  "academicYear": "2024-2025",
  "version": 1,
  "isActive": true,
  "createdAt": ISODate("2025-10-04T10:30:00.000Z"),
  "updatedAt": ISODate("2025-10-04T10:30:00.000Z")
}
```

### Individual Elective Syllabus:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "electiveId": "elec_ml_basics_101",
  "title": "Machine Learning Basics - Syllabus",
  "description": "Introduction to ML algorithms and applications",
  "pdfData": "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MNCjI...",
  "pdfFileName": "ML_Basics_Syllabus.pdf",
  "uploadedBy": "admin_user_507f191e810c19729de860ea",
  "uploadedAt": ISODate("2025-10-03T14:20:00.000Z"),
  "semester": 5,
  "version": 1,
  "isActive": true,
  "createdAt": ISODate("2025-10-03T14:20:00.000Z"),
  "updatedAt": ISODate("2025-10-03T14:20:00.000Z")
}
```

## Summary

✅ **Yes, all syllabus files are stored in MongoDB database**
✅ **PDFs are converted to Base64 and stored as strings**
✅ **No external file storage or file system used**
✅ **Fully persistent and backed up with database**
✅ **Students can view and download directly from database**
✅ **Version control and active/inactive status managed**
✅ **Practical size limit: ~10-12MB per PDF**

---
**Date**: October 4, 2025  
**Status**: ✅ ACTIVE - All syllabus files stored in MongoDB database  
**Collection**: `syllabi`  
**Encoding**: Base64  
**Size Limit**: 16MB BSON document limit (~12MB original PDF)
