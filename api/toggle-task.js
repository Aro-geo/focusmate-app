const { supabase } = require('../lib/db');
const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { corsMiddleware, securityHeaders } = require('../middleware/cors');

async function handler(req, res) {
  corsMiddleware(req, res);
  securityHeaders(req, res);

  if (req.method !== 'POST') {
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

    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    // Get current task
    const { data: currentTask, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !currentTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Toggle completion status
    const newCompleted = !currentTask.completed;
    const newStatus = newCompleted ? 'completed' : 'pending';
    const updateData = {
      completed: newCompleted,
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    const { data: task, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling task:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to toggle task'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task
    });

  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = handler;
module.exports.default = handler;