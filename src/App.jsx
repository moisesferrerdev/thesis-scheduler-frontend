
import { useState } from 'react'

import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/Dashboard/DashboardPage'

function App() {
  const [activePage, setActivePage] = useState('Dashboard')

  const handleNavigate = (page) => {
    setActivePage(page)
  }

  return (
    <MainLayout
      activePage={activePage}
      onNavigate={handleNavigate}
    >
      {activePage === 'Dashboard' ? (
        <DashboardPage onNavigate={handleNavigate} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            {activePage}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            This module is not implemented yet. We'll build it in a
            future development step.
          </p>
        </div>
      )}
    </MainLayout>
  )
}

export default App
