"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, MoreHorizontal, Flag, Calendar, AlignLeft, Trash2 } from "lucide-react";
import { format } from "date-fns";
import DateRangePicker from "./DateRangePicker";

const STATUSES = {
  OPEN: { label: "OPEN", color: "border-gray-500" },
  IN_PROGRESS: { label: "IN PROGRESS", color: "border-pos-accent" },
  DONE: { label: "DONE", color: "border-pos-ruby" },
};

export default function KanbanBoard({ targetUserId, readOnly = false }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(null); // stores the column status where a task is being added
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  useEffect(() => {
    fetchTasks();
  }, [dateRange]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (targetUserId) params.append("userId", targetUserId);
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);

      const url = `/api/tasks?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const draggedTask = tasks.find((t) => t.id === draggableId);
    if (!draggedTask) return;

    // Optimistically update UI
    const newTasks = Array.from(tasks);
    const sourceStatusTasks = newTasks
      .filter((t) => t.status === source.droppableId)
      .sort((a, b) => a.order - b.order);
    
    const destStatusTasks =
      source.droppableId === destination.droppableId
        ? sourceStatusTasks
        : newTasks
            .filter((t) => t.status === destination.droppableId)
            .sort((a, b) => a.order - b.order);

    // Remove from source list
    sourceStatusTasks.splice(source.index, 1);
    
    // Insert into destination list
    draggedTask.status = destination.droppableId;
    if (destination.droppableId === 'DONE') {
      draggedTask.progress = 100;
    }
    destStatusTasks.splice(destination.index, 0, draggedTask);

    // Re-calculate orders for the affected columns
    const allAffectedTasks = new Set([...sourceStatusTasks, ...destStatusTasks]);
    let sourceOrder = 0;
    sourceStatusTasks.forEach((t) => {
      t.order = sourceOrder++;
    });
    
    if (source.droppableId !== destination.droppableId) {
      let destOrder = 0;
      destStatusTasks.forEach((t) => {
        t.order = destOrder++;
      });
    }

    // Update state
    setTasks(newTasks);

    // Send bulk update to API
    const updatedTasksPayload = Array.from(allAffectedTasks).map((t) => ({
      id: t.id,
      status: t.status,
      order: t.order,
      progress: t.progress,
    }));

    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updatedTasksPayload }),
      });
    } catch (error) {
      console.error("Failed to reorder tasks", error);
      fetchTasks(); // revert on failure
    }
  };

  const handleAddTask = async (status) => {
    if (!newTaskTitle.trim()) {
      setIsAddingTask(null);
      return;
    }

    const optimisticTask = {
      id: `temp-${Date.now()}`,
      title: newTaskTitle,
      status,
      points: 1,
      order: 9999, // temporary
      createdAt: new Date().toISOString(),
    };

    setTasks([...tasks, optimisticTask]);
    setIsAddingTask(null);
    setNewTaskTitle("");

    try {
      const payload = { title: newTaskTitle, status, points: 1 };
      if (targetUserId) payload.targetUserId = targetUserId;

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === optimisticTask.id ? data : t)));
    } catch (error) {
      console.error("Failed to add task", error);
      fetchTasks();
    }
  };

  const handleUpdateTask = async (taskId) => {
    if (!editingTaskTitle.trim()) {
      setEditingTaskId(null);
      return;
    }

    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (taskToUpdate && taskToUpdate.title === editingTaskTitle) {
      setEditingTaskId(null);
      return;
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, title: editingTaskTitle } : t))
    );
    setEditingTaskId(null);

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTaskTitle }),
      });
    } catch (error) {
      console.error("Failed to update task title", error);
      fetchTasks();
    }
  };

  const handleUpdatePriority = async (taskId, newPriority) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, points: newPriority } : t))
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: newPriority }),
      });
    } catch (error) {
      console.error("Failed to update task priority", error);
      fetchTasks();
    }
  };

  const handleUpdateProgress = async (taskId, newProgress) => {
    let validProgress = isNaN(newProgress) ? 0 : newProgress;
    if (validProgress < 0) validProgress = 0;
    if (validProgress > 100) validProgress = 100;

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: validProgress }),
      });
    } catch (error) {
      console.error("Failed to update task progress", error);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } catch (error) {
      console.error("Failed to delete task", error);
      fetchTasks();
    }
  };

  const getTasksByStatus = (status) => {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);
  };

  if (loading) {
    return <div className="p-8 text-center text-pos-textMuted">Loading Tasks...</div>;
  }

  return (
    <div className="min-h-[85vh] bg-transparent overflow-x-auto pb-8">
      {!targetUserId ? (
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Task Management</h1>
          <DateRangePicker onFilterChange={setDateRange} initialMode="ALL" allowAll={true} />
        </div>
      ) : (
        <div className="mb-6 flex justify-end">
          <DateRangePicker onFilterChange={setDateRange} initialMode="ALL" allowAll={true} />
        </div>
      )}
      
      <DragDropContext onDragEnd={readOnly ? () => {} : onDragEnd}>
        <div className="flex gap-6 items-start pb-4 w-full">
          {Object.entries(STATUSES).map(([statusKey, config]) => {
            const columnTasks = getTasksByStatus(statusKey);
            
            return (
              <div key={statusKey} className="flex-1 min-w-0 flex flex-col bg-pos-base rounded-xl border border-pos-border/50 p-4">
                {/* Column Header */}
                <div className={`flex items-center justify-between pb-3 mb-3 border-b-2 ${config.color}`}>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-white text-sm tracking-wide">
                      {config.label}
                    </h2>
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-pos-panel border border-pos-border text-xs text-pos-textMuted font-medium">
                      {columnTasks.length}
                    </span>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-1 text-pos-textMuted">
                      <button className="hover:text-white transition-colors p-1"><MoreHorizontal size={16} /></button>
                      <button 
                        className="hover:text-white transition-colors p-1"
                        onClick={() => setIsAddingTask(statusKey)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={statusKey}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`min-h-[200px] rounded-lg transition-colors p-1 ${
                        snapshot.isDraggingOver ? "bg-pos-panel/30" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-3">
                        {columnTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={readOnly}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...(readOnly ? {} : provided.dragHandleProps)}
                                className={`bg-pos-panel p-4 rounded-xl border border-pos-border transition-all ${
                                  snapshot.isDragging ? "shadow-neon ring-1 ring-pos-accent scale-105 z-50" : "hover:border-pos-accent/50"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-2 h-2 rounded-full ${statusKey === 'DONE' ? 'bg-pos-cyan' : 'bg-pos-yellow'}`}></div>
                                  <span className="text-[10px] font-medium text-pos-textMuted uppercase tracking-wider">
                                    Sprint 2
                                  </span>
                                  {!readOnly && (
                                    <button 
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="ml-auto text-pos-textMuted hover:text-pos-ruby transition-colors opacity-40 hover:opacity-100"
                                      style={{ opacity: snapshot.isDragging ? 0 : undefined }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                                
                                {!readOnly && editingTaskId === task.id ? (
                                  <input
                                    type="text"
                                    autoFocus
                                    className="w-full text-sm font-semibold outline-none bg-transparent text-white border-b border-pos-accent mb-3"
                                    value={editingTaskTitle}
                                    onChange={(e) => setEditingTaskTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleUpdateTask(task.id);
                                      if (e.key === "Escape") setEditingTaskId(null);
                                    }}
                                    onBlur={() => handleUpdateTask(task.id)}
                                  />
                                ) : (
                                  <h3 
                                    className={`font-semibold text-white text-sm mb-3 ${readOnly ? '' : 'cursor-pointer hover:text-pos-accent'} transition-colors`}
                                    onClick={readOnly ? undefined : () => {
                                      setEditingTaskId(task.id);
                                      setEditingTaskTitle(task.title);
                                    }}
                                    title={readOnly ? undefined : "Click to edit task title"}
                                  >
                                    {task.title}
                                  </h3>
                                )}

                                <div className="flex items-center gap-3 text-xs text-pos-textMuted mb-4">
                                  <div className="flex items-center gap-1">
                                    <Flag size={12} className="text-pos-ruby" />
                                    <span>{format(new Date(task.createdAt), "MMM d")}</span>
                                  </div>
                                  {task.description && (
                                    <div className="flex items-center gap-1">
                                      <AlignLeft size={12} />
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-3 border-t border-pos-border/50">
                                  <div className="flex items-center gap-2">
                                    <span className="text-pos-textMuted">Prioritas:</span>
                                    {readOnly ? (
                                      <span className={`text-white px-2 py-0.5 rounded font-medium text-xs ${
                                        task.points === 4 ? 'bg-pos-ruby' :
                                        task.points === 3 ? 'bg-pos-yellow' :
                                        task.points === 2 ? 'bg-pos-cyan' :
                                        'bg-pos-accent'
                                      }`}>
                                        {task.points === 4 ? 'Urgent' : task.points === 3 ? 'Penting' : task.points === 2 ? 'Normal' : 'Rendah'}
                                      </span>
                                    ) : (
                                      <select
                                        value={task.points}
                                        onChange={(e) => handleUpdatePriority(task.id, parseInt(e.target.value))}
                                        className={`text-white px-2 py-0.5 rounded font-medium text-xs outline-none cursor-pointer ${
                                          task.points === 4 ? 'bg-pos-ruby' :
                                          task.points === 3 ? 'bg-pos-yellow' :
                                          task.points === 2 ? 'bg-pos-cyan' :
                                          'bg-pos-accent'
                                        }`}
                                      >
                                        <option value={4}>Urgent</option>
                                        <option value={3}>Penting</option>
                                        <option value={2}>Normal</option>
                                        <option value={1}>Rendah</option>
                                      </select>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-1 text-pos-textMuted">
                                    <span>Progress:</span>
                                    <div className="flex items-center">
                                      {readOnly ? (
                                        <span className="text-white text-xs font-semibold">{task.progress || 0}</span>
                                      ) : (
                                        <input 
                                          type="text"
                                          value={task.progress || 0}
                                          onChange={(e) => {
                                            let val = e.target.value.replace(/[^0-9]/g, '');
                                            if (val === '') val = 0;
                                            else val = parseInt(val, 10);
                                            
                                            if (val > 100) val = 100;
                                            
                                            setTasks((prev) =>
                                              prev.map((t) => (t.id === task.id ? { ...t, progress: val } : t))
                                            );
                                          }}
                                          onFocus={(e) => e.target.select()}
                                          onBlur={(e) => handleUpdateProgress(task.id, parseInt(e.target.value) || 0)}
                                          className="w-7 bg-transparent text-white text-xs font-semibold outline-none text-right border-b border-transparent focus:border-pos-accent transition-colors"
                                        />
                                      )}
                                      <span className="text-xs text-white/70 ml-0.5">%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                      {provided.placeholder}
                      
                      {/* Add Task Input Field */}
                      {!readOnly && isAddingTask === statusKey && (
                        <div className="mt-3 bg-pos-panel p-3 rounded-xl border border-pos-accent shadow-neon">
                          <input
                            type="text"
                            autoFocus
                            placeholder="What needs to be done?"
                            className="w-full text-sm outline-none bg-transparent text-white placeholder-pos-textMuted"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddTask(statusKey);
                              if (e.key === "Escape") setIsAddingTask(null);
                            }}
                            onBlur={() => {
                                if(newTaskTitle) handleAddTask(statusKey);
                                else setIsAddingTask(null);
                            }}
                          />
                        </div>
                      )}

                      {/* Add Task Button (if not inputting) */}
                      {!readOnly && isAddingTask !== statusKey && (
                        <button
                          onClick={() => setIsAddingTask(statusKey)}
                          className="mt-3 flex items-center gap-2 text-xs font-bold text-pos-textMuted hover:text-white hover:bg-pos-panel border border-transparent hover:border-pos-border px-3 py-2 rounded-lg w-full transition-all"
                        >
                          <Plus size={14} /> NEW TASK
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
