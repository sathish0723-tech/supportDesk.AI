/**
 * Test Gemini API Connection
 * Run: node test-gemini-api.js
 */

const GEMINI_API_KEY = "AIzaSyAJq4xxFIi3l9rUh8kmiG8RV3lr3WdIHyA"

const modelsToTry = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash', 
  'gemini-1.5-pro',
  'gemini-pro'
]

async function testGeminiAPI() {
  console.log('🔍 Testing Gemini API Connection...\n')
  console.log(`API Key: ${GEMINI_API_KEY.substring(0, 20)}...`)
  console.log('')

  const prompt = `Provide information about the company "Google". 
  Return a JSON object with: {"companyName": "Google", "industry": "Technology"}`

  for (const model of modelsToTry) {
    console.log(`📡 Testing model: ${model}`)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
    
    try {
      const response = await fetch(url, {
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

      const data = await response.json()

      if (response.ok) {
        console.log(`✅ SUCCESS with ${model}!`)
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        console.log(`Response preview: ${text.substring(0, 100)}...`)
        console.log('')
        return { success: true, model }
      } else {
        console.log(`❌ FAILED: ${response.status}`)
        if (data.error) {
          console.log(`   Code: ${data.error.code}`)
          console.log(`   Message: ${data.error.message?.substring(0, 150)}...`)
          
          if (data.error.code === 429) {
            console.log('   ⚠️  QUOTA EXCEEDED - Wait or upgrade plan')
          } else if (data.error.code === 401) {
            console.log('   ⚠️  INVALID API KEY - Check your API key')
          } else if (data.error.code === 404) {
            console.log('   ⚠️  MODEL NOT FOUND - Trying next model...')
            console.log('')
            continue
          }
        }
        console.log('')
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`)
      console.log('')
    }
  }

  console.log('❌ All models failed. Check your API key and quota.')
  process.exit(1)
}

testGeminiAPI()

