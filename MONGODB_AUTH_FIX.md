# How to Fix MongoDB Authentication Error

## Problem
You're seeing this error:
```
bad auth : authentication failed
```

This means your MongoDB username or password is incorrect.

## Solution: Fix MongoDB Credentials

### Step 1: Get Your Correct MongoDB Connection String

1. **Go to MongoDB Atlas**
   - Visit: https://cloud.mongodb.com/
   - Sign in to your account

2. **Navigate to Database Access**
   - Click on your **project** (if you have multiple)
   - In the left sidebar, click **Database Access** (or **Security** → **Database Access**)
   - Or go directly to: https://cloud.mongodb.com/v2#/security/database/users

3. **Check Your Database Users**
   - You'll see a list of database users
   - Look for a user named `sathish23` (or create a new one)

### Step 2: Create or Reset Database User

**Option A: If user `sathish23` exists:**
1. Click on the user `sathish23`
2. Click **Edit** or **Reset Password**
3. Set a new password (remember it!)
4. Make sure the user has **Read and write to any database** permissions
5. Click **Update User**

**Option B: If user doesn't exist, create a new one:**
1. Click **Add New Database User** button
2. Choose **Password** authentication method
3. Enter:
   - **Username**: `sathish23` (or any username you prefer)
   - **Password**: Create a strong password (remember it!)
4. Under **Database User Privileges**, select:
   - **Built-in Role**: `Read and write to any database`
5. Click **Add User**

### Step 3: Get Your Connection String

1. **Go to Database (Clusters)**
   - In the left sidebar, click **Database** (or **Clusters**)
   - Click **Connect** on your cluster

2. **Choose Connection Method**
   - Select **Connect your application**
   - Choose **Node.js** as driver
   - Copy the connection string (it will look like):
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

3. **Replace Placeholders**
   - Replace `<username>` with your actual username (e.g., `sathish23`)
   - Replace `<password>` with your actual password
   - **Important**: If your password has special characters, you need to URL-encode them:
     - `@` becomes `%40`
     - `#` becomes `%23`
     - `$` becomes `%24`
     - `%` becomes `%25`
     - `&` becomes `%26`
     - `+` becomes `%2B`
     - `=` becomes `%3D`
     - `?` becomes `%3F`
     - `/` becomes `%2F`
     - ` ` (space) becomes `%20`

4. **Add Database Name**
   - Add `/users` at the end (or your preferred database name)
   - Final format: `mongodb+srv://username:password@cluster.mongodb.net/users`

### Step 4: Update Your .env.local File

1. **Open `.env.local`** in your project root
2. **Update the MONGODB_URI**:
   ```env
   MONGODB_URI=mongodb+srv://sathish23:YOUR_NEW_PASSWORD@cluster0.owiirvv.mongodb.net/users
   ```
   Replace `YOUR_NEW_PASSWORD` with your actual password (URL-encoded if needed)

3. **Save the file**

### Step 5: Restart Your Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Example: Password with Special Characters

If your password is `MyP@ss#123`:
- URL-encoded: `MyP%40ss%23123`
- Connection string: `mongodb+srv://sathish23:MyP%40ss%23123@cluster0.owiirvv.mongodb.net/users`

## Quick Test

After updating, test the connection:
```
GET http://localhost:3000/api/debug/db-test
```

You should see:
```json
{
  "success": true,
  "database": {
    "name": "users",
    "collection": "users",
    ...
  }
}
```

## Common Issues

### Issue 1: Password has special characters
**Solution**: URL-encode the password in the connection string

### Issue 2: User doesn't have permissions
**Solution**: Make sure the user has "Read and write to any database" role

### Issue 3: Wrong cluster name
**Solution**: Verify the cluster name in the connection string matches your Atlas cluster

### Issue 4: Database name mismatch
**Solution**: The database name in the connection string should match what you're using

## Your Current Connection String Format

Based on your code:
```
mongodb+srv://sathish23:sathish23@cluster0.owiirvv.mongodb.net/users
```

**Check:**
- ✅ Username: `sathish23` 
- ❓ Password: `sathish23` (might be wrong - reset it in Atlas)
- ✅ Cluster: `cluster0.owiirvv.mongodb.net`
- ✅ Database: `users`

## Next Steps

1. Go to MongoDB Atlas → Database Access
2. Reset password for user `sathish23` OR create a new user
3. Get the connection string from Atlas
4. Update `.env.local` with the correct credentials
5. Restart your server
6. Test the connection




