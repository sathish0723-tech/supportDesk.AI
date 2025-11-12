/**
 * DNS utility functions for domain verification
 */

/**
 * Check if a domain has valid MX records using Cloudflare DNS API
 * @param {string} domain - The domain to check (e.g., "example.com")
 * @returns {Promise<boolean>} - True if domain has MX records, false otherwise
 */
export async function checkDomainMX(domain) {
  if (!domain) {
    return false
  }

  // Clean the domain (remove protocol, www, etc.)
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .trim()
    .toLowerCase()

  if (!cleanDomain) {
    return false
  }

  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanDomain)}&type=MX`
    console.log(`🌐 Calling Cloudflare DNS API: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/dns-json',
      },
    })

    if (!response.ok) {
      console.error(`❌ DNS query failed for ${cleanDomain}: ${response.status} ${response.statusText}`)
      return false
    }

    const data = await response.json()
    console.log(`📡 DNS API response for ${cleanDomain}:`, JSON.stringify(data, null, 2))

    // Check if we have MX records in the Answer section
    if (data.Answer && Array.isArray(data.Answer) && data.Answer.length > 0) {
      // Check if any answer has type 15 (MX record type)
      const hasMX = data.Answer.some(record => record.type === 15)
      if (hasMX) {
        console.log(`✅ Found MX records for ${cleanDomain}`)
      } else {
        console.log(`ℹ️ No MX records found in Answer for ${cleanDomain}`)
      }
      return hasMX
    }

    // Also check Status - if it's 0, the query was successful but no records found
    // If Status is 3 (NXDOMAIN), the domain doesn't exist
    if (data.Status === 0 && (!data.Answer || data.Answer.length === 0)) {
      console.log(`ℹ️ DNS query successful but no MX records found for ${cleanDomain} (Status: 0)`)
      return false
    }

    if (data.Status === 3) {
      console.log(`❌ Domain ${cleanDomain} does not exist (NXDOMAIN)`)
      return false
    }

    console.log(`⚠️ Unexpected DNS response status for ${cleanDomain}: ${data.Status}`)
    return false
  } catch (error) {
    console.error(`❌ Error checking MX records for ${cleanDomain}:`, error.message)
    console.error('Error stack:', error.stack)
    return false
  }
}

/**
 * Extract domain from email address
 * @param {string} email - Email address
 * @returns {string|null} - Domain part of email or null if invalid
 */
export function extractDomainFromEmail(email) {
  if (!email || typeof email !== 'string') {
    return null
  }

  const emailRegex = /^[^\s@]+@([^\s@]+)$/
  const match = email.match(emailRegex)
  
  if (match && match[1]) {
    return match[1].toLowerCase().trim()
  }

  return null
}

/**
 * Verify domain and check if it exists in database
 * @param {string} email - User's email address
 * @param {Function} CompanyModel - Mongoose Company model
 * @param {boolean} skipMXCheck - If true, skip MX record verification (default: false)
 * @returns {Promise<Object|null>} - Company object if found, null otherwise
 */
export async function findCompanyByEmailDomain(email, CompanyModel, skipMXCheck = false) {
  const domain = extractDomainFromEmail(email)
  
  if (!domain) {
    console.log('❌ No domain extracted from email:', email)
    return null
  }

  console.log(`🔍 Checking domain: ${domain} for email: ${email}`)

  // First check if domain has valid MX records (unless skipped)
  if (!skipMXCheck) {
    try {
      console.log(`🌐 Verifying MX records for domain: ${domain}`)
      const hasMX = await checkDomainMX(domain)
      
      if (!hasMX) {
        console.log(`⚠️ Domain ${domain} does not have valid MX records, but continuing to check database...`)
        // Don't return null - still check database in case company exists
        // Some domains might not have MX records but company still exists
      } else {
        console.log(`✅ Domain ${domain} has valid MX records`)
      }
    } catch (error) {
      console.error(`❌ Error checking MX records for ${domain}:`, error)
      // Continue to check database even if MX check fails
    }
  } else {
    console.log(`⏭️ Skipping MX check for domain: ${domain}`)
  }

  // Search for company by domain
  try {
    const company = await CompanyModel.findOne({ domain })
    
    if (company) {
      console.log(`✅ Found existing company for domain ${domain}: ${company.companyName} (${company.companyId})`)
      return company
    } else {
      console.log(`ℹ️ No company found for domain: ${domain}`)
    }
  } catch (error) {
    console.error(`❌ Error searching for company by domain ${domain}:`, error)
    return null
  }

  return null
}

