
import {
  Activity,
  CalendarClock,
  FileSpreadsheet,
  Info,
} from 'lucide-react'

const statusStyles = {
  RUNNING: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-green-50 text-green-700',
  FAILED: 'bg-red-50 text-red-700',
}

function OptimizationOverview({ data = null }) {
  const status = data?.status
  const hasRun = Boolean(data)

  const statusStyle =
    statusStyles[status] ?? 'bg-slate-100 text-slate-600'

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Latest Optimization Run
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Overview of the latest scheduling optimization
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            hasRun ? statusStyle : 'bg-slate-100 text-slate-600'
          }`}
        >
          {status ?? 'NO RUN YET'}
        </span>
      </div>

      <div className="my-5 border-t border-slate-100" />

      {hasRun ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
              <Activity size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Optimization Status
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {status ?? 'Status unavailable'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <CalendarClock size={20} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Last Execution</p>
                <p className="text-sm font-medium text-slate-800">
                  {data.lastExecution ?? '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">
                  Generated Schedules
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {data.scheduleCount ?? '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
          <Info size={20} className="mt-0.5 shrink-0 text-slate-500" />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              No optimization run found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Run an optimization to generate a faculty and room
              schedule for this academic term.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

export default OptimizationOverview
