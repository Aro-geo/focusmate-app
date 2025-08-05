const { corsMiddleware, securityHeaders } = require('../middleware/cors');
const { authenticateToken } = require('../middleware/auth');

/**
 * AI-powered Task Prioritization API endpoint
 * Intelligently prioritizes tasks based on multiple factors
 */
async function handler(req, res) {
  corsMiddleware(req, res, () => {});
  securityHeaders(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const authResult = await authenticateToken(req);
    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { tasks, userState } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        message: 'Tasks array is required'
      });
    }

    // Intelligent task prioritization
    const prioritizedTasks = prioritizeTasksIntelligently(tasks, userState);

    return res.status(200).json({
      success: true,
      data: prioritizedTasks,
      message: 'Tasks prioritized successfully'
    });

  } catch (error) {
    console.error('Task prioritization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during task prioritization'
    });
  }
}

/**
 * Intelligent task prioritization algorithm
 */
function prioritizeTasksIntelligently(tasks, userState = {}) {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  
  // Scoring factors
  const scoringFactors = {
    urgency: 0.3,      // Due date proximity
    importance: 0.25,   // Task importance/impact
    energy: 0.2,       // User energy vs task requirements
    momentum: 0.15,    // Task dependencies and flow
    context: 0.1       // Time of day and context suitability
  };

  const scoredTasks = tasks.map(task => {
    let totalScore = 0;
    const scoring = {};

    // 1. Urgency Score (0-10)
    const urgencyScore = calculateUrgencyScore(task, currentTime);
    scoring.urgency = urgencyScore;
    totalScore += urgencyScore * scoringFactors.urgency;

    // 2. Importance Score (0-10)
    const importanceScore = calculateImportanceScore(task);
    scoring.importance = importanceScore;
    totalScore += importanceScore * scoringFactors.importance;

    // 3. Energy Match Score (0-10)
    const energyScore = calculateEnergyScore(task, userState, currentHour);
    scoring.energy = energyScore;
    totalScore += energyScore * scoringFactors.energy;

    // 4. Momentum Score (0-10)
    const momentumScore = calculateMomentumScore(task, tasks);
    scoring.momentum = momentumScore;
    totalScore += momentumScore * scoringFactors.momentum;

    // 5. Context Score (0-10)
    const contextScore = calculateContextScore(task, currentHour, userState);
    scoring.context = contextScore;
    totalScore += contextScore * scoringFactors.context;

    return {
      ...task,
      priority_score: Math.round(totalScore * 10) / 10,
      scoring_breakdown: scoring,
      reasoning: generatePriorityReasoning(task, scoring, currentHour)
    };
  });

  // Sort by priority score (highest first)
  return scoredTasks.sort((a, b) => b.priority_score - a.priority_score);
}

/**
 * Calculate urgency score based on due dates and deadlines
 */
function calculateUrgencyScore(task, currentTime) {
  if (!task.due_date && !task.deadline) return 5; // Default medium urgency

  const dueDate = new Date(task.due_date || task.deadline);
  const timeDiff = dueDate.getTime() - currentTime.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24);

  if (daysDiff < 0) return 10; // Overdue
  if (daysDiff < 1) return 9;  // Due today
  if (daysDiff < 2) return 8;  // Due tomorrow
  if (daysDiff < 7) return 6;  // Due this week
  if (daysDiff < 30) return 4; // Due this month
  return 2; // Due later
}

/**
 * Calculate importance score based on task attributes
 */
function calculateImportanceScore(task) {
  let score = 5; // Default medium importance

  // Priority indicators
  if (task.priority === 'high' || task.important === true) score += 3;
  if (task.priority === 'low') score -= 2;

  // Impact indicators
  const highImpactKeywords = ['critical', 'urgent', 'important', 'key', 'major', 'essential'];
  const taskText = (task.title + ' ' + (task.description || '')).toLowerCase();
  
  highImpactKeywords.forEach(keyword => {
    if (taskText.includes(keyword)) score += 1;
  });

  // Project/goal alignment
  if (task.project && task.project.includes('goal')) score += 1;
  if (task.category === 'work' || task.category === 'career') score += 1;

  return Math.min(Math.max(score, 1), 10);
}

/**
 * Calculate energy match score
 */
function calculateEnergyScore(task, userState, currentHour) {
  const userEnergy = getUserEnergyLevel(currentHour, userState);
  const taskEnergyRequirement = getTaskEnergyRequirement(task);

  // Perfect match gets highest score
  if (Math.abs(userEnergy - taskEnergyRequirement) <= 1) return 10;
  if (Math.abs(userEnergy - taskEnergyRequirement) <= 2) return 8;
  if (Math.abs(userEnergy - taskEnergyRequirement) <= 3) return 6;
  return 4; // Poor energy match
}

/**
 * Get user energy level based on time and state
 */
function getUserEnergyLevel(hour, userState) {
  // Default energy patterns (can be personalized)
  const defaultEnergyPattern = {
    6: 6, 7: 7, 8: 8, 9: 9, 10: 9, 11: 8,
    12: 7, 13: 6, 14: 5, 15: 6, 16: 7, 17: 6,
    18: 5, 19: 4, 20: 3, 21: 3, 22: 2, 23: 2
  };

  let baseEnergy = defaultEnergyPattern[hour] || 5;

  // Adjust based on user state
  if (userState.mood === 'energetic') baseEnergy += 2;
  if (userState.mood === 'tired') baseEnergy -= 2;
  if (userState.recentBreak) baseEnergy += 1;

  return Math.min(Math.max(baseEnergy, 1), 10);
}

/**
 * Get task energy requirement
 */
function getTaskEnergyRequirement(task) {
  const taskText = (task.title + ' ' + (task.description || '')).toLowerCase();
  
  // High energy tasks
  const highEnergyKeywords = ['create', 'design', 'develop', 'analyze', 'plan', 'strategy', 'complex'];
  // Low energy tasks  
  const lowEnergyKeywords = ['email', 'check', 'update', 'review', 'organize', 'simple'];

  let energyLevel = 5; // Default medium energy

  highEnergyKeywords.forEach(keyword => {
    if (taskText.includes(keyword)) energyLevel += 1;
  });

  lowEnergyKeywords.forEach(keyword => {
    if (taskText.includes(keyword)) energyLevel -= 1;
  });

  return Math.min(Math.max(energyLevel, 1), 10);
}

/**
 * Calculate momentum score based on task flow and dependencies
 */
function calculateMomentumScore(task, allTasks) {
  let score = 5;

  // Quick wins get bonus during low energy
  const taskText = task.title.toLowerCase();
  if (taskText.includes('quick') || taskText.includes('simple')) {
    score += 2;
  }

  // Tasks that unblock others get priority
  const dependentTasks = allTasks.filter(t => 
    t.dependencies && t.dependencies.includes(task.id)
  );
  score += dependentTasks.length * 1.5;

  // Related tasks in sequence get bonus
  if (task.project) {
    const projectTasks = allTasks.filter(t => t.project === task.project);
    if (projectTasks.length > 1) score += 1;
  }

  return Math.min(Math.max(score, 1), 10);
}

/**
 * Calculate context score based on optimal timing
 */
function calculateContextScore(task, currentHour, userState) {
  let score = 5;

  const taskText = (task.title + ' ' + (task.description || '')).toLowerCase();

  // Morning tasks (creative, planning, complex)
  if (currentHour >= 8 && currentHour <= 11) {
    if (taskText.includes('plan') || taskText.includes('create') || taskText.includes('design')) {
      score += 3;
    }
  }

  // Afternoon tasks (communication, meetings, routine)
  if (currentHour >= 13 && currentHour <= 16) {
    if (taskText.includes('email') || taskText.includes('call') || taskText.includes('meeting')) {
      score += 2;
    }
  }

  // Evening tasks (review, organize, simple)
  if (currentHour >= 17) {
    if (taskText.includes('review') || taskText.includes('organize') || taskText.includes('plan tomorrow')) {
      score += 2;
    }
  }

  return Math.min(Math.max(score, 1), 10);
}

/**
 * Generate human-readable reasoning for prioritization
 */
function generatePriorityReasoning(task, scoring, currentHour) {
  const reasons = [];

  if (scoring.urgency >= 8) {
    reasons.push("High urgency due to approaching deadline");
  }
  if (scoring.importance >= 8) {
    reasons.push("High impact on goals/objectives");
  }
  if (scoring.energy >= 8) {
    reasons.push("Good match for current energy level");
  }
  if (scoring.momentum >= 8) {
    reasons.push("Will create positive momentum for other tasks");
  }
  if (scoring.context >= 8) {
    reasons.push("Optimal timing for this type of task");
  }

  // Provide at least one reason
  if (reasons.length === 0) {
    if (currentHour < 12) {
      reasons.push("Good task for morning focus time");
    } else {
      reasons.push("Suitable for current time period");
    }
  }

  return reasons.join("; ");
}

module.exports = handler;
module.exports.default = handler;
