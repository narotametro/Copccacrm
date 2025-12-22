import { Context } from 'npm:hono';
import * as kv from './kv_store.tsx';

export interface Task {
  id: number;
  title: string;
  description: string;
  assignedTo: string | number; // user_id (UUID string or legacy number)
  assignedBy: string | number; // admin user_id (UUID string or legacy number)
  assignedByName: string;
  assignedToName: string;
  assignedToPhone: string;
  status: 'assigned' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  feedback?: string;
  completedAt?: string;
}

const TASKS_PREFIX = 'tasks';

// Get all tasks
export async function getAllTasks(c: Context) {
  try {
    let tasks = [];
    try {
      tasks = await kv.getByPrefix(TASKS_PREFIX);
    } catch (kvError: any) {
      console.error('KV store error when fetching tasks:', kvError);
      // Return empty array if KV store has issues
      return c.json({ 
        success: true, 
        records: []
      });
    }
    
    return c.json({ 
      success: true, 
      records: tasks.sort((a: Task, b: Task) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return c.json({ success: true, records: [], error: error.message });
  }
}

// Get tasks by user (for regular users to see their tasks)
export async function getTasksByUser(c: Context) {
  try {
    const userId = c.req.query('userId') || '';
    if (!userId) {
      return c.json({ success: true, records: [] });
    }

    let allTasks = [];
    try {
      allTasks = await kv.getByPrefix(TASKS_PREFIX);
    } catch (kvError: any) {
      console.error('KV store error when fetching user tasks:', kvError);
      return c.json({ success: true, records: [] });
    }
    
    // Compare as strings to handle both UUID and numeric IDs
    const userTasks = allTasks.filter((task: Task) => String(task.assignedTo) === String(userId));
    
    console.log(`Found ${userTasks.length} tasks for user ${userId}`);
    
    return c.json({ 
      success: true, 
      records: userTasks.sort((a: Task, b: Task) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error: any) {
    console.error('Error fetching user tasks:', error);
    return c.json({ success: true, records: [] });
  }
}

// Create task (admin only)
export async function createTask(c: Context) {
  try {
    const body = await c.req.json();
    
    console.log('Creating task with body:', JSON.stringify(body, null, 2));
    
    if (!body.title || !body.assignedTo || !body.assignedBy) {
      return c.json({ 
        success: false, 
        error: 'Title, assignedTo, and assignedBy are required' 
      }, 400);
    }

    const allTasks = await kv.getByPrefix(TASKS_PREFIX);
    const newId = allTasks.length > 0 
      ? Math.max(...allTasks.map((t: Task) => t.id)) + 1 
      : 1;

    const now = new Date().toISOString();
    const newTask: Task = {
      id: newId,
      title: body.title,
      description: body.description || '',
      assignedTo: body.assignedTo,
      assignedBy: body.assignedBy,
      assignedByName: body.assignedByName || 'Admin',
      assignedToName: body.assignedToName || 'User',
      assignedToPhone: body.assignedToPhone || '',
      status: 'assigned',
      priority: body.priority || 'medium',
      dueDate: body.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
      updatedAt: now,
      feedback: '',
    };

    console.log('New task created:', JSON.stringify(newTask, null, 2));
    await kv.set(`${TASKS_PREFIX}:${newId}`, newTask);

    return c.json({ success: true, record: newTask }, 201);
  } catch (error: any) {
    console.error('Error creating task:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

// Update task (both admin and user can update)
export async function updateTask(c: Context) {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();

    const existingTask = await kv.get(`${TASKS_PREFIX}:${id}`) as Task;
    if (!existingTask) {
      return c.json({ success: false, error: 'Task not found' }, 404);
    }

    const updatedTask: Task = {
      ...existingTask,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    // If status is completed and not already completed, set completedAt
    if (body.status === 'completed' && existingTask.status !== 'completed') {
      updatedTask.completedAt = new Date().toISOString();
    }

    await kv.set(`${TASKS_PREFIX}:${id}`, updatedTask);

    return c.json({ success: true, record: updatedTask });
  } catch (error: any) {
    console.error('Error updating task:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

// Update task status (quick status update)
export async function updateTaskStatus(c: Context) {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();

    console.log('updateTaskStatus called - Task ID:', id, 'Body:', JSON.stringify(body));

    if (!body.status) {
      console.error('Status is missing from request body');
      return c.json({ success: false, error: 'Status is required' }, 400);
    }

    const existingTask = await kv.get(`${TASKS_PREFIX}:${id}`) as Task;
    if (!existingTask) {
      console.error('Task not found:', id);
      return c.json({ success: false, error: 'Task not found' }, 404);
    }

    console.log('Existing task:', JSON.stringify(existingTask));

    const updatedTask: Task = {
      ...existingTask,
      status: body.status,
      feedback: body.feedback || existingTask.feedback,
      updatedAt: new Date().toISOString(),
    };

    // If status is completed and not already completed, set completedAt
    if (body.status === 'completed' && existingTask.status !== 'completed') {
      updatedTask.completedAt = new Date().toISOString();
      console.log('Task marked as completed at:', updatedTask.completedAt);
    }

    await kv.set(`${TASKS_PREFIX}:${id}`, updatedTask);
    console.log('Task updated successfully:', JSON.stringify(updatedTask));

    return c.json({ success: true, record: updatedTask });
  } catch (error: any) {
    console.error('Error updating task status:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

// Delete task (admin only)
export async function deleteTask(c: Context) {
  try {
    const id = parseInt(c.req.param('id'));

    const existingTask = await kv.get(`${TASKS_PREFIX}:${id}`);
    if (!existingTask) {
      return c.json({ success: false, error: 'Task not found' }, 404);
    }

    await kv.del(`${TASKS_PREFIX}:${id}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

// Get task statistics
export async function getTaskStats(c: Context) {
  try {
    const userId = c.req.query('userId');
    const allTasks = await kv.getByPrefix(TASKS_PREFIX);
    
    let tasks = allTasks;
    if (userId) {
      tasks = allTasks.filter((task: Task) => task.assignedTo === parseInt(userId));
    }

    const stats = {
      total: tasks.length,
      assigned: tasks.filter((t: Task) => t.status === 'assigned').length,
      inProgress: tasks.filter((t: Task) => t.status === 'in_progress').length,
      completed: tasks.filter((t: Task) => t.status === 'completed').length,
      overdue: tasks.filter((t: Task) => {
        if (t.status === 'completed') return false;
        return new Date(t.dueDate) < new Date();
      }).length,
      highPriority: tasks.filter((t: Task) => t.priority === 'high' && t.status !== 'completed').length,
    };

    return c.json({ success: true, stats });
  } catch (error: any) {
    console.error('Error fetching task stats:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}