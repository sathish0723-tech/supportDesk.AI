# ⚠️ URGENT: Fix MongoDB Authentication

## Current Error
```
bad auth : authentication failed
```

## Quick Fix Steps (5 minutes)

### Step 1: Go to MongoDB Atlas
👉 **Open**: https://cloud.mongodb.com/v2#/security/database/users

### Step 2: Check/Create Database User

**If user `sathish23` exists:**
1. Click on `sathish23`
2. Click **Edit** or **Reset Password**
3. Set password to: `sathish23` (or create a new one)
4. Make sure role is: **Read and write to any database**
5. Click **Update User**

**If user doesn't exist:**
1. Click **Add New Database User**
2. Username: `sathish23`
3. Password: `sathish23` (or your preferred password)
4. Role: **Read and write to any database**
5. Click **Add User**

### Step 3: Get Connection String
1. Go to: https://cloud.mongodb.com/v2#/clusters
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Add `/users` at the end

**Example:**
```
mongodb+srv://sathish23:sathish23@cluster0.owiirvv.mongodb.net/users
```

### Step 4: Update .env.local

Your current `.env.local` has:
```
MONGODB_URI=mongodb+srv://sathish23:sathish23@cluster0.owiirvv.mongodb.net/
```

**Update it to:**
```
MONGODB_URI=mongodb+srv://sathish23:sathish23@cluster0.owiirvv.mongodb.net/users
```

**OR if you changed the password:**
```
MONGODB_URI=mongodb+srv://sathish23:YOUR_NEW_PASSWORD@cluster0.owiirvv.mongodb.net/users
```

### Step 5: Restart Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

## ⚠️ Important Notes

1. **If password has special characters** (like `@`, `#`, `$`, etc.), you MUST URL-encode them:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`

2. **Make sure IP is whitelisted** (if you haven't already):
   - Go to: https://cloud.mongodb.com/v2#/security/network/whitelist
   - Add `0.0.0.0/0` (for development) or your specific IP

3. **Test connection**:
   - Visit: http://localhost:3000/api/debug/db-test
   - Should show success message

## Still Not Working?

1. **Double-check username and password** in MongoDB Atlas
2. **Verify the cluster name** matches in the connection string
3. **Check if user has correct permissions** (Read and write to any database)
4. **Try creating a new database user** with a simple password (no special chars)

