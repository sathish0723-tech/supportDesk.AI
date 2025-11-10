import mongoose from 'mongoose'
import { customAlphabet } from 'nanoid'

// Get base URI from environment or use default
const BASE_URI = process.env.MONGODB_URI || 'mongodb+srv://sathish23:sathish23@cluster0.owiirvv.mongodb.net'

// Generate uppercase alphanumeric IDs (0-9, A-Z)
const generateId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10)

/**
 * Connect to Tickets database using a separate connection instance
 * This allows us to connect to multiple databases simultaneously
 * @returns {Promise<mongoose.Connection>} MongoDB connection
 */
async function connectTicketsDB() {
  // Use a separate connection instance for Tickets database
  let cached = global.mongooseTicketsConnection

  if (!cached) {
    cached = global.mongooseTicketsConnection = { conn: null, promise: null }
  }

  // If already connected and ready, return it
  if (cached.conn && cached.conn.readyState === 1) {
    const dbName = cached.conn.db?.databaseName
    if (dbName === 'Tickets') {
      return cached.conn
    }
  }

  if (!cached.promise) {
    // Build URI with Tickets database
    let uri = BASE_URI
    if (!uri.includes('/Tickets') && !uri.includes('/Tickets?')) {
      if (uri.includes('?')) {
        uri = uri.replace('?', '/Tickets?')
      } else {
        uri = uri.endsWith('/') ? uri + 'Tickets' : uri + '/Tickets'
      }
    }

    const opts = {
      bufferCommands: false,
      dbName: 'Tickets',
    }

    // Create a separate connection instance (doesn't interfere with default connection)
    const connection = mongoose.createConnection(uri, opts)
    
    // Use asPromise() to get a promise that resolves when connected
    // If asPromise() is not available, wait for the 'connected' event
    cached.promise = new Promise((resolve, reject) => {
      if (connection.readyState === 1) {
        // Already connected
        const dbName = connection.db?.databaseName
        console.log(`✅ Connected to Tickets database: "${dbName}"`)
        if (dbName !== 'Tickets') {
          console.warn(`⚠️  WARNING: Connected to "${dbName}" instead of "Tickets"`)
        }
        resolve(connection)
      } else if (connection.readyState === 2) {
        // Connecting, wait for it
        connection.once('connected', () => {
          const dbName = connection.db?.databaseName
          console.log(`✅ Connected to Tickets database: "${dbName}"`)
          if (dbName !== 'Tickets') {
            console.warn(`⚠️  WARNING: Connected to "${dbName}" instead of "Tickets"`)
          }
          resolve(connection)
        })
        connection.once('error', (error) => {
          console.error('❌ Tickets DB connection error:', error)
          cached.promise = null
          reject(error)
        })
      } else {
        // Not started, start connection
        connection.once('connected', () => {
          const dbName = connection.db?.databaseName
          console.log(`✅ Connected to Tickets database: "${dbName}"`)
          if (dbName !== 'Tickets') {
            console.warn(`⚠️  WARNING: Connected to "${dbName}" instead of "Tickets"`)
          }
          resolve(connection)
        })
        connection.once('error', (error) => {
          console.error('❌ Tickets DB connection error:', error)
          cached.promise = null
          reject(error)
        })
      }
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

/**
 * Team Schema for storing team information in Tickets database
 */
export const TeamSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  // Company information - each team belongs to a company
  companyId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  teamName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  // Team members
  members: [{
    userId: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'agent', 'member'],
      default: 'member'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Created by user
  createdBy: {
    userId: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      trim: true
    }
  },
  // Team status
  isActive: {
    type: Boolean,
    default: true
  },
  // Team settings
  settings: {
    autoAssign: {
      type: Boolean,
      default: false
    },
    notificationEnabled: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
})

// Create indexes for better performance
TeamSchema.index({ createdAt: -1 })
TeamSchema.index({ 'createdBy.userId': 1 })
TeamSchema.index({ isActive: 1 })
TeamSchema.index({ companyId: 1, teamId: 1 }, { unique: true }) // Ensure unique team per company
TeamSchema.index({ companyId: 1, teamName: 1 }) // Index for company + team name queries

// Get connection and create model
let Team = null

async function getTeamModel() {
  const connection = await connectTicketsDB()
  
  // Check if model already exists on this connection
  if (connection.models.Team) {
    return connection.models.Team
  }
  
  // Create model on the Tickets database connection
  Team = connection.model('Team', TeamSchema, 'teams')
  return Team
}

/**
 * Generate unique Team ID
 * Format: TEAM-YYYYMMDD-XXXXXXXXXX
 * @param {string} teamName - Team name (for logging)
 * @returns {Promise<string>} Unique team ID
 */
export async function generateTeamId(teamName) {
  const TeamModel = await getTeamModel()
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const uniqueCode = generateId()
  const teamId = `TEAM-${dateStr}-${uniqueCode}`
  
  // Check for collision (extremely rare)
  const exists = await TeamModel.findOne({ teamId })
  if (exists) {
    return generateTeamId(teamName)  // Regenerate
  }
  
  return teamId
}

// Export Team model getter
export async function getTeam() {
  return await getTeamModel()
}

export default connectTicketsDB

