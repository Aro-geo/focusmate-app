// Diagnostic function to check trial status based on console errors
// This analyzes the error patterns to infer subscription state

export function analyzeTrialStatusFromConsoleErrors(consoleErrors: string[]): {
  status: 'trial_active' | 'trial_expired' | 'cannot_determine' | 'permissions_error';
  evidence: string[];
  recommendations: string[];
} {
  const evidence: string[] = [];
  const recommendations: string[] = [];
  
  // Check for permission errors
  const hasPermissionErrors = consoleErrors.some(error => 
    error.includes('Missing or insufficient permissions')
  );
  
  // Check for subscription-related errors
  const hasSubscriptionErrors = consoleErrors.some(error => 
    error.includes('Error getting user subscription') || 
    error.includes('Error saving user subscription') ||
    error.includes('Error initializing user subscription')
  );
  
  // Check for Firestore 400 errors
  const hasFirestore400Errors = consoleErrors.some(error => 
    error.includes('firestore.googleapis.com') && error.includes('400')
  );
  
  // Check for trial-related method calls
  const hasTrialMethodCalls = consoleErrors.some(error => 
    error.includes('getTrialDaysRemaining') ||
    error.includes('getAIRequestsRemaining')
  );
  
  if (hasPermissionErrors && hasSubscriptionErrors) {
    evidence.push('Firebase permission errors preventing subscription access');
    evidence.push('Subscription service cannot read/write subscription data');
    
    if (hasFirestore400Errors) {
      evidence.push('Firestore 400 errors indicate security rule violations');
    }
    
    if (hasTrialMethodCalls) {
      evidence.push('Application is trying to check trial status but failing');
    }
    
    recommendations.push('Deploy updated Firestore security rules for subscriptions collection');
    recommendations.push('Add subscription rules: match /subscriptions/{userId}');
    recommendations.push('Restart the application after deploying rules');
    
    return {
      status: 'permissions_error',
      evidence,
      recommendations
    };
  }
  
  // If we can't access subscription data, we can't determine trial status
  if (hasSubscriptionErrors) {
    evidence.push('Subscription service failures prevent status determination');
    recommendations.push('Fix subscription service access issues');
    
    return {
      status: 'cannot_determine',
      evidence,
      recommendations
    };
  }
  
  return {
    status: 'cannot_determine',
    evidence: ['Insufficient error information to determine trial status'],
    recommendations: ['Check subscription service logs and Firebase permissions']
  };
}

// Analysis of the provided console errors
const consoleErrors = [
  "Error getting user subscription: FirebaseError: Missing or insufficient permissions.",
  "Error saving user subscription: FirebaseError: Missing or insufficient permissions.",
  "Error initializing user subscription: FirebaseError: Missing or insufficient permissions.",
  "Failed to load resource: the server responded with a status of 400 ()",
  "Error getting user subscription: Error: Failed to initialize subscription",
  "getTrialDaysRemaining",
  "getAIRequestsRemaining"
];

const analysis = analyzeTrialStatusFromConsoleErrors(consoleErrors);

console.log('🔍 TRIAL STATUS ANALYSIS:');
console.log('Status:', analysis.status);
console.log('Evidence:', analysis.evidence);
console.log('Recommendations:', analysis.recommendations);

export default analysis;