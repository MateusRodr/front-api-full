import React, { useState, useEffect } from "react";
import "./App.css";
import api from "./client";
import Swal from "sweetalert2";

interface Task {
  id: number;
  Title: string;
  Status: "in-progress" | "completed";
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newStatus, setNewStatus] = useState<Task["Status"]>("completed");
  const [filter, setFilter] = useState<"all" | Task["Status"]>("all");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  // Buscar tarefas do back
  useEffect(() => {
    api.get("/user")
      .then((res) => setTasks(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Adicionar tarefa
  const addTask = async () => {
    if (!newTask.trim()) return;

    const res = await api.post("/user", { title: newTask, status: newStatus });
    setTasks([...tasks, res.data]);
    setNewTask("");
    setNewStatus("completed");
    Swal.fire({
  title: "task created",
  icon: "success",
  draggable: true
});
  };

  // Alterar status
  const updateStatus = async (id: number, status: Task["Status"]) => {
    const res = await api.put(`/user/${id}`, { title: getTitle(id), status });
    setTasks(tasks.map((t) => (t.id === id ? res.data : t)));
  };

  // Excluir
  const deleteTask = async (id: number) => {
    await api.delete(`/user/${id}`);
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // Editar
  const startEditing = (id: number, title: string) => {
    setEditingTaskId(id);
    setEditingText(title);
  };

  const saveEdit = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const res = await api.put(`/user/${id}`, { title: editingText, status: task.Status });
    setTasks(tasks.map((t) => (t.id === id ? res.data : t)));
    setEditingTaskId(null);
    setEditingText("");
  };

  // helper p/ pegar título da tarefa
  const getTitle = (id: number) => {
    const task = tasks.find((t) => t.id === id);
    return task ? task.Title : "";
  };

  // Filtrar
  const filteredTasks = tasks.filter((t) => (filter === "all" ? true : t.Status === filter));

  return (
    <div className="app">
      <h1>📋 To-Do List</h1>

      {/* Input para nova tarefa */}
      <div className="input-area">
        <input
          type="text"
          value={newTask}
          placeholder="Add a task..."
          onChange={(e) => setNewTask(e.target.value)}
          required
        />
        <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as Task["Status"])}>
          <option value="in-progress">🚧 in-progress</option>
          <option value="completed">✅ completed</option>
        </select>
        <button onClick={addTask}>Add</button>
      </div>

      {/* Filtros */}
      <div className="filters">
        <button onClick={() => setFilter("all")}>all</button>
        <button onClick={() => setFilter("in-progress")}>in-progress</button>
        <button onClick={() => setFilter("completed")}>completed</button>
      </div>

      {/* Lista */}
      <div className="task-list">
        {filteredTasks.map((task) => (
          <div key={task.id} className={`task-card ${task.Status}`}>
            {editingTaskId === task.id ? (
              <div className="edit-area">
                <input value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                <button onClick={() => saveEdit(task.id)}>Salvar</button>
              </div>
            ) : (
              <>
                <span>{task.Title}</span>
                <div className="actions">
                  <select
                    value={task.Status}
                    onChange={(e) => updateStatus(task.id, e.target.value as Task["Status"])}
                  >
                    <option value="in-progress">🚧 in-progress</option>
                    <option value="completed">✅ completed</option>
                  </select>
                  <button onClick={() => startEditing(task.id, task.Title)}>✏️</button>
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
