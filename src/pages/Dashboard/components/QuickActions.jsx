import {
  SlidersHorizontal,
  CalendarDays,
  Users,
  ChartNoAxesCombined,
  ArrowRight,
} from 'lucide-react'

const actions = [
  {
    title: 'Configure Optimization',
    description: 'Set optimization parameters',
    icon: SlidersHorizontal,
    page: 'Optimization Configuration',
  },
  {
    title: 'View Generated Timetable',
    description: 'Review generated schedules',
    icon: CalendarDays,
    page: 'Generated Timetable',
  },
  {
    title: 'Manage Faculty',
    description: 'Manage instructor records',
    icon: Users,
    page: 'Instructors',
  },
  {
    title: 'Performance Evaluation',
    description: 'Review scheduling results',
    icon: ChartNoAxesCombined,
    page: 'Performance Evaluation',
  },
]

function QuickActions({ onNavigate }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Quick Actions
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Frequently used scheduling functions
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <button
              key={action.title}
              type="button"
              onClick={() => onNavigate?.(action.page)}
              className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0 rounded-lg bg-blue-50 p-3 text-blue-700 transition-colors group-hover:bg-blue-100">
                  <Icon size={22} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    {action.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {action.description}
                  </p>
                </div>
              </div>

              <ArrowRight
                size={17}
                className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600"
              />
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default QuickActions
