import { LayoutGrid, Calendar, Image as ImageIcon, Table } from 'lucide-react';

export default function TableViewSelector({ currentView, onViewChange }) {
  const views = [
    { id: 'table', label: 'Tabla', icon: Table },
    { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'gallery', label: 'Galería', icon: ImageIcon },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {views.map((view) => {
        const Icon = view.icon;
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${
                currentView === view.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }
            `}
            title={view.label}
          >
            <Icon className="w-4 h-4" />
            <span>{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}

