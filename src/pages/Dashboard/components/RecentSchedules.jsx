import {
  CalendarDays,
  FileSpreadsheet,
  ArrowRight,
  Eye,
} from 'lucide-react'

function RecentSchedules({ schedules = [], onViewAll, onViewSchedule }) {
  const hasSchedules = schedules.length > 0

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      {/* Section Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Generated Schedules
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Recently generated timetable versions
          </p>
        </div>

        <button
          type="button"
          onClick={() => onViewAll?.()}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          View All
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Schedule List */}
      <div className="mt-5">

        {hasSchedules ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Schedule</th>
                  <th className="px-4 py-3 font-semibold">Source Run</th>
                  <th className="px-4 py-3 font-semibold">Version</th>
                  <th className="px-4 py-3 font-semibold">Created Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {schedules.slice(0, 5).map((schedule) => (
                  <tr
                    key={schedule.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                          <FileSpreadsheet size={19} />
                        </div>
                        <span className="text-sm font-medium text-slate-800">
                          {schedule.name ?? 'Unnamed Schedule'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {schedule.sourceRun ?? '—'}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {schedule.version ?? '—'}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {schedule.createdDate ?? '—'}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewSchedule?.(schedule.id)}
                        aria-label={`View ${schedule.name ?? 'schedule'}`}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg bg-slate-50 px-4 py-10 text-center">
            <div className="rounded-full bg-slate-100 p-4 text-slate-500">
              <CalendarDays size={28} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-800">
              No generated schedules yet
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Generated schedules will appear here once an optimization
              run has completed.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default RecentSchedules
