/**
 * Main Application Entry Point - Jarvis 2.0
 * This component sets up the basic layout shell and renders the primary
 * Task Ingestion interface.
 */
import { TaskForm } from "./components/TaskForm"

function App() {
  return (
    // Base container with Slate theme colors for visual comfort (ADHD-Friendly)
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Header section: Provides immediate context of the current module */}
      <header className="max-w-lg mx-auto mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Jarvis 2.0</h1>
        <p className="text-slate-500 mt-2">Central de Ingestão de Tarefas (Reator ARC)</p>
      </header>

      {/* Main interaction zone */}
      <main className="flex justify-center">
        <TaskForm />
      </main>

      {/* Status indicator footer */}
      <footer className="mt-20 text-center text-xs text-slate-400">
        Connected to: https://bruno-spock.app.n8n.cloud
      </footer>
    </div>
  )
}

export default App