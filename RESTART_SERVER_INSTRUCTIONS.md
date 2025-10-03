# How to Restart the Server to Apply Changes

## The Problem

The server is running **OLD code** that still requires authentication for syllabi endpoints. The new code (which makes syllabi public) is saved in the file but not loaded yet.

## Solution: Restart the Server

### Option 1: Using Terminal (Recommended)

1. **Find the terminal running the server** (look for the terminal with output like "Authentication server running on port 5000")

2. **Stop the server**:
   - Press `Ctrl + C` in that terminal

3. **Start the server again**:
   ```bash
   npm run server
   ```

4. **Refresh your browser** - the 401 error should be gone!

---

### Option 2: Kill Process and Restart

If you can't find the server terminal:

1. **Kill the process**:
   ```bash
   taskkill /F /PID 4504
   ```
   *(Replace 4504 with the actual PID if different)*

2. **Start fresh**:
   ```bash
   npm run server
   ```

3. **Refresh browser**

---

### Option 3: Use VS Code Tasks (If Available)

1. Press `Ctrl + Shift + P`
2. Type "Tasks: Run Task"
3. Select "Restart Server" (if configured)

---

## How to Verify It's Working

After restarting, check the **server console output** when you load the app:

### ✅ Success (New Code):
```
🌐 GET /api/syllabi - 2025-10-03T16:06:45.622Z
❌ No authorization header
✅ Retrieved 0 active syllabi    <-- Should see this!
```

### ❌ Still Old Code:
```
🌐 GET /api/syllabi - 2025-10-03T16:06:45.622Z
🔑 Authorization header present
❌ Access token required         <-- Should NOT see this
```

---

## Why This Happened

Node.js loads the `simple-server.cjs` file **once** when it starts. Changes to the file don't take effect until you restart the server.

**Changes I made**:
- Removed `authenticateToken` middleware from `GET /api/syllabi`
- Removed `authenticateToken` middleware from `GET /api/syllabi/elective/:id`

**These changes are SAVED** but not LOADED until you restart!

---

## After Restart - Expected Behavior

✅ No more 401 errors  
✅ Syllabi load without authentication  
✅ Students can view syllabi in roadmap  
✅ Console shows: `✅ Retrieved X active syllabi`  
✅ Everything works!

---

## Still Getting Errors?

If you still see 401 errors after restarting:

1. **Clear browser cache**: `Ctrl + Shift + Delete`
2. **Hard refresh**: `Ctrl + F5`
3. **Check the file** to verify changes are there:
   - Open `simple-server.cjs`
   - Search for `app.get('/api/syllabi'`
   - Should see: `app.get('/api/syllabi', async (req, res) => {`
   - Should NOT see: `app.get('/api/syllabi', authenticateToken, async (req, res) => {`

---

## Quick Command Summary

```bash
# Stop server: Ctrl+C in server terminal

# Start server:
npm run server

# Or kill and restart:
taskkill /F /PID 4504
npm run server
```

**That's it!** Just restart the server and it will work! 🚀
