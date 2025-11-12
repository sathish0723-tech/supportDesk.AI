import mongoose from 'mongoose'
import { customAlphabet } from 'nanoid'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sathish23:sathish23@cluster0.owiirvv.mongodb.net/users'

// Generate uppercase alphanumeric IDs (0-9, A-Z)
const generateId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10)

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, uri: null }
}

/**
 * Database connection function
 * Forces connection to 'users' database
 * @returns {Promise<mongoose.Connection>} MongoDB connection
 */
async function connectDB() {
  // If URI changed, disconnect and clear cache
  if (cached.uri && cached.uri !== MONGODB_URI) {
    console.log('🔄 Connection URI changed, reconnecting...')
    if (cached.conn) {
      await mongoose.disconnect()
    }
    cached.conn = null
    cached.promise = null
  }

  // If already connected, verify it's using the correct database
  if (cached.conn && mongoose.connection.readyState === 1) {
    const currentDb = mongoose.connection.db?.databaseName
    if (currentDb !== 'users') {
      console.log(`⚠️  Connected to wrong database: "${currentDb}", reconnecting to "users"...`)
      await mongoose.disconnect()
      cached.conn = null
      cached.promise = null
    } else {
      return cached.conn
    }
  }

  if (!cached.promise) {
    // Ensure URI ends with /users
    let uri = MONGODB_URI
    if (!uri.includes('/users') && !uri.includes('/users?')) {
      // Add /users before query params or at the end
      if (uri.includes('?')) {
        uri = uri.replace('?', '/users?')
      } else {
        uri = uri.endsWith('/') ? uri + 'users' : uri + '/users'
      }
      console.log('🔧 Updated URI to use "users" database')
    }

    const opts = {
      bufferCommands: false,
      dbName: 'users', // Explicitly set database name
    }

    cached.uri = uri
    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      const dbName = mongoose.connection.db?.databaseName
      console.log(`✅ Connected to MongoDB database: "${dbName}"`)
      if (dbName !== 'users') {
        console.warn(`⚠️  WARNING: Connected to "${dbName}" instead of "users"`)
      }
      return mongoose
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error)
      cached.promise = null
      throw error
    })
  }

  try {
    cached.conn = await cached.promise
    // Double-check database name
    const dbName = cached.conn.connection?.db?.databaseName || mongoose.connection.db?.databaseName
    if (dbName && dbName !== 'users') {
      console.warn(`⚠️  WARNING: Using database "${dbName}" instead of "users"`)
    }
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB

/**
 * User Schema for storing user authentication and profile data
 */
export const UserSchema = new mongoose.Schema({
  // Clerk user ID
  clerkId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  // Google OAuth fields
  googleId: {
    type: String,
    sparse: true,  // Allow duplicates of null, but unique when set
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  // User profile fields
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  // Company information (reference to Company collection)
  companyId: {
    type: String,
    trim: true,
    index: true
  },
  companyName: {
    type: String,
    trim: true,
    index: true
  },
  totalEmployees: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  // Subscription information
  subscriptionPlan: {
    type: String,
    enum: ['starter', 'professional', 'enterprise', 'free'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['pending', 'active', 'cancelled', 'expired'],
    default: 'pending'
  },
  subscriptionStartDate: {
    type: Date
  },
  subscriptionEndDate: {
    type: Date
  },
  paymentId: {
    type: String,
    trim: true
  },
  // Onboarding flags
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  onboardingSkipped: {
    type: Boolean,
    default: false
  },
  paymentSkipped: {
    type: Boolean,
    default: false
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  },
  // Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true
})

// Create additional indexes for better performance
UserSchema.index({ subscriptionStatus: 1 })
UserSchema.index({ createdAt: -1 })
UserSchema.index({ lastLoginAt: -1 })

/**
 * Company Schema for storing company information
 */
export const CompanySchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  totalEmployees: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  domain: {
    type: String,
    trim: true,
    lowercase: true,
    index: true
  },
  subscriptionPlan: {
    type: String,
    enum: ['starter', 'professional', 'enterprise', 'free'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['pending', 'active', 'cancelled', 'expired'],
    default: 'pending'
  },
  subscriptionStartDate: {
    type: Date
  },
  subscriptionEndDate: {
    type: Date
  },
  paymentId: {
    type: String,
    trim: true
  },
  // Owner/Admin user
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ownerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  // Members of the company
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  // Deprecated field for backward compatibility
  userId: {
    type: String,
    trim: true
  },
  paymentId: {
    type: String,
    trim: true
  },
  skipped: {
    type: Boolean,
    default: false
  },
  paymentSkipped: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

/**
 * Form Schema for job application forms
 */
export const FormSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  companyId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  jobRole: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true
  },
  fields: [{
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['TEXT', 'EMAIL', 'PHONE', 'NUMBER', 'DATE', 'PARAGRAPH', 'DROPDOWN', 'RADIO', 'CHECKBOX', 'FILE', 'URL', 'YES_NO']
    },
    title: {
      type: String,
      required: true
    },
    required: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    options: [{
      type: String
    }],
    validation: {
      minLength: Number,
      maxLength: Number,
      min: Number,
      max: Number,
      fileSize: Number,
      fileTypes: [String]
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
})

/**
 * Application Schema for job applications
 */
export const ApplicationSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicantData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'accepted', 'rejected'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
})

// Create models with specific collection names
// Force delete cached models to ensure schema updates are applied
if (mongoose.models.User) {
  delete mongoose.models.User;
  delete mongoose.connection.models.User;
}
if (mongoose.models.Company) {
  delete mongoose.models.Company;
  delete mongoose.connection.models.Company;
}

export const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users')
export const Company = mongoose.model('Company', CompanySchema, 'companies')
export const Job = mongoose.models.Job || mongoose.model('Job', FormSchema, 'jobs')
export const Application = mongoose.models.Application || mongoose.model('Application', ApplicationSchema, 'applications')

/**
 * Generate unique Company ID
 * Format: COMP-YYYYMMDD-XXXXXXXXXX
 * @param {string} companyName - Company name (for logging)
 * @returns {Promise<string>} Unique company ID
 */
export async function generateCompanyId(companyName) {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const uniqueCode = generateId()
  const companyId = `COMP-${dateStr}-${uniqueCode}`
  
  // Check for collision (extremely rare)
  const exists = await Company.findOne({ companyId })
  if (exists) {
    return generateCompanyId(companyName)  // Regenerate
  }
  
  return companyId
}

// Create compound indexes for multi-tenant uniqueness
// Ensure slug is unique within each company
if (!Job.schema.indexes().find(idx => idx[0]?.companyName && idx[0]?.slug)) {
  Job.schema.index({ companyName: 1, slug: 1 }, { unique: true })
}
