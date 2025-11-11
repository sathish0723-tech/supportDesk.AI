/**
 * List Available Gemini Models
 * Run: node list-gemini-models.js
 */

const GEMINI_API_KEY = "AIzaSyAJq4xxFIi3l9rUh8kmiG8RV3lr3WdIHyA"

async function listModels() {
  console.log('🔍 Listing Available Gemini Models...\n')
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (response.ok && data.models) {
      console.log('✅ Available Models:')
      console.log('')
      
      const generateContentModels = data.models
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => ({
          name: m.name,
          displayName: m.displayName,
          description: m.description
        }))
      
      generateContentModels.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name}`)
        console.log(`   Display: ${model.displayName || 'N/A'}`)
        console.log(`   Description: ${model.description?.substring(0, 80) || 'N/A'}...`)
        console.log('')
      })
      
      if (generateContentModels.length === 0) {
        console.log('❌ No models found that support generateContent')
      } else {
        console.log(`\n✅ Found ${generateContentModels.length} models that support generateContent`)
        console.log('\nRecommended model to use:')
        const recommended = generateContentModels.find(m => 
          m.name.includes('flash') || m.name.includes('pro')
        ) || generateContentModels[0]
        console.log(`   ${recommended.name}`)
      }
    } else {
      console.log('❌ Failed to list models')
      if (data.error) {
        console.log(`   Error: ${data.error.message}`)
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

listModels()


