# Elective Course Code Null/Empty Handling Fix

## Problem

When adding electives without course codes, the system was storing `null` values which caused duplicate key errors when trying to add another elective without a course code. The error message stated "elective already exists" even though the electives were different.

### Root Cause

The MongoDB schema has a unique index on the `code` field with `sparse: true`. While `sparse: true` should allow multiple documents with `undefined` values, the issue was:

1. Empty strings, null strings (`"null"`), or undefined strings (`"undefined"`) were being saved as actual string values
2. These values were treated as duplicates by MongoDB's unique index
3. The system wasn't properly converting empty/null values to `undefined` before saving

## Solution

Updated the backend (`simple-server.cjs`) to properly handle empty, null, and undefined course codes:

### Changes Made

#### 1. POST `/api/electives` - Create Elective (Line ~967)

**Before:**
```javascript
code: code && code.trim() !== '' ? code.trim() : undefined,
```

**After:**
```javascript
code: code && code.trim() !== '' && code !== 'null' && code !== 'undefined' 
  ? code.trim() 
  : undefined,
```

**What it does:**
- Checks if code exists and is not empty string
- Also checks if code is not the string `"null"` or `"undefined"`
- If valid, trims and saves the code
- Otherwise, sets to `undefined` (which MongoDB sparse index allows multiple of)

#### 2. PUT `/api/electives/:id` - Update Elective (Line ~1053)

**Before:**
```javascript
Object.keys(req.body).forEach(key => {
  if (req.body[key] !== undefined) {
    // Special handling for deadline - empty string should clear it
    if (key === 'deadline' && req.body[key] === '') {
      updateData[key] = null;
    } else if (key === 'deadline' && req.body[key]) {
      updateData[key] = new Date(req.body[key]);
    } else {
      updateData[key] = req.body[key];
    }
  }
});
```

**After:**
```javascript
Object.keys(req.body).forEach(key => {
  if (req.body[key] !== undefined) {
    // Special handling for code - empty/null string should clear it
    if (key === 'code' && (req.body[key] === '' || req.body[key] === 'null' || 
        req.body[key] === 'undefined' || !req.body[key])) {
      updateData[key] = undefined;
    }
    // Special handling for deadline - empty string should clear it
    else if (key === 'deadline' && req.body[key] === '') {
      updateData[key] = null;
    } else if (key === 'deadline' && req.body[key]) {
      updateData[key] = new Date(req.body[key]);
    } else {
      updateData[key] = req.body[key];
    }
  }
});
```

**What it does:**
- Checks if the key being updated is `code`
- If code is empty, null, undefined, or falsy, sets to `undefined`
- Allows clearing the course code by sending empty string
- Ensures updates don't create duplicate key errors

#### 3. Enhanced Error Message (Line ~1010)

**Before:**
```javascript
if (error.code === 11000) {
  const field = Object.keys(error.keyPattern || {})[0] || 'field';
  const value = error.keyValue ? error.keyValue[field] : 'unknown';
  
  return res.status(400).json({ 
    success: false,
    error: `Duplicate ${field}`,
    message: `An elective with ${field} "${value}" already exists...`,
    details: error.message 
  });
}
```

**After:**
```javascript
if (error.code === 11000) {
  const field = Object.keys(error.keyPattern || {})[0] || 'field';
  const value = error.keyValue ? error.keyValue[field] : 'unknown';
  
  // Special message for course code duplicates
  if (field === 'code') {
    return res.status(400).json({ 
      success: false,
      error: `Duplicate course code`,
      message: `An elective with course code "${value}" already exists. 
                Please use a different course code or leave it empty.`,
      details: error.message 
    });
  }
  
  return res.status(400).json({ 
    success: false,
    error: `Duplicate ${field}`,
    message: `An elective with ${field} "${value}" already exists...`,
    details: error.message 
  });
}
```

**What it does:**
- Provides clearer error message for course code duplicates
- Suggests leaving the field empty as an alternative
- Helps users understand the issue better

## How It Works Now

### MongoDB Sparse Index
```javascript
code: { 
  type: String, 
  required: false,
  unique: true,
  sparse: true // Allows multiple documents with undefined values
}
```

The `sparse: true` option means:
- Only documents with a non-null `code` value are indexed
- Multiple documents can have `undefined` code values
- Documents with `undefined` code don't participate in the unique constraint

### Value Conversion Flow

**Frontend sends:**
- Empty string: `""`
- Null: `null`
- String "null": `"null"`
- Undefined: `undefined`

**Backend converts to:**
- Empty string `""` → `undefined`
- Null `null` → `undefined`
- String `"null"` → `undefined`
- String `"undefined"` → `undefined`
- Any other empty/falsy → `undefined`
- Valid string → trimmed string

**MongoDB stores:**
- `undefined` (not indexed, allows multiple)
- Valid course code (indexed, must be unique)

## Testing

### Test Case 1: Add Multiple Electives Without Course Code
1. Add Elective A without course code
2. Add Elective B without course code
3. Add Elective C without course code

**Expected:** All three electives created successfully ✅

### Test Case 2: Add Electives With and Without Course Code
1. Add Elective A with code "CS101"
2. Add Elective B without code
3. Add Elective C with code "CS102"
4. Add Elective D without code

**Expected:** All four electives created successfully ✅

### Test Case 3: Duplicate Course Code
1. Add Elective A with code "CS101"
2. Try to add Elective B with code "CS101"

**Expected:** Error message with suggestion to use different code or leave empty ❌

### Test Case 4: Update Elective to Remove Code
1. Add Elective A with code "CS101"
2. Update Elective A to remove code (send empty string)

**Expected:** Code removed successfully, elective updated ✅

### Test Case 5: Update Elective to Add Code
1. Add Elective A without code
2. Update Elective A to add code "CS101"

**Expected:** Code added successfully ✅

## Edge Cases Handled

1. ✅ Empty string course code
2. ✅ Null value course code
3. ✅ String "null" from frontend
4. ✅ String "undefined" from frontend
5. ✅ Whitespace-only course code (trimmed to empty, converted to undefined)
6. ✅ Updating from code to no code
7. ✅ Updating from no code to code
8. ✅ Multiple electives with no code

## Benefits

1. **Flexibility:** Admins can now add multiple electives without course codes
2. **Optional Field:** Course code is truly optional as intended
3. **Better UX:** Clear error messages guide users
4. **Data Integrity:** Unique course codes still enforced when provided
5. **Backward Compatible:** Existing electives with codes unaffected

## Files Modified

- ✅ `simple-server.cjs` - Backend API endpoints for elective management

## Database Schema

No schema changes required. The existing sparse index on `code` field already supports this behavior:

```javascript
const electiveSchema = new mongoose.Schema({
  // ... other fields
  code: { 
    type: String, 
    required: false,
    unique: true,
    sparse: true  // This is the key - allows multiple undefined values
  },
  // ... other fields
});
```

## Migration Notes

**No migration needed!** This is a fix that works with the existing schema.

However, if you have existing electives in the database with empty string (`""`) or string `"null"` as course codes, you may want to clean them up:

```javascript
// Optional cleanup script (run in MongoDB shell or admin tool)
db.electives.updateMany(
  { code: { $in: ["", "null", "undefined", null] } },
  { $unset: { code: "" } }
);
```

This will convert any empty/null codes to `undefined` in the database.

---

**Status:** ✅ Complete - Multiple electives without course codes now supported
