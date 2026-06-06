import { config } from './config.js';
import { generateOutreachMessage } from './modules/templateEngine.js';
import { scoreLead } from './modules/aiScorer.js';

async function testGeminiConnection() {
  const aiConfig = config.aiProvider.active;
  
  console.log('='.repeat(60));
  console.log(`Testing ${config.aiProvider.provider.toUpperCase()} Configuration`);
  console.log('='.repeat(60));
  console.log(`Provider: ${config.aiProvider.provider}`);
  console.log(`API Key present: ${aiConfig.apiKey ? '✓ Yes' : '✗ No'}`);
  console.log(`Base URL: ${aiConfig.baseUrl}`);
  console.log(`Model: ${aiConfig.model}`);
  console.log('='.repeat(60));

  if (!aiConfig.apiKey) {
    console.error('\n✗ No API key found!');
    return false;
  }

  try {
    console.log('\n[1/3] Testing basic API connection...');
    
    const payload = {
      model: aiConfig.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello from Gemini 3.5 Flash!" and nothing else.' }
      ],
      temperature: 0.2
    };

    const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aiConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`✗ API error ${response.status}: ${errorText}`);
      return false;
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message?.content || '';
    console.log(`✓ Success! Response: "${message}"`);
    
  } catch (error) {
    console.error(`✗ Connection test failed: ${error.message}`);
    return false;
  }

  try {
    console.log('\n[2/3] Testing message generation...');
    
    const testContact = {
      name: 'Sharma Dental Clinic',
      number: '918979909409',
      business_type: 'Dental clinic',
      notable_info: 'Great Google reviews',
      has_website: false,
      running_ads: false
    };

    const message = await generateOutreachMessage(testContact);
    console.log(`✓ Generated message:\n   "${message}"`);
    
  } catch (error) {
    console.error(`✗ Message generation failed: ${error.message}`);
    return false;
  }

  try {
    console.log('\n[3/3] Testing lead scoring...');
    
    const testContact = {
      name: 'Sharma Dental Clinic',
      number: '918979909409',
      business_type: 'Dental clinic',
      notable_info: 'Great Google reviews',
      has_website: false,
      running_ads: false,
      conversation: [
        {
          from: 'you',
          text: 'Hi, I noticed your dental clinic has great reviews but no website. Would you be interested in one?',
          at: new Date().toISOString()
        },
        {
          from: 'them',
          text: 'Yes! We\'ve been wanting one for a while. What are your rates?',
          at: new Date().toISOString()
        }
      ]
    };

    const score = await scoreLead(testContact);
    if (score) {
      console.log(`✓ Lead scored successfully:`);
      console.log(`   Score: ${score.score}`);
      console.log(`   Reason: ${score.reason}`);
    } else {
      console.error('✗ Scoring returned null');
      return false;
    }
    
  } catch (error) {
    console.error(`✗ Lead scoring failed: ${error.message}`);
    return false;
  }

  console.log('\n' + '='.repeat(60));
  console.log('✓ All tests passed! Gemini integration is working correctly.');
  console.log('='.repeat(60));
  return true;
}

testGeminiConnection().catch(error => {
  console.error('\n✗ Fatal error:', error);
  process.exit(1);
});