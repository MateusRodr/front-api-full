import React, { useState, useEffect } from "react";
import "./App.css";
import api from "./client";
import Swal from "sweetalert2";

interface Task {
  id: number;
  title: string;
  status: "in-progress" | "completed";
}


const normalizeTask = (data: any): Task => ({
  id: data.id, 
  title: data.title,
  status: data.status,
});

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newStatus, setNewStatus] = useState<Task["status"]>("in-progress");
  const [filter, setFilter] = useState<"all" | Task["status"]>("all");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    api.get("/user")
      .then((res) => {
        if (Array.isArray(res.data)) {
          const normalized = res.data.map(normalizeTask);
          setTasks(normalized);
        } else {
          console.error("Resposta inesperada da API:", res.data);
        }
      })
      .catch((err) => console.error("Erro ao buscar tasks:", err));
  }, []);

  const addTask = async () => {
    if (!newTask.trim()) {
      Swal.fire({
        title: "Please enter a task",
        icon: "error",
      });
      return;
    }

    try {
      const res = await api.post("/user", { title: newTask, status: newStatus });
      const newTaskNormalized = normalizeTask(res.data);
      setTasks((prev) => [...prev, newTaskNormalized]);
      setNewTask("");
      setNewStatus("in-progress");
      Swal.fire({
        title: "Task created",
        icon: "success",
      });
    } catch (error) {
      console.error("Erro ao criar task:", error);
    }
  };

  const updateStatus = async (id: number, status: Task["status"]) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    try {
      const res = await api.put(`/user/${id}`, { title: task.title, status });
      const updatedTask = normalizeTask(res.data);
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await api.delete(`/user/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Erro ao deletar task:", error);
    }
  };

  const startEditing = (id: number, title: string) => {
    setEditingTaskId(id);
    setEditingText(title);
  };

  const saveEdit = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    try {
      const res = await api.put(`/user/${id}`, { title: editingText, status: task.status });
      const updatedTask = normalizeTask(res.data);
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      setEditingTaskId(null);
      setEditingText("");
      Swal.fire({
        title: "Task updated",
        icon: "success",
      });
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
    }
  };

  const filteredTasks = tasks.filter((t) => (filter === "all" ? true : t.status === filter));

  return (
    <div className="app">
      <h1>📋 To-Do List</h1>

      <div className="input-area">
        <input
          type="text"
          value={newTask}
          placeholder="Add a task..."
          onChange={(e) => setNewTask(e.target.value)}
        />
        <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as Task["status"])}>
          <option value="in-progress">🚧 in-progress</option>
          <option value="completed">✅ completed</option>
        </select>
        <button onClick={addTask}>Add</button>
      </div>

      <div className="filters">
        <button onClick={() => setFilter("all")}>all</button>
        <button onClick={() => setFilter("in-progress")}>in-progress</button>
        <button onClick={() => setFilter("completed")}>completed</button>
      </div>

      <div className="task-list">
        {filteredTasks.map((task) => (
          <div key={task.id} className={`task-card ${task.status}`}>
            {editingTaskId === task.id ? (
              <div className="edit-area">
                <input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                />
                <button onClick={() => saveEdit(task.id)}>Salvar</button>
              </div>
            ) : (
              <>
                <span>{task.title}</span>
                <div className="actions">
                  <select
                    value={task.status}
                    onChange={(e) => updateStatus(task.id, e.target.value as Task["status"])}
                  >
                    <option value="in-progress">🚧 in-progress</option>
                    <option value="completed">✅ completed</option>
                  </select>
                  <button onClick={() => startEditing(task.id, task.title)}>✏️</button>
                  <button onClick={() => deleteTask(task.id)}>🗑️</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
