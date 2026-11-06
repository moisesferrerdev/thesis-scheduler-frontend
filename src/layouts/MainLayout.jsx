
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'

function MainLayout({ children, activePage, onNavigate }) {
  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Application Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
      />

      {/* Main Application Area */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Application Header */}
        <Header />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>
    </div>
  )
}

export default MainLayout
