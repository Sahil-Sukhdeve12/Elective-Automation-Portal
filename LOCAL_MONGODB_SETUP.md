# 💻 Local MongoDB Installation for Windows

## Option 1: MongoDB Community Server (Recommended)

### Download:
1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - Version: 7.0.x (latest)
   - Platform: Windows
   - Package: MSI

### Install:
1. Run the downloaded .msi file
2. Choose "Complete" installation
3. **IMPORTANT**: Check "Install MongoDB as a Service"
4. **IMPORTANT**: Check "Install MongoDB Compass" (GUI tool)
5. Click Install

### Start MongoDB:
After installation, open PowerShell as Administrator and run:
```
net start MongoDB
```

### Verify Installation:
```
mongod --version
```

## Option 2: MongoDB with Chocolatey (If you have Chocolatey)

```
choco install mongodb
```

## Option 3: Use Docker (If you have Docker Desktop)

```
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## After Installation - Test Connection:

1. Keep your current .env file as is:
```
MONGODB_URI=mongodb://localhost:27017/elective-selection
```

2. Test the connection:
```
npm run seed
```

3. If successful, you'll see "Connected to MongoDB"

---

## 🚀 Quick Alternative: Use MongoDB Online Free

If you still want to try MongoDB Atlas, here's the direct link to the free tier:
https://www.mongodb.com/pricing

Look for **"M0 Cluster"** which is **"Free Forever"**
