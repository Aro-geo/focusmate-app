class TaskAnalysisService {
  private readonly baseUrl = 'https://analyzetask-juyojvwr7q-uc.a.run.app';

  async analyzeTask(taskTitle: string, taskDescription?: string): Promise<{
    complexity: number;
    estimatedDuration: number;
    priority: 'low' | 'medium' | 'high';
    suggestions: string[];
    tags: string[];
  }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: taskTitle,
          description: taskDescription || ''
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        complexity: result.complexity || 5,
        estimatedDuration: result.estimatedDuration || 30,
        priority: result.priority || 'medium',
        suggestions: result.suggestions || [],
        tags: result.tags || []
      };
    } catch (error) {
      console.error('Error analyzing task:', error);
      // Fallback to basic analysis
      return {
        complexity: 5,
        estimatedDuration: 30,
        priority: 'medium',
        suggestions: ['Break this task into smaller steps', 'Set a specific time to work on this'],
        tags: ['general']
      };
    }
  }

  async analyzeTasks(tasks: Array<{ title: string; description?: string }>): Promise<Array<{
    complexity: number;
    estimatedDuration: number;
    priority: 'low' | 'medium' | 'high';
    suggestions: string[];
    tags: string[];
  }>> {
    const analyses = await Promise.all(
      tasks.map(task => this.analyzeTask(task.title, task.description))
    );
    return analyses;
  }
}

export const taskAnalysisService = new TaskAnalysisService();