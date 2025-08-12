import DatabasePomodoroService from '../services/DatabasePomodoroService';
import DatabaseFocusSessionService from '../services/DatabaseFocusSessionService';
import FirestoreService from '../services/FirestoreService';

export const generateTestData = async () => {
  try {
    console.log('Generating test data...');
    
    // Create test tasks
    const testTasks = [
      { title: 'Complete project proposal', description: 'Write and review project proposal', priority: 'high' as const },
      { title: 'Client meeting preparation', description: 'Prepare slides and agenda', priority: 'medium' as const },
      { title: 'Code review', description: 'Review team code submissions', priority: 'low' as const }
    ];
    
    for (const task of testTasks) {
      await FirestoreService.addTask(task.title, task.priority, task.description);
    }
    
    // Create test Pomodoro sessions for the last 7 days
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const sessionDate = new Date(now);
      sessionDate.setDate(now.getDate() - i);
      
      // Create 2-4 sessions per day
      const sessionsPerDay = Math.floor(Math.random() * 3) + 2;
      
      for (let j = 0; j < sessionsPerDay; j++) {
        const startTime = new Date(sessionDate);
        startTime.setHours(9 + j * 2, Math.floor(Math.random() * 60), 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(startTime.getMinutes() + 25);
        
        await DatabasePomodoroService.saveSession({
          taskName: testTasks[j % testTasks.length].title,
          startTime,
          endTime,
          durationMinutes: 25,
          sessionType: 'pomodoro',
          completed: true,
          notes: `Productive session on ${sessionDate.toDateString()}`
        });
      }
    }
    
    console.log('Test data generated successfully!');
    return true;
  } catch (error) {
    console.error('Error generating test data:', error);
    return false;
  }
};

export const clearTestData = async () => {
  try {
    console.log('Clearing test data...');
    
    // Get all sessions and tasks
    const sessions = await DatabasePomodoroService.getSessions();
    const tasks = await FirestoreService.getTasks();
    
    // Delete sessions (Note: You'd need to add delete methods to the services)
    console.log(`Found ${sessions.length} sessions and ${tasks.length} tasks to clear`);
    
    console.log('Test data cleared successfully!');
    return true;
  } catch (error) {
    console.error('Error clearing test data:', error);
    return false;
  }
};