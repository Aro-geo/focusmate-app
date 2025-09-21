// Trial Status Verification Script
// Run this in the browser console to check if subscription access is working

async function verifyTrialStatus() {
  console.log('🔍 Verifying Trial Status Access...\n');
  
  try {
    // Check if user is authenticated
    const user = window?.auth?.currentUser || window?.firebase?.auth()?.currentUser;
    if (!user) {
      console.log('❌ No authenticated user found');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    console.log('📧 User ID:', user.uid);
    
    // Try to access subscription service
    if (window?.subscriptionService || window?.SubscriptionService) {
      const subService = window.subscriptionService || window.SubscriptionService;
      
      console.log('\n🔄 Attempting to get subscription data...');
      
      try {
        const subscription = await subService.getUserSubscription(user.uid);
        console.log('✅ Subscription data retrieved:', subscription);
        
        if (subscription) {
          console.log('\n📊 Subscription Details:');
          console.log('Plan:', subscription.plan);
          console.log('Status:', subscription.status);
          console.log('Start Date:', subscription.startDate);
          console.log('End Date:', subscription.endDate);
          console.log('Trial Used:', subscription.trialUsed);
          
          if (subscription.plan === 'trial') {
            const trialDays = await subService.getTrialDaysRemaining(user.uid);
            console.log('📅 Trial Days Remaining:', trialDays);
            
            if (trialDays <= 0) {
              console.log('🔔 TRIAL EXPIRED ❌');
            } else {
              console.log('✅ TRIAL ACTIVE -', trialDays, 'days remaining');
            }
          } else {
            console.log('💎 User has paid subscription:', subscription.plan);
          }
          
          const aiRequests = await subService.getAIRequestsRemaining(user.uid);
          console.log('🤖 AI Requests Remaining:', aiRequests);
          
        } else {
          console.log('⚠️ No subscription found - initializing...');
        }
        
      } catch (error) {
        console.log('❌ Subscription access error:', error.message);
        if (error.message.includes('permissions')) {
          console.log('🔧 Still having permission issues - rules may need time to propagate');
        }
      }
      
    } else {
      console.log('❌ Subscription service not found in window object');
      console.log('🔧 Try accessing from React component instead');
    }
    
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
  }
}

// Auto-run verification
verifyTrialStatus();

console.log('\n📋 Manual Commands:');
console.log('- Run verifyTrialStatus() to check again');
console.log('- Check Network tab for any remaining 400/403 errors');
console.log('- Look for subscription-related success messages');