'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && token) {
      fetchTasks();
    }
  }, [user, token]);

  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter((task) => task.status === statusFilter));
    }
  }, [tasks, statusFilter]);

  const fetchTasks = async () => {
    if (!token) return;

    setIsLoadingTasks(true);
    try {
      const response = await fetch('/api/tasks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!token || !confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-700';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      case 'DONE':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'To Do';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'DONE':
        return 'Done';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-500 text-sm animate-pulse">Loading workspace...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-gray-950 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm shadow-[var(--shadow-glow)]">
              TM
            </div>
            <div>
              <h1 className="text-sm font-medium text-[var(--foreground)] tracking-tight">Task Manager</h1>
              <p className="text-xs text-zinc-500">Workspace of {user.name}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-[var(--foreground)] hover:bg-[var(--surface-highlight)] rounded-md transition"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  statusFilter === filter
                    ? 'bg-[var(--surface-highlight)] text-[var(--foreground)] shadow-sm border border-[var(--border-highlight)]'
                    : 'text-zinc-200 hover:text-zinc-500'
                }`}
              >
                {filter === 'ALL' ? 'View All' : filter.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2"
          >
            <span>+ New Issue</span>
          </button>
        </div>

        {/* Tasks Grid */}
        {isLoadingTasks ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm">Loading issues...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)]/50">
            <p className="text-zinc-500 text-sm">No issues found in this view.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="group bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--border-highlight)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-mono text-zinc-600">TSK-{task.id.slice(0, 4)}</span>
                  <StatusBadge status={task.status} />
                </div>

                <h3 className="text-base font-medium text-[var(--foreground)] mb-2 group-hover:text-indigo-400 transition-colors">
                  {task.title}
                </h3>

                {task.description && (
                  <p className="text-zinc-500 text-sm mb-5 line-clamp-3">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-5 border-t border-[var(--border)] mt-auto">
                   <span className="text-xs text-zinc-600 flex items-center gap-1.5">
                    {task.dueDate && (
                      <span className={new Date(task.dueDate) < new Date() ? 'text-red-400' : ''}>
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </span>

                  <div className="flex gap-3">
                     <button
                      onClick={() => setEditingTask(task)}
                      className="px-2 py-1 text-xs font-medium text-zinc-500 hover:text-[var(--foreground)] hover:bg-[var(--surface-highlight)] rounded transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleStatusChange(task.id, task.status === 'DONE' ? 'TODO' : 'DONE')}
                      className="px-2 py-1 text-xs font-medium text-zinc-500 hover:text-[var(--foreground)] hover:bg-[var(--surface-highlight)] rounded transition"
                    >
                      {task.status === 'DONE' ? 'Reopen' : 'Close'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTask) && (
        <TaskModal
          task={editingTask}
          token={token!}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTask(null);
          }}
          onSuccess={() => {
            fetchTasks();
            setShowCreateModal(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    TODO: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    IN_PROGRESS: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    DONE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  const labels: Record<string, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
  };

  return (
    <span className={`text-xs px-2.5 py-1 rounded border ${styles[status] || styles.TODO}`}>
      {labels[status] || status}
    </span>
  );
}

function TaskModal({
  task,
  token,
  onClose,
  onSuccess,
}: {
  task: Task | null;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'TODO');
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = task ? `/api/tasks/${task.id}` : '/api/tasks';
      const method = task ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description: description || null,
          status,
          dueDate: dueDate || null,
        }),
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg shadow-[var(--shadow-glass)] flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-lg font-medium text-[var(--foreground)]">
            {task ? 'Edit Issue' : 'New Issue'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[var(--surface-highlight)] border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition"
              placeholder="Issue title"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-2 bg-[var(--surface-highlight)] border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition"
              placeholder="Add detailed description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-[var(--surface-highlight)] border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-highlight)] border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)] flex justify-end gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-[var(--foreground)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-primary px-4 py-2 rounded-md text-xs font-medium shadow-[var(--shadow-glow)] disabled:opacity-50"
          >
             {isLoading ? 'Saving...' : task ? 'Save Changes' : 'Create Issue'}
          </button>
        </div>
      </div>
    </div>
  );
}
