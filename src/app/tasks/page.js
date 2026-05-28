import KanbanBoard from "@/components/KanbanBoard";

export const metadata = {
  title: "Tasks | Task Management",
  description: "Manage your tasks and workflow with Kanban board",
};

export default function TasksPage() {
  return (
    <div className="flex-1 bg-transparent h-full max-w-7xl mx-auto px-8">
      <KanbanBoard />
    </div>
  );
}
