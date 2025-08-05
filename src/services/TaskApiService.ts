interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  status: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  user_id: number;
}

class TaskApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || '';
  }

  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json'
    };
  }

  async addTask(title: string, priority: string = 'medium'): Promise<Task> {
    const response = await fetch(`${this.baseURL}/add-task`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ title, priority })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add task');
    }

    return data.task;
  }

  async toggleTask(taskId: number): Promise<Task> {
    const response = await fetch(`${this.baseURL}/toggle-task`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ taskId })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to toggle task');
    }

    return data.task;
  }

  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${this.baseURL}/get-user-data`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get tasks');
    }

    return data.data?.tasks || [];
  }
}

export default new TaskApiService();