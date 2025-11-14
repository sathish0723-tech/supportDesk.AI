import { auth } from '@clerk/nextjs/server'

/**
 * Fetch company data from Gemini API based on company name
 * POST /api/companies/fetch-gemini
 */
export async function POST(req) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { companyName, domain } = await req.json()

    if (!companyName && !domain) {
      return Response.json(
        { success: false, error: 'Company name or domain is required' },
        { status: 400 }
      )
    }

    // Get Gemini API key from environment variable (server-side)
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!geminiApiKey) {
      return Response.json(
        { success: false, error: 'Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    // Use domain or company name for lookup
    const searchTerm = domain || companyName
    
    // Call Gemini API to get company information
    // Try multiple models in order (using correct model names from API)
    const modelsToTry = [
      'gemini-2.5-flash',           // Stable, fast model
      'gemini-2.0-flash',           // Stable alternative
      'gemini-2.0-flash-exp',       // Experimental (may have quota issues)
      'gemini-flash-latest',        // Latest stable flash
      'gemini-2.5-flash-lite'       // Lightweight option
    ]
    
    const prompt = `Provide detailed information about ${domain ? `the company with domain "${domain}"` : `the company "${companyName}"`}. 
    Return a JSON object with the following structure:
    {
      "companyName": "exact company name",
      "industry": "primary industry",
      "website": "company website URL if available",
      "description": "brief company description",
      "headquarters": "headquarters location if available",
      "founded": "year founded if available",
      "employees": "employee count range if available"
    }
    Only return valid JSON, no additional text.`

    // Helper function to make API call
    const makeGeminiRequest = async (modelName) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      })
    }

    // Try first model
    let response = await makeGeminiRequest(modelsToTry[0])

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = await response.text()
      }
      
      console.error('Gemini API error:', errorData)
      
      // Try fallback models if the first one fails
      if (response.status === 404) {
        for (let i = 1; i < modelsToTry.length; i++) {
          console.log(`Trying fallback model: ${modelsToTry[i]}`)
          const fallbackResponse = await makeGeminiRequest(modelsToTry[i])
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            // Process fallback response
            const text = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || ''
            let companyInfo = {}
            try {
              const jsonMatch = text.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                companyInfo = JSON.parse(jsonMatch[0])
              } else {
                companyInfo = JSON.parse(text)
              }
            } catch (parseError) {
              console.error('Error parsing fallback response:', parseError)
              continue // Try next model
            }
            
            // Get company logo from domain
            let logoUrl = null
            if (domain) {
              const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
              logoUrl = `https://logo.clearbit.com/${cleanDomain}`
            } else if (companyInfo.website) {
              const cleanDomain = companyInfo.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
              logoUrl = `https://logo.clearbit.com/${cleanDomain}`
            }
            
            const mappedData = {
              companyName: companyInfo.companyName || companyName,
              industry: companyInfo.industry || '',
              website: companyInfo.website || (domain ? `https://${domain.replace(/^https?:\/\//, '').replace(/^www\./, '')}` : ''),
              address: companyInfo.headquarters || '',
              totalEmployees: companyInfo.employees || '',
              description: companyInfo.description || '',
              logo: logoUrl,
              domain: domain || (companyInfo.website ? companyInfo.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : ''),
            }
            
            return Response.json({
              success: true,
              data: mappedData,
              message: `Company data fetched successfully (using ${modelsToTry[i]})`
            })
          }
        }
      }
      
      // Handle specific error types
      let errorMessage = 'Failed to fetch company data from Gemini API'
      let errorDetails = null
      
      if (errorData?.error) {
        if (errorData.error.code === 429) {
          errorMessage = 'Gemini API quota exceeded'
          errorDetails = errorData.error.message || 'You have exceeded your API quota. Please check your billing or wait for quota reset.'
        } else if (errorData.error.code === 401) {
          errorMessage = 'Invalid Gemini API key'
          errorDetails = 'The API key is invalid or expired. Please check your API key.'
        } else if (errorData.error.code === 404) {
          errorMessage = 'Gemini model not found'
          errorDetails = 'The requested model is not available. All fallback models were tried.'
        } else {
          errorDetails = errorData.error.message || JSON.stringify(errorData.error)
        }
      } else if (errorData?.message) {
        errorDetails = errorData.message
      }
      
      // Return detailed error
      return Response.json(
        { 
          success: false, 
          error: errorMessage,
          details: errorDetails,
          code: errorData?.error?.code || response.status
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Extract text from Gemini response
    let companyInfo = {}
    try {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        companyInfo = JSON.parse(jsonMatch[0])
      } else {
        // Fallback: parse the entire text as JSON
        companyInfo = JSON.parse(text)
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      // Return partial data if parsing fails
      return Response.json({
        success: true,
        data: {
          companyName: companyName,
          industry: '',
          website: '',
          description: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        },
        message: 'Company data fetched but parsing failed'
      })
    }

    // Get company logo from domain
    let logoUrl = null
    if (domain) {
      // Use Clearbit Logo API (free, no API key needed)
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
      logoUrl = `https://logo.clearbit.com/${cleanDomain}`
    } else if (companyInfo.website) {
      const cleanDomain = companyInfo.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
      logoUrl = `https://logo.clearbit.com/${cleanDomain}`
    }

    // Map Gemini response to our form fields
    const mappedData = {
      companyName: companyInfo.companyName || companyName,
      industry: companyInfo.industry || '',
      website: companyInfo.website || (domain ? `https://${domain.replace(/^https?:\/\//, '').replace(/^www\./, '')}` : ''),
      address: companyInfo.headquarters || '',
      totalEmployees: companyInfo.employees || '',
      description: companyInfo.description || '',
      logo: logoUrl,
      domain: domain || (companyInfo.website ? companyInfo.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : ''),
    }

    return Response.json({
      success: true,
      data: mappedData,
      message: 'Company data fetched successfully'
    })

  } catch (error) {
    console.error('Error fetching company data from Gemini:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

