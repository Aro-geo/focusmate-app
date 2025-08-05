const { corsMiddleware, securityHeaders } = require('../middleware/cors');
const { authenticateToken } = require('../middleware/auth');

/**
 * Enhanced AI Task Analysis API endpoint
 * Analyzes tasks for complexity, duration, and optimal approach
 */
async function handler(req, res) {
  // Apply CORS and security headers
  corsMiddleware(req, res, () => {});
  securityHeaders(req, res);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Authenticate user
    const authResult = await authenticateToken(req);
    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { taskDescription, userContext } = req.body;

    if (!taskDescription) {
      return res.status(400).json({
        success: false,
        message: 'Task description is required'
      });
    }

    // For now, provide intelligent fallback analysis
    // In production, this would integrate with OpenAI GPT-4
    const analysis = analyzeTaskLocally(taskDescription, userContext);

    return res.status(200).json({
      success: true,
      data: analysis,
      message: 'Task analysis completed'
    });

  } catch (error) {
    console.error('AI task analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during task analysis'
    });
  }
}

/**
 * Local task analysis with intelligent algorithms
 * This simulates AI analysis while providing valuable insights
 */
function analyzeTaskLocally(taskDescription, userContext = {}) {
  const words = taskDescription.toLowerCase();
  const wordCount = taskDescription.split(' ').length;
  
  // Complexity analysis based on keywords and length
  let complexity = Math.min(Math.max(Math.floor(wordCount / 4), 1), 10);
  
  // Adjust complexity based on keywords
  const complexKeywords = ['research', 'analyze', 'design', 'develop', 'create', 'strategic', 'complex', 'detailed'];
  const simpleKeywords = ['email', 'call', 'check', 'review', 'update', 'quick', 'simple'];
  
  complexKeywords.forEach(keyword => {
    if (words.includes(keyword)) complexity += 1;
  });
  
  simpleKeywords.forEach(keyword => {
    if (words.includes(keyword)) complexity = Math.max(complexity - 1, 1);
  });
  
  complexity = Math.min(complexity, 10);

  // Estimated duration based on complexity and task type
  let estimatedDuration;
  if (complexity <= 3) estimatedDuration = 15 + (complexity * 5);
  else if (complexity <= 6) estimatedDuration = 30 + (complexity * 10);
  else estimatedDuration = 60 + (complexity * 15);

  // Suggested approach based on complexity
  const approaches = {
    low: [
      "Start immediately - this is a quick task",
      "Set a timer to maintain focus",
      "Complete in one session if possible"
    ],
    medium: [
      "Break into 2-3 smaller steps",
      "Allocate focused time blocks",
      "Prepare necessary resources beforehand",
      "Plan for potential obstacles"
    ],
    high: [
      "Divide into multiple smaller tasks",
      "Research and plan before execution",
      "Schedule over multiple sessions",
      "Identify key milestones",
      "Prepare comprehensive resources"
    ]
  };

  const complexityLevel = complexity <= 3 ? 'low' : complexity <= 6 ? 'medium' : 'high';
  
  // Optimal time slots based on complexity
  const timeSlots = {
    low: ["morning", "afternoon", "evening"],
    medium: ["morning", "afternoon"],
    high: ["morning"]
  };

  // Focus level required
  const focusLevel = complexity <= 3 ? 'low' : complexity <= 6 ? 'medium' : 'high';

  // Generate subtasks for complex tasks
  let subtasks = [];
  if (complexity > 6) {
    subtasks = generateSubtasks(taskDescription, complexity);
  }

  return {
    complexity,
    estimated_duration: estimatedDuration,
    suggested_approach: approaches[complexityLevel],
    optimal_time_slots: timeSlots[complexityLevel],
    required_focus_level: focusLevel,
    subtasks: subtasks.length > 0 ? subtasks : undefined,
    analysis_metadata: {
      word_count: wordCount,
      complexity_level: complexityLevel,
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate subtasks for complex tasks
 */
function generateSubtasks(taskDescription, complexity) {
  const words = taskDescription.toLowerCase();
  const subtasks = [];

  // Planning phase
  if (complexity > 7) {
    subtasks.push("Research and gather required information");
    subtasks.push("Create a detailed plan and timeline");
  }

  // Execution phases
  if (words.includes('write') || words.includes('document') || words.includes('report')) {
    subtasks.push("Create outline or structure");
    subtasks.push("Draft initial content");
    subtasks.push("Review and refine content");
  } else if (words.includes('design') || words.includes('create')) {
    subtasks.push("Define requirements and constraints");
    subtasks.push("Create initial design/prototype");
    subtasks.push("Iterate and improve");
  } else if (words.includes('analyze') || words.includes('research')) {
    subtasks.push("Gather and organize data");
    subtasks.push("Perform analysis");
    subtasks.push("Synthesize findings");
  } else {
    // Generic breakdown
    subtasks.push("Prepare workspace and resources");
    subtasks.push("Execute main task components");
    subtasks.push("Review and finalize");
  }

  // Quality assurance
  if (complexity > 8) {
    subtasks.push("Quality check and validation");
  }

  return subtasks;
}

module.exports = handler;
module.exports.default = handler;
