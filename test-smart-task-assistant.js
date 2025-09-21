// Smart Task Assistant Diagnostic Script
// Run this in browser console to test the AI integration

async function testSmartTaskAssistant() {
  console.log('🧪 Testing Smart Task Assistant Integration...\n');
  
  try {
    // Test Firebase Functions connection
    console.log('1. Testing Firebase Functions connection...');
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    console.log('✅ Firebase Functions initialized');
    
    // Test aiChat function directly
    console.log('\n2. Testing aiChat function...');
    const aiChat = httpsCallable(functions, 'aiChat');
    
    const testPrompt = 'Analyze this task: Write a project report by Friday';
    console.log('📝 Sending test prompt:', testPrompt);
    
    const result = await aiChat({
      data: {
        message: `Analyze this task description and extract structured information:
        "${testPrompt}"
        
        Return JSON with: category, priority (low/medium/high), estimatedDuration (minutes), deadline (if mentioned), subtasks (array), tags (array)`,
        model: 'deepseek-reasoner',
        temperature: 1.0
      }
    });
    
    console.log('✅ Firebase function response:', result);
    
    if (result.data && result.data.result && result.data.result.response) {
      console.log('📋 Raw AI response:', result.data.result.response);
      
      try {
        const parsed = JSON.parse(result.data.result.response);
        console.log('✨ Parsed task analysis:', parsed);
        console.log('\n🎉 SUCCESS: Smart Task Assistant is working with real AI!');
        return true;
      } catch (parseError) {
        console.log('❌ Failed to parse AI response as JSON:', parseError);
        console.log('🔄 This means the AI is responding but not in expected format');
        return false;
      }
    } else {
      console.log('❌ Invalid response structure from Firebase function');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Smart Task Assistant test failed:', error);
    
    if (error.message?.includes('DeepSeek API key not configured')) {
      console.log('\n🔧 ISSUE: DeepSeek API key not configured in Firebase Functions');
      console.log('SOLUTION: Configure REACT_APP_DEEPSEEK_API_KEY in Firebase Functions environment');
    } else if (error.message?.includes('permission')) {
      console.log('\n🔧 ISSUE: Permission error accessing Firebase Functions');
      console.log('SOLUTION: Check Firebase authentication and function deployment');
    } else {
      console.log('\n🔧 ISSUE: Unknown error - check network and Firebase configuration');
    }
    
    return false;
  }
}

// Auto-run test
testSmartTaskAssistant().then(success => {
  console.log('\n📊 DIAGNOSIS RESULT:');
  if (success) {
    console.log('✅ Smart Task Assistant should be working with real AI');
    console.log('💡 If you still see mock data, try refreshing the page');
  } else {
    console.log('❌ Smart Task Assistant is likely falling back to mock data');
    console.log('🔧 Check the issues noted above and try again');
  }
});

console.log('\n📋 Manual Commands:');
console.log('- Run testSmartTaskAssistant() to test again');
console.log('- Check Network tab for Firebase function calls');
console.log('- Try using the Smart Task Assistant on dashboard');