# How to Fix MongoDB IP Whitelist Issue

## Problem
You're seeing this error:
```
Could not connect to any servers in your MongoDB Atlas cluster. 
One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## Solution: Whitelist Your IP Address

### Step 1: Get Your Current IP Address
1. Visit: https://whatismyipaddress.com/
2. Copy your **IPv4 Address** (looks like: `123.45.67.89`)

### Step 2: Add IP to MongoDB Atlas Whitelist

1. **Go to MongoDB Atlas**
   - Visit: https://cloud.mongodb.com/
   - Sign in to your account

2. **Navigate to Network Access**
   - Click on your **project** (if you have multiple)
   - In the left sidebar, click **Network Access** (or **Security** → **Network Access**)
   - Or go directly to: https://cloud.mongodb.com/v2#/security/network/whitelist

3. **Add Your IP Address**
   - Click the green **Add IP Address** button
   - You have two options:

   **Option A: Add Your Current IP (Recommended for Production)**
   - Click **Add Current IP Address** button (MongoDB will auto-detect it)
   - Or manually enter your IP: `123.45.67.89/32`
   - Click **Confirm**

   **Option B: Allow All IPs (For Development Only)**
   - Enter: `0.0.0.0/0`
   - ⚠️ **Warning**: This allows access from ANY IP address. Only use for development!
   - Click **Confirm**

4. **Wait for Changes to Apply**
   - Changes usually take **1-2 minutes** to propagate
   - You'll see a status indicator showing when it's active

### Step 3: Verify Connection

1. **Restart your Next.js server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm run dev
   ```

2. **Test the connection**:
   - Visit: http://localhost:3000/api/debug/db-test
   - You should see a successful connection message

3. **Try signing up again**:
   - The MongoDB connection errors should be gone
   - User data should now be saved to the database

## Troubleshooting

### If it still doesn't work:

1. **Check if you're behind a VPN or Proxy**
   - Your IP might be different than what you see
   - Disable VPN and try again
   - Or whitelist the VPN's IP address

2. **Check MongoDB Connection String**
   - Verify your `MONGODB_URI` in `.env.local` is correct
   - Format should be: `mongodb+srv://username:password@cluster.mongodb.net/database`

3. **Check MongoDB Cluster Status**
   - In MongoDB Atlas, make sure your cluster is **running** (not paused)
   - Paused clusters won't accept connections

4. **Try the "Allow All IPs" option temporarily**
   - Add `0.0.0.0/0` to test if it's an IP issue
   - If this works, then it's definitely an IP whitelist problem
   - Remember to remove this and add your specific IP for security

## Quick Fix (Development Only)

For quick testing, you can temporarily allow all IPs:

1. Go to MongoDB Atlas → Network Access
2. Click **Add IP Address**
3. Enter: `0.0.0.0/0`
4. Click **Confirm**
5. Wait 1-2 minutes
6. Restart your Next.js server

⚠️ **Important**: Remove `0.0.0.0/0` and add your specific IP before deploying to production!

## Your Current MongoDB URI

Based on your code, your connection string is:
```
mongodb+srv://sathish23:sathish23@cluster0.owiirvv.mongodb.net/users
```

Make sure:
- Username and password are correct
- Cluster name is correct
- Database name (`users`) is correct

