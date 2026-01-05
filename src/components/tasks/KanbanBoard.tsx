import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, Calendar, AlertCircle, User } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'To Do' | 'In Progress' | 'Completed';
  dueDate: Date;
  customer?: string;
  showOnCalendar?: boolean;
  startTime?: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: Task['status']) => void;
  onTaskClick?: (task: Task) => void;
}

const priorityColors = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const statusConfig = {
  'To Do': {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
  'In Progress': {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  'Completed': {
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
};

function SortableTaskCard({ task, onTaskClick }: { task: Task; onTaskClick?: (task: Task) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.status !== 'Completed' && task.dueDate < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTaskClick?.(task)}
      className={`bg-white border-2 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
        isOverdue ? 'border-red-500' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${priorityColors[task.priority]}`} />
          <span className="text-xs font-medium text-slate-600 capitalize">{task.priority}</span>
        </div>
        <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
          <MoreVertical className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <h4 className="font-semibold text-slate-900 mb-1">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Calendar className="w-3.5 h-3.5" />
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            {formatDate(task.dueDate)}
            {task.showOnCalendar && task.startTime && (
              <span className="ml-1 text-primary-600 font-medium">• {task.startTime}</span>
            )}
          </span>
          {isOverdue && <AlertCircle className="w-3.5 h-3.5 text-red-500 ml-auto" />}
        </div>

        {task.customer && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <User className="w-3.5 h-3.5" />
            <span>{task.customer}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
  onTaskClick,
}: {
  status: Task['status'];
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}) {
  const config = statusConfig[status];

  return (
    <div className="flex-1 min-w-[300px]">
      <div className={`${config.bg} border-2 ${config.border} rounded-2xl p-4 h-full`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">{status}</h3>
          <span className="px-2.5 py-1 bg-white border-2 border-slate-200 rounded-lg text-sm font-medium text-slate-700">
            {tasks.length}
          </span>
        </div>

        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);

  if (taskDate.getTime() === today.getTime()) return 'Today';
  if (taskDate.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function KanbanBoard({ tasks, onTaskMove, onTaskClick }: KanbanBoardProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);

    if (activeTask && overTask && activeTask.status !== overTask.status) {
      onTaskMove(activeTask.id, overTask.status);
    }

    setActiveId(null);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const todoTasks = tasks.filter((t) => t.status === 'To Do');
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress');
  const completedTasks = tasks.filter((t) => t.status === 'Completed');

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-6">
        <KanbanColumn status="To Do" tasks={todoTasks} onTaskClick={onTaskClick} />
        <KanbanColumn status="In Progress" tasks={inProgressTasks} onTaskClick={onTaskClick} />
        <KanbanColumn status="Completed" tasks={completedTasks} onTaskClick={onTaskClick} />
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="bg-white border-2 border-slate-300 rounded-xl p-4 shadow-xl rotate-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${priorityColors[activeTask.priority]}`} />
              <span className="text-xs font-medium text-slate-600 capitalize">
                {activeTask.priority}
              </span>
            </div>
            <h4 className="font-semibold text-slate-900">{activeTask.title}</h4>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
