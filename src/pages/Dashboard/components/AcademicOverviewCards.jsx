
import {
  Users,
  BookOpen,
  GraduationCap,
  Building2,
} from 'lucide-react'

const overviewItems = [
  {
    key: 'instructors',
    label: 'Instructors',
    icon: Users,
    description: 'Total registered instructors',
  },
  {
    key: 'subjects',
    label: 'Subjects',
    icon: BookOpen,
    description: 'Total registered subjects',
  },
  {
    key: 'studentSections',
    label: 'Student Sections',
    icon: GraduationCap,
    description: 'Total student sections',
  },
  {
    key: 'rooms',
    label: 'Rooms',
    icon: Building2,
    description: 'Total available rooms',
  },
]

function AcademicOverviewCards({ data = {} }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">
          Academic Overview
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Summary of academic resources
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewItems.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.key}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Icon size={22} />
                </div>
              </div>

              <p className="mt-5 text-sm font-medium text-slate-500">
                {item.label}
              </p>

              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                {data[item.key] ?? '—'}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {item.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default AcademicOverviewCards
