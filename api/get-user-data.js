const { supabase } = require('../lib/db');
const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { corsMiddleware, securityHeaders } = require('../middleware/cors');

async function handler(req, res) {
  corsMiddleware(req, res);
  securityHeaders(req, res);

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, username, full_name, created_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
    }

    const userTasks = tasks || [];
    const completedTasks = userTasks.filter(task => task.status === 'completed').length;
    const totalTasks = userTasks.length;

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        username: user.username || user.email.split('@')[0],
        email: user.email,
        created_at: user.created_at,
        tasks: userTasks,
        stats: {
          totalTasks,
          completedTasks,
          pendingTasks: totalTasks - completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error('Get user data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = handler;
module.exports.default = handler;