
import { useState } from 'react'
import { CalendarDays, ChevronDown } from 'lucide-react'

import AcademicOverviewCards from './components/AcademicOverviewCards'
import OptimizationOverview from './components/OptimizationOverview'
import QuickActions from './components/QuickActions'
import RecentSchedules from './components/RecentSchedules'

import academicTerms from '../../data/mock/academicTerms'
import dashboardSummary from '../../data/mock/dashboardSummary'
import optimizationOverview from '../../data/mock/optimizationOverview'
import recentSchedules from '../../data/mock/recentSchedules'

function DashboardPage({ onNavigate }) {
  const activeTerm = academicTerms.find(
    (term) => term.status === 'ACTIVE'
  )

  const [selectedTerm, setSelectedTerm] = useState(
    activeTerm ? String(activeTerm.termId) : ''
  )

  const handleTermChange = (event) => {
    setSelectedTerm(event.target.value)
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back!
        </h1>

        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Manage academic schedules, run optimizations, and generate
          faculty and room allocations.
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <label
          htmlFor="academicTerm"
          className="text-sm font-semibold text-slate-800"
        >
          Academic Term
        </label>

        <div className="relative w-full sm:w-[340px]">
          <CalendarDays
            size={19}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-700"
          />

          <select
            id="academicTerm"
            value={selectedTerm}
            onChange={handleTermChange}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select an academic term</option>

            {academicTerms.map((term) => (
              <option
                key={term.termId}
                value={String(term.termId)}
              >
                {term.termName} — {term.academicYear} — {term.semester}
              </option>
            ))}
          </select>

          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
        </div>
      </section>

      <AcademicOverviewCards data={dashboardSummary} />

      <OptimizationOverview data={optimizationOverview} />

      <QuickActions onNavigate={onNavigate} />

      <RecentSchedules
        schedules={recentSchedules}
        onViewAll={() => onNavigate?.('Generated Timetable')}
        onViewSchedule={(id) => {
          console.log('Selected schedule:', id)
          onNavigate?.('Generated Timetable')
        }}
      />
    </div>
  )
}

export default DashboardPage
