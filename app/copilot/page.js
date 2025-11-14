'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Send, Bot, User, ChevronDown, ChevronUp, Ticket, Calendar, User as UserIcon, Building2, Tag, Table2, X, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function CopilotPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
    }
    setMessages((prev) => [...prev, newUserMessage])

    try {
      // Fetch company data
      let companyData = null
      try {
        const companyResponse = await fetch('/api/companies/me')
        if (companyResponse.ok) {
          const companyResult = await companyResponse.json()
          if (companyResult.success && companyResult.data) {
            // Extract domain from website if not already present
            let domain = null
            if (companyResult.data.website) {
              domain = companyResult.data.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
            }
            
            companyData = {
              companyId: companyResult.data.companyId,
              companyName: companyResult.data.companyName,
              industry: companyResult.data.industry,
              website: companyResult.data.website,
              domain: domain,
              address: companyResult.data.address,
              totalEmployees: companyResult.data.totalEmployees,
              phoneNumber: companyResult.data.phoneNumber,
              ownerEmail: companyResult.data.ownerEmail
            }
          }
        }
      } catch (companyError) {
        console.warn('Failed to fetch company data:', companyError)
        // Continue without company data
      }

      // Build the full payload structure with company data
      const payload = {
        endpoint: '/api/copilot/chat',
        prompt: userMessage,
        message: userMessage, // Keep for backward compatibility
        company: companyData
      }

      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
        }
        setMessages((prev) => [...prev, assistantMessage])

        // Automatically detect and open report if present
        const detectedReport = parseReportData(data.response)
        if (detectedReport) {
          setReportData(detectedReport)
          setIsReportOpen(true)
        }
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Error: ${data.error || 'Something went wrong'}`,
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error: ${error.message}`,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Helper function to clean markdown formatting from text
  const cleanMarkdown = (text) => {
    if (!text) return text
    // Remove markdown bold (**text**)
    return text.replace(/\*\*(.*?)\*\*/g, '$1')
      // Remove markdown italic (*text* or _text_)
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Remove markdown code backticks
      .replace(/`(.*?)`/g, '$1')
  }

  // Check if JSON data contains ticket data
  const isTicketData = (jsonData) => {
    if (Array.isArray(jsonData) && jsonData.length > 0) {
      const firstItem = jsonData[0]
      return firstItem && firstItem.ticketId && firstItem.companyId && firstItem.status
    }
    if (jsonData && typeof jsonData === 'object' && !Array.isArray(jsonData)) {
      return jsonData.ticketId && jsonData.companyId && jsonData.status
    }
    return false
  }

  // Parse markdown table to structured data
  const parseMarkdownTable = (content) => {
    if (!content) return null

    // Check if content contains a markdown table (has pipe characters)
    if (!content.includes('|')) return null

    // Find table pattern - more flexible regex
    // Matches: header row, separator row, and data rows
    const lines = content.split('\n')
    let tableStartIndex = -1
    let separatorIndex = -1
    
    // Find where table starts (first line with |)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        tableStartIndex = i
        // Check if next line is separator
        if (i + 1 < lines.length && lines[i + 1].includes('|') && lines[i + 1].match(/^[\s]*\|[\s:|-]+\|/)) {
          separatorIndex = i + 1
          break
        }
      }
    }

    if (tableStartIndex === -1 || separatorIndex === -1) return null

    const headerRow = lines[tableStartIndex]
    const dataRows = lines.slice(separatorIndex + 1).filter(line => 
      line.includes('|') && line.trim().startsWith('|') && !line.match(/^[\s]*\|[\s:|-]+\|/)
    )

    // Parse headers - split by | and clean (remove empty first/last from leading/trailing |)
    const headerCells = headerRow.split('|').map(h => h.trim())
    // Remove empty cells from start and end (from leading/trailing pipes)
    while (headerCells.length > 0 && headerCells[0] === '') headerCells.shift()
    while (headerCells.length > 0 && headerCells[headerCells.length - 1] === '') headerCells.pop()
    const headers = headerCells.filter(h => h && h.length > 0 && !h.match(/^:[-]+$/))

    if (headers.length === 0) return null

    // Parse data rows
    const data = dataRows
      .map(row => {
        const rowCells = row.split('|').map(c => c.trim())
        // Remove empty cells from start and end (from leading/trailing pipes)
        while (rowCells.length > 0 && rowCells[0] === '') rowCells.shift()
        while (rowCells.length > 0 && rowCells[rowCells.length - 1] === '') rowCells.pop()
        
        if (rowCells.length !== headers.length) {
          // Try to match by taking first N cells that match header count
          if (rowCells.length > headers.length) {
            rowCells.splice(headers.length)
          }
          if (rowCells.length !== headers.length) return null
        }
        
        const rowData = {}
        headers.forEach((header, index) => {
          let value = rowCells[index] || ''
          // Clean up markdown formatting
          value = value.replace(/\*\*/g, '').replace(/\*/g, '').trim()
          // Handle truncated data
          if (value.includes('*(data truncated)*') || value.includes('data truncated')) {
            value = '...'
          }
          rowData[header] = value
        })
        return rowData
      })
      .filter(row => row !== null && Object.keys(row).length > 0)

    if (data.length === 0) return null

    // Determine report type based on headers
    let type = 'generic'
    let title = 'Data Report'
    
    if (headers.some(h => h.toLowerCase().includes('ticket'))) {
      type = 'tickets'
      title = 'Ticket Report'
    } else if (headers.some(h => h.toLowerCase().includes('team'))) {
      type = 'teams'
      title = 'Team Report'
    }

    return { type, data, title }
  }

  // Parse structured ticket report (numbered list format)
  const parseStructuredTicketReport = (content) => {
    if (!content) return null

    // Check if it's a ticket report
    const ticketReportRegex = /ticket.*report|report.*ticket|detailed.*ticket|tickets?.*for|Here is.*report.*ticket/i
    if (!ticketReportRegex.test(content)) return null

    // Find ticket sections (numbered list items like "1.  **Ticket ID:**")
    // Pattern: number followed by **Ticket ID:**
    const ticketSections = content.split(/\d+\.\s+\*\*Ticket ID:\*\*/i)
    
    if (ticketSections.length < 2) return null

    const tickets = []

    ticketSections.forEach((section, index) => {
      if (index === 0) return // Skip the header/summary part

      const ticket = {}

      // Extract Ticket ID (it's right after the split point, before newline or next **)
      const ticketIdMatch = section.match(/^\s*([A-Z0-9-]+)/i)
      if (ticketIdMatch) ticket['Ticket ID'] = ticketIdMatch[1].trim()

      // Helper function to extract field value (handles both same line and bullet point format)
      const extractField = (fieldName) => {
        // Try pattern: **Field:** value (on same line or next line)
        const patterns = [
          new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*([^\\n\\*]+?)(?=\\n|\\*\\*|$)`, 'i'),
          new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*([^\\n]+)`, 'i')
        ]
        
        for (const pattern of patterns) {
          const match = section.match(pattern)
          if (match) {
            return match[1].trim()
          }
        }
        return null
      }

      // Extract all fields
      ticket['Subject'] = extractField('Subject')
      ticket['Raised By'] = extractField('Raised By')
      ticket['Team'] = extractField('Team')
      ticket['Priority'] = extractField('Priority')
      ticket['Status'] = extractField('Status')
      ticket['Created At'] = extractField('Created At')
      ticket['Last Status Change'] = extractField('Last Status Change')

      if (ticket['Ticket ID']) {
        tickets.push(ticket)
      }
    })

    return tickets.length > 0 ? { type: 'tickets', data: tickets, title: 'Ticket Report' } : null
  }

  // Parse report data from text (teams, tickets, etc.)
  const parseReportData = (content) => {
    if (!content) return null

    // First check for markdown tables
    const markdownTable = parseMarkdownTable(content)
    if (markdownTable) {
      return markdownTable
    }

    // Check for structured ticket reports (numbered list format)
    const structuredTicketReport = parseStructuredTicketReport(content)
    if (structuredTicketReport) {
      return structuredTicketReport
    }

    // Check for team report patterns
    const teamReportRegex = /Team\s+Report|Here is the report for the teams|teams?.*report/gi
    if (teamReportRegex.test(content)) {
      const teams = []
      const teamSections = content.split(/\d+\.\s*Team\s+Name:/i)

      teamSections.forEach((section, index) => {
        if (index === 0) return // Skip the header part

        const team = {}
        
        // Extract Team Name
        const nameMatch = section.match(/Team\s+Name:\s*(.+?)(?:\n|$)/i)
        if (nameMatch) team.name = nameMatch[1].trim()

        // Extract Team ID
        const idMatch = section.match(/Team\s+ID:\s*(.+?)(?:\n|$)/i)
        if (idMatch) team.teamId = idMatch[1].trim()

        // Extract Description
        const descMatch = section.match(/Description:\s*(.+?)(?:\n|$)/i)
        if (descMatch) team.description = descMatch[1].trim().replace(/^\(No description provided\)$/i, 'No description')

        // Extract Members count
        const membersMatch = section.match(/Members:\s*(\d+)/i)
        if (membersMatch) team.memberCount = parseInt(membersMatch[1])

        // Extract Members list
        const membersList = []
        const membersSection = section.match(/Members:[\s\S]*?(?=Created By:|Status:|$)/i)
        if (membersSection) {
          const memberLines = membersSection[0].match(/\*\s*(.+?)\s*\((.+?),\s*(.+?)\)/g)
          if (memberLines) {
            memberLines.forEach(line => {
              const memberMatch = line.match(/\*\s*(.+?)\s*\((.+?),\s*(.+?)\)/)
              if (memberMatch) {
                membersList.push({
                  name: memberMatch[1].trim(),
                  role: memberMatch[2].trim(),
                  email: memberMatch[3].trim()
                })
              }
            })
          }
        }
        team.members = membersList

        // Extract Created By
        const createdByMatch = section.match(/Created\s+By:\s*(.+?)\s*\((.+?)\)/i)
        if (createdByMatch) {
          team.createdBy = {
            name: createdByMatch[1].trim(),
            email: createdByMatch[2].trim()
          }
        }

        // Extract Status
        const statusMatch = section.match(/Status:\s*(.+?)(?:\n|$)/i)
        if (statusMatch) team.status = statusMatch[1].trim()

        // Extract Created On
        const createdOnMatch = section.match(/Created\s+On:\s*(.+?)(?:\n|$)/i)
        if (createdOnMatch) team.createdOn = createdOnMatch[1].trim()

        if (team.name || team.teamId) {
          teams.push(team)
        }
      })

      return teams.length > 0 ? { type: 'teams', data: teams, title: 'Team Report' } : null
    }

    return null
  }

  // Helper function to format message content with JSON code blocks
  const formatMessageContent = (content) => {
    if (!content) return [{ type: 'text', content: '' }]

    // Check for report data first (markdown tables or structured reports)
    const reportData = parseReportData(content)
    if (reportData) {
      // Extract text before the table/report
      let textBeforeReport = ''
      if (content.includes('|')) {
        // Markdown table detected
        const tableIndex = content.indexOf('|')
        textBeforeReport = content.substring(0, tableIndex).trim()
      } else {
        textBeforeReport = content.split(/\d+\.\s*Team\s+Name:/i)[0] || content.split(/Team\s+Report/i)[0] || ''
      }
      return [
        { type: 'text', content: cleanMarkdown(textBeforeReport) },
        { type: 'report', content: reportData }
      ]
    }

    // Check if content contains JSON code blocks
    const jsonCodeBlockRegex = /```json\n?([\s\S]*?)```/g
    const hasJsonBlock = jsonCodeBlockRegex.test(content)

    if (hasJsonBlock) {
      // Split content by JSON code blocks
      const parts = []
      let lastIndex = 0
      let match

      // Reset regex
      jsonCodeBlockRegex.lastIndex = 0

      while ((match = jsonCodeBlockRegex.exec(content)) !== null) {
        // Add text before the code block
        if (match.index > lastIndex) {
          const textBefore = content.substring(lastIndex, match.index)
          if (textBefore.trim()) {
            parts.push({ type: 'text', content: cleanMarkdown(textBefore) })
          }
        }

        // Add the JSON code block
        try {
          const jsonContent = match[1].trim()
          const parsedJson = JSON.parse(jsonContent)
          
          // Check if it's ticket data
          if (isTicketData(parsedJson)) {
            parts.push({ type: 'tickets', content: parsedJson })
          } else {
            const formattedJson = JSON.stringify(parsedJson, null, 2)
            parts.push({ type: 'json', content: formattedJson })
          }
        } catch (e) {
          // If JSON parsing fails, just show as code
          parts.push({ type: 'code', content: match[1] })
        }

        lastIndex = match.index + match[0].length
      }

      // Add remaining text after last code block
      if (lastIndex < content.length) {
        const textAfter = content.substring(lastIndex)
        if (textAfter.trim()) {
          parts.push({ type: 'text', content: cleanMarkdown(textAfter) })
        }
      }

      return parts
    }

    // No JSON blocks, return as plain text
    return [{ type: 'text', content: cleanMarkdown(content) }]
  }

  // Component to display ticket data
  const TicketDisplay = ({ tickets }) => {
    const [expandedTickets, setExpandedTickets] = useState({})

    const toggleTicket = (ticketId) => {
      setExpandedTickets(prev => ({
        ...prev,
        [ticketId]: !prev[ticketId]
      }))
    }

    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'open':
          return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
        case 'in_progress':
          return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
        case 'resolved':
          return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
        case 'closed':
          return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'
        default:
          return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'
      }
    }

    const getPriorityColor = (priority) => {
      switch (priority?.toLowerCase()) {
        case 'high':
          return 'bg-red-500/10 text-red-700 dark:text-red-400'
        case 'medium':
          return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
        case 'low':
          return 'bg-green-500/10 text-green-700 dark:text-green-400'
        default:
          return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
      }
    }

    const ticketArray = Array.isArray(tickets) ? tickets : [tickets]

    return (
      <div className="space-y-3 mt-3">
        {ticketArray.map((ticket, index) => {
          const isExpanded = expandedTickets[ticket.ticketId || index]
          return (
            <div
              key={ticket.ticketId || index}
              className="border border-border rounded-lg bg-background/50 dark:bg-background/30 overflow-hidden"
            >
              {/* Ticket Summary - Always Visible */}
              <Collapsible open={isExpanded} onOpenChange={() => toggleTicket(ticket.ticketId || index)}>
                <CollapsibleTrigger className="w-full">
                  <div className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Ticket className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-sm text-muted-foreground">
                            {ticket.ticketId || `Ticket #${index + 1}`}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                            {ticket.status || 'N/A'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority || 'N/A'} Priority
                          </span>
                        </div>
                        <h3 className="font-semibold text-base">{ticket.subject || 'No Subject'}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message || 'No message'}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          {ticket.companyName && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              <span>{ticket.companyName}</span>
                            </div>
                          )}
                          {ticket.teamName && (
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              <span>{ticket.teamName}</span>
                            </div>
                          )}
                          {ticket.raisedBy?.name && (
                            <div className="flex items-center gap-1">
                              <UserIcon className="h-3 w-3" />
                              <span>{ticket.raisedBy.name}</span>
                            </div>
                          )}
                          {ticket.createdAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Ticket Details - Expandable */}
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4 border-t border-border bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Ticket ID</label>
                        <p className="text-sm mt-1">{ticket.ticketId || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Company</label>
                        <p className="text-sm mt-1">{ticket.companyName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Team</label>
                        <p className="text-sm mt-1">{ticket.teamName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Raised By</label>
                        <p className="text-sm mt-1">
                          {ticket.raisedBy?.name || ticket.raisedBy?.email || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                        <p className="text-sm mt-1">{ticket.status || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Priority</label>
                        <p className="text-sm mt-1">{ticket.priority || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Created</label>
                        <p className="text-sm mt-1">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Updated</label>
                        <p className="text-sm mt-1">
                          {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Message</label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{ticket.message || 'No message'}</p>
                    </div>

                    {ticket.tags && ticket.tags.length > 0 && (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Tags</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {ticket.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {ticket.activityLog && ticket.activityLog.length > 0 && (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Activity Log</label>
                        <div className="space-y-2 mt-2">
                          {ticket.activityLog.map((activity, actIndex) => (
                            <div key={actIndex} className="text-xs p-2 bg-background/50 rounded border border-border">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{activity.action}</span>
                                <span className="text-muted-foreground">
                                  {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : ''}
                                </span>
                              </div>
                              {activity.details && (
                                <p className="text-muted-foreground mt-1">{activity.details}</p>
                              )}
                              {activity.performedBy && (
                                <p className="text-muted-foreground mt-1">
                                  By: {activity.performedBy.name || activity.performedBy.email}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw JSON View - Collapsible */}
                    <Collapsible>
                      <CollapsibleTrigger className="w-full text-left">
                        <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer">
                          <span className="text-xs font-semibold text-muted-foreground">View Raw JSON</span>
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <pre className="bg-background/50 dark:bg-background/30 border border-border rounded-md p-3 overflow-x-auto text-xs mt-2">
                          <code>{JSON.stringify(ticket, null, 2)}</code>
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )
        })}
      </div>
    )
  }

  // Component to display report with button to open in side panel
  const ReportDisplay = ({ report }) => {
    const handleOpenReport = () => {
      setReportData(report)
      setIsReportOpen(true)
    }

    return (
      <div className="mt-3 p-4 border border-border rounded-lg bg-background/50 dark:bg-background/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table2 className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-sm">{report.title || 'Report'}</h3>
              <p className="text-xs text-muted-foreground">
                {report.data?.length || 0} {report.type === 'teams' ? 'teams' : 'items'} found
              </p>
            </div>
          </div>
          <Button
            onClick={handleOpenReport}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Table2 className="h-4 w-4" />
            View Table
          </Button>
        </div>
      </div>
    )
  }

  // Generate chart data from report data
  const generateChartData = (data, type) => {
    if (!data || data.length === 0) return []

    if (type === 'tickets') {
      // Chart 1: Status distribution
      const statusCounts = {}
      data.forEach(ticket => {
        const status = ticket['Status'] || ticket.status || 'Unknown'
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })
      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        count: count
      }))

      // Chart 2: Priority distribution
      const priorityCounts = {}
      data.forEach(ticket => {
        const priority = ticket['Priority'] || ticket.priority || 'Unknown'
        priorityCounts[priority] = (priorityCounts[priority] || 0) + 1
      })
      const priorityData = Object.entries(priorityCounts).map(([priority, count]) => ({
        name: priority,
        count: count
      }))

      return {
        statusDistribution: statusData,
        priorityDistribution: priorityData
      }
    }

    if (type === 'teams') {
      // Chart 1: Team member counts
      const memberCountData = data.map(team => ({
        name: team.name || team['Team Name'] || team.teamId || 'Unknown',
        members: team.memberCount || (team.members ? team.members.length : 0) || (team['Members'] ? parseInt(team['Members']) || 0 : 0)
      }))

      // Chart 2: Status distribution
      const statusCounts = {}
      data.forEach(team => {
        const status = team.status || team['Status'] || 'Unknown'
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })
      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        count: count
      }))

      return {
        memberCount: memberCountData,
        statusDistribution: statusData
      }
    }

    // Generic chart data for other types
    return []
  }

  // Chart component
  const ReportCharts = ({ data, type }) => {
    const chartData = generateChartData(data, type)

    if (!chartData || Object.keys(chartData).length === 0) {
      return null
    }

    return (
      <div className="space-y-4 mb-4">
        {chartData.memberCount && chartData.memberCount.length > 0 && (
          <div className="border border-border rounded-lg p-3 bg-background/50">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
              <BarChart3 className="h-3 w-3" />
              Team Member Count
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.memberCount}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="members" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartData.statusDistribution && chartData.statusDistribution.length > 0 && (
          <div className="border border-border rounded-lg p-3 bg-background/50">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
              <BarChart3 className="h-3 w-3" />
              Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartData.priorityDistribution && chartData.priorityDistribution.length > 0 && (
          <div className="border border-border rounded-lg p-3 bg-background/50">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
              <BarChart3 className="h-3 w-3" />
              Priority Distribution
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.priorityDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    )
  }

  // Dynamic table component for side panel
  const DynamicTable = ({ data, type }) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>No data available</p>
        </div>
      )
    }

    if (type === 'tickets') {
      // Get all unique keys from all tickets for columns
      const allKeys = new Set()
      data.forEach(ticket => {
        Object.keys(ticket).forEach(key => {
          allKeys.add(key)
        })
      })
      const columns = Array.from(allKeys)

      return (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 z-10">
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col} className="text-[10px] uppercase font-semibold px-2 py-2 h-8">
                      <div className="whitespace-nowrap">
                        {col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((ticket, index) => (
                  <TableRow key={ticket['Ticket ID'] || ticket.ticketId || index} className="h-auto">
                    {columns.map((col) => (
                      <TableCell key={col} className="text-xs px-2 py-2 max-w-[200px]">
                        <div className="truncate" title={ticket[col] || '-'}>
                          {ticket[col] || '-'}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )
    }

    if (type === 'teams') {
      // Get all unique keys from all teams for columns
      const allKeys = new Set()
      data.forEach(team => {
        Object.keys(team).forEach(key => {
          if (key !== 'members' && key !== 'createdBy') {
            allKeys.add(key)
          }
        })
      })
      const columns = Array.from(allKeys)

      return (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 z-10">
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col} className="text-[10px] uppercase font-semibold px-2 py-2 h-8">
                      <div className="whitespace-nowrap">
                        {col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-[10px] uppercase font-semibold px-2 py-2 h-8">
                    <div className="whitespace-nowrap">Members</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((team, index) => (
                  <TableRow key={team.teamId || index} className="h-auto">
                    {columns.map((col) => (
                      <TableCell key={col} className="text-xs px-2 py-2 max-w-[200px]">
                        <div className="truncate" title={team[col] || '-'}>
                          {team[col] || '-'}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="text-xs px-2 py-2 max-w-[200px]">
                      {team.members && team.members.length > 0 ? (
                        <div className="space-y-0.5">
                          {team.members.map((member, mIndex) => (
                            <div key={mIndex} className="text-[10px] truncate" title={`${member.name} (${member.role})`}>
                              {member.name} ({member.role})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )
    }

    // Generic table for other data types
    const allKeys = new Set()
    data.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key))
    })
    const columns = Array.from(allKeys)

    return (
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col} className="text-[10px] uppercase font-semibold px-2 py-2 h-8">
                    <div className="whitespace-nowrap">
                      {col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={item.id || item._id || index} className="h-auto">
                  {columns.map((col) => (
                    <TableCell key={col} className="text-xs px-2 py-2 max-w-[200px]">
                      <div className="truncate" title={typeof item[col] === 'object' ? JSON.stringify(item[col]) : (item[col] || '-')}>
                        {typeof item[col] === 'object' ? JSON.stringify(item[col]) : (item[col] || '-')}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Copilot</h1>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="container max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <Bot className="h-12 w-12 text-muted-foreground" />
              <div>
                <h2 className="text-2xl font-semibold mb-2">How can I help you today?</h2>
                <p className="text-muted-foreground">Ask me anything and I'll do my best to assist you.</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="space-y-3">
                      {formatMessageContent(message.content).map((part, index) => {
                        if (part.type === 'tickets') {
                          return <TicketDisplay key={index} tickets={part.content} />
                        } else if (part.type === 'report') {
                          return <ReportDisplay key={index} report={part.content} />
                        } else if (part.type === 'json') {
                          return (
                            <div key={index} className="relative">
                              <pre className="bg-background/50 dark:bg-background/30 border border-border rounded-md p-4 overflow-x-auto text-sm">
                                <code className="text-foreground">{part.content}</code>
                              </pre>
                            </div>
                          )
                        } else if (part.type === 'code') {
                          return (
                            <div key={index} className="relative">
                              <pre className="bg-background/50 dark:bg-background/30 border border-border rounded-md p-4 overflow-x-auto text-sm">
                                <code className="text-foreground">{part.content}</code>
                              </pre>
                            </div>
                          )
                        } else {
                          return (
                            <p key={index} className="whitespace-pre-wrap break-words">
                              {part.content}
                            </p>
                          )
                        }
                      })}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{cleanMarkdown(message.content)}</p>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Report Side Panel */}
      <Sheet open={isReportOpen} onOpenChange={setIsReportOpen}>
        <SheetContent side="right" className="w-[45%] max-w-none overflow-hidden flex flex-col p-0">
          <div className="flex flex-col h-full">
            {/* Minimal Header */}
            <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4" />
                  <h2 className="text-sm font-semibold">{reportData?.title || 'Report'}</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {reportData?.data?.length || 0} {reportData?.type === 'teams' ? 'teams' : 'items'}
                </span>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {reportData && (
                <div className="space-y-4">
                  <ReportCharts data={reportData.data} type={reportData.type} />
                  <div>
                    <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
                      <Table2 className="h-3 w-3" />
                      Data Table
                    </h3>
                    <DynamicTable data={reportData.data} type={reportData.type} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

