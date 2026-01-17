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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
            <p className="text-sm text-gray-600">Welcome, {user.name}!</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('TODO')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === 'TODO'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              To Do
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === 'IN_PROGRESS'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setStatusFilter('DONE')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === 'DONE'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Done
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            + New Task
          </button>
        </div>

        {/* Tasks Grid */}
        {isLoadingTasks ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-600">No tasks found. Create your first task!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {task.title}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      task.status
                    )}`}
                  >
                    {getStatusLabel(task.status)}
                  </span>
                </div>

                {task.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {task.description}
                  </p>
                )}

                {task.dueDate && (
                  <p className="text-xs text-gray-500 mb-4">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                )}

                <div className="flex gap-2">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>

                  <button
                    onClick={() => setEditingTask(task)}
                    className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    Delete
                  </button>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {task ? 'Edit Task' : 'Create New Task'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
