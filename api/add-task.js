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

    const { title, priority = 'medium' } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
    }

    const { data: task, error } = await supabase
      .from('todos')
      .insert({
        user_id: userId,
        title: title.trim(),
        priority,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding task:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add task'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task added successfully',
      task
    });

  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = handler;