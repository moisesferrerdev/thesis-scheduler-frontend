import { useState } from 'react'

import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/Dashboard/DashboardPage'
import AcademicTermsPage from './pages/AcademicSetup/AcademicTermsPage'
import ProgramsPage from './pages/AcademicSetup/ProgramsPage'
// import ProgramMajorsPage from './pages/AcademicSetup/ProgramMajorsPage'
import SubjectsPage from './pages/AcademicSetup/SubjectsPage'
import CurriculaPage from './pages/AcademicSetup/CurriculaPage'
import StudentSectionsPage from './pages/AcademicSetup/StudentSectionsPage'

function App() {
  const [activePage, setActivePage] = useState('Dashboard')

  const handleNavigate = (page) => {
    setActivePage(page)
  }

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return <DashboardPage onNavigate={handleNavigate} />

      case 'Academic Terms':
        return <AcademicTermsPage />

      case 'Programs':
        return <ProgramsPage />

      // case 'Program Majors':
      //   return <ProgramMajorsPage />

      case 'Subjects':
        return <SubjectsPage />

      case 'Curricula':
        return <CurriculaPage />
      
      case 'Student Sections':
        return <StudentSectionsPage />

      default:
        return (
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              {activePage}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              This module is not implemented yet.
            </p>
          </div>
        )
    }
  }

  return (
    <MainLayout
      activePage={activePage}
      onNavigate={handleNavigate}
    >
      {renderPage()}
    </MainLayout>
  )
}

export default App
