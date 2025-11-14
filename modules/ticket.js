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
 * Ticket Schema for storing ticket information in Tickets database
 */
export const TicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  // Company information
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
  // Team information
  teamId: {
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
  // User who raised the ticket
  raisedBy: {
    userId: {
      type: String,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    name: {
      type: String,
      trim: true
    }
  },
  // Ticket details
  subject: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  // Additional metadata
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    url: String,
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Assigned agent (if any)
  assignedTo: {
    userId: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      trim: true
    },
    assignedAt: {
      type: Date
    }
  },
  // Resolution information
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    userId: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      trim: true
    }
  },
  resolutionNotes: {
    type: String,
    trim: true
  },
  // Activity log
  activityLog: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'assigned', 'status_changed', 'priority_changed', 'resolved', 'closed', 'reopened'],
      required: true
    },
    performedBy: {
      userId: String,
      email: String,
      name: String
    },
    details: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
})

// Create indexes for better performance
TicketSchema.index({ createdAt: -1 })
TicketSchema.index({ companyId: 1, ticketId: 1 }, { unique: true })
TicketSchema.index({ companyId: 1, status: 1 })
TicketSchema.index({ companyId: 1, priority: 1 })
TicketSchema.index({ teamId: 1, status: 1 })
TicketSchema.index({ 'raisedBy.email': 1 })
TicketSchema.index({ 'assignedTo.userId': 1 })

// Get connection and create model
let Ticket = null

async function getTicketModel() {
  const connection = await connectTicketsDB()
  
  // Check if model already exists on this connection
  if (connection.models.Ticket) {
    return connection.models.Ticket
  }
  
  // Create model on the Tickets database connection
  Ticket = connection.model('Ticket', TicketSchema, 'Tickets')
  return Ticket
}

/**
 * Generate unique Ticket ID
 * Format: TKT-YYYYMMDD-XXXXXXXXXX
 * @param {string} subject - Ticket subject (for logging)
 * @returns {Promise<string>} Unique ticket ID
 */
export async function generateTicketId(subject) {
  const TicketModel = await getTicketModel()
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const uniqueCode = generateId()
  const ticketId = `TKT-${dateStr}-${uniqueCode}`
  
  // Check for collision (extremely rare)
  const exists = await TicketModel.findOne({ ticketId })
  if (exists) {
    return generateTicketId(subject)  // Regenerate
  }
  
  return ticketId
}

// Export Ticket model getter
export async function getTicket() {
  return await getTicketModel()
}

export default connectTicketsDB

