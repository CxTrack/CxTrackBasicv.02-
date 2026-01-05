import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { DEMO_MODE, DEMO_STORAGE_KEYS, loadDemoData, saveDemoData, generateDemoId } from '@/config/demo.config';
import { MOCK_ADMIN_USER } from '@/contexts/AuthContext';
import { useOrganizationStore } from './organizationStore';

export type TaskType = 'call' | 'email' | 'sms' | 'follow_up' | 'meeting' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  show_on_calendar?: boolean;
  start_time?: string;
  end_time?: string;
  duration?: number;
  customer_id: string;
  customer_name: string;
  assigned_to?: string;
  outcome?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string, outcome: string) => Promise<Task>;
  getTasksByCustomer: (customerId: string) => Task[];
  getTasksByDate: (date: string) => Task[];
  getPendingTasks: () => Task[];
  getOverdueTasks: () => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: DEMO_MODE ? loadDemoData(DEMO_STORAGE_KEYS.tasks) || [] : [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    console.log('📋 Fetching tasks...');
    set({ loading: true, error: null });

    try {
      // DEMO MODE
      if (DEMO_MODE) {
        const tasks = loadDemoData(DEMO_STORAGE_KEYS.tasks) || [];
        console.log('✅ Loaded demo tasks:', tasks.length);
        set({ tasks, loading: false });
        return;
      }

      // PRODUCTION MODE
      const organizationId = useOrganizationStore.getState().currentOrganization?.id;
      if (!organizationId) {
        console.warn('⚠️ No organization ID found');
        set({ loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          customer:customers(id, name)
        `)
        .eq('organization_id', organizationId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const formattedTasks = (data || []).map(task => ({
        ...task,
        customer_name: task.customer?.name || '',
      }));

      console.log('✅ Loaded tasks from database:', formattedTasks.length);
      set({ tasks: formattedTasks, loading: false });
    } catch (error: any) {
      console.error('❌ Error fetching tasks:', error);
      set({ error: error.message, loading: false });
    }
  },

  createTask: async (data) => {
    console.log('📋 Creating task:', data);
    set({ loading: true, error: null });

    try {
      if (!data.customer_id) {
        throw new Error('Task must be linked to a customer');
      }

      // DEMO MODE
      if (DEMO_MODE) {
        const newTask: Task = {
          id: generateDemoId('task'),
          title: data.title || 'Untitled Task',
          description: data.description || '',
          type: data.type || 'other',
          priority: data.priority || 'medium',
          status: 'pending',
          due_date: data.due_date || new Date().toISOString().split('T')[0],
          show_on_calendar: data.show_on_calendar || false,
          start_time: data.start_time,
          end_time: data.end_time,
          duration: data.duration || 30,
          customer_id: data.customer_id,
          customer_name: data.customer_name || '',
          assigned_to: MOCK_ADMIN_USER.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: MOCK_ADMIN_USER.organization_id,
        };

        const tasks = [newTask, ...get().tasks];
        saveDemoData(DEMO_STORAGE_KEYS.tasks, tasks);

        set({ tasks, loading: false });
        console.log('✅ Task created (demo mode):', newTask);

        return newTask;
      }

      // PRODUCTION MODE
      const organizationId = useOrganizationStore.getState().currentOrganization?.id;
      if (!organizationId) {
        throw new Error('No organization found');
      }

      const userId = MOCK_ADMIN_USER.id;

      const insertData = {
        title: data.title || 'Untitled Task',
        description: data.description,
        category: data.type || 'other',
        priority: data.priority || 'medium',
        status: 'todo',
        due_date: data.due_date || new Date().toISOString().split('T')[0],
        due_time: data.start_time,
        customer_id: data.customer_id,
        assigned_to: data.assigned_to || userId,
        organization_id: organizationId,
        user_id: userId,
      };

      const { data: taskData, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select(`
          *,
          customer:customers(id, name)
        `)
        .single();

      if (error) throw error;

      const newTask: Task = {
        ...taskData,
        type: taskData.category as TaskType,
        status: taskData.status === 'todo' ? 'pending' : taskData.status as TaskStatus,
        show_on_calendar: false,
        customer_name: taskData.customer?.name || '',
      };

      set((state) => ({
        tasks: [newTask, ...state.tasks],
        loading: false,
      }));

      console.log('✅ Task created (database):', newTask);
      return newTask;
    } catch (error: any) {
      console.error('❌ Error creating task:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateTask: async (id, data) => {
    console.log('📋 Updating task:', id, data);
    set({ loading: true, error: null });

    try {
      // DEMO MODE
      if (DEMO_MODE) {
        const updatedTasks = get().tasks.map(task =>
          task.id === id
            ? { ...task, ...data, updated_at: new Date().toISOString() }
            : task
        );

        saveDemoData(DEMO_STORAGE_KEYS.tasks, updatedTasks);
        set({ tasks: updatedTasks, loading: false });

        const updatedTask = updatedTasks.find(t => t.id === id);
        console.log('✅ Task updated (demo mode):', updatedTask);

        return updatedTask!;
      }

      // PRODUCTION MODE
      const updateData: any = {};
      if (data.title) updateData.title = data.title;
      if (data.description) updateData.description = data.description;
      if (data.type) updateData.category = data.type;
      if (data.priority) updateData.priority = data.priority;
      if (data.status) {
        updateData.status = data.status === 'pending' ? 'todo' : data.status;
        if (data.status === 'completed') {
          updateData.completed_at = new Date().toISOString();
        }
      }
      if (data.due_date) updateData.due_date = data.due_date;
      if (data.start_time) updateData.due_time = data.start_time;
      if (data.assigned_to) updateData.assigned_to = data.assigned_to;
      if (data.outcome) updateData.notes = data.outcome;

      const { data: taskData, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          customer:customers(id, name)
        `)
        .single();

      if (error) throw error;

      const updatedTask: Task = {
        ...taskData,
        type: taskData.category as TaskType,
        status: taskData.status === 'todo' ? 'pending' : taskData.status as TaskStatus,
        show_on_calendar: false,
        customer_name: taskData.customer?.name || '',
      };

      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
        loading: false,
      }));

      console.log('✅ Task updated (database):', updatedTask);
      return updatedTask;
    } catch (error: any) {
      console.error('❌ Error updating task:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteTask: async (id) => {
    console.log('📋 Deleting task:', id);
    set({ loading: true, error: null });

    try {
      // DEMO MODE
      if (DEMO_MODE) {
        const tasks = get().tasks.filter(task => task.id !== id);
        saveDemoData(DEMO_STORAGE_KEYS.tasks, tasks);
        set({ tasks, loading: false });
        console.log('✅ Task deleted (demo mode)');
        return;
      }

      // PRODUCTION MODE
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id),
        loading: false,
      }));
      console.log('✅ Task deleted (database)');
    } catch (error: any) {
      console.error('❌ Error deleting task:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  completeTask: async (id, outcome) => {
    console.log('📋 Completing task:', id, 'with outcome:', outcome);

    return get().updateTask(id, {
      status: 'completed',
      outcome,
      completed_at: new Date().toISOString(),
    });
  },

  getTasksByCustomer: (customerId) => {
    return get().tasks.filter(task => task.customer_id === customerId);
  },

  getTasksByDate: (date) => {
    return get().tasks.filter(task => task.due_date === date);
  },

  getPendingTasks: () => {
    return get().tasks.filter(task =>
      task.status === 'pending' || task.status === 'in_progress'
    );
  },

  getOverdueTasks: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().tasks.filter(task =>
      (task.status === 'pending' || task.status === 'in_progress') &&
      task.due_date < today
    );
  },
}));
