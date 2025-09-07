# 🚀 Quick MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account
1. Go to: https://cloud.mongodb.com
2. Click "Try Free"
3. Sign up with your email
4. Verify your email address

## Step 2: Create a Cluster
1. Choose "Create a deployment"
2. Select "M0 Sandbox" (Free tier)
3. Choose a cloud provider and region (closest to you)
4. Name your cluster (e.g., "elective-system")
5. Click "Create"

## Step 3: Create Database User
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username and password (remember these!)
5. Set privileges to "Read and write to any database"
6. Click "Add User"

## Step 4: Configure Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Or add your current IP address
5. Click "Confirm"

## Step 5: Get Connection String
1. Go to "Clusters" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. It looks like: mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/

## Step 6: Update Your .env File
Replace your MONGODB_URI in .env with:
```
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/elective-selection?retryWrites=true&w=majority
```

## Step 7: Test Connection
Run: npm run seed

If successful, you'll see "Connected to MongoDB" and sample data will be created.

---
⚡ **This is the fastest way to get started!**
✅ No local installation required
✅ Free tier available
✅ Automatic backups and scaling
