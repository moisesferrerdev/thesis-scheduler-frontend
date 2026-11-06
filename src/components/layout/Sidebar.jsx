
import { useEffect, useRef, useState } from 'react'
import {
  GraduationCap,
  LayoutDashboard,
  ChevronDown,
  BookOpen,
  Users,
  DoorOpen,
  CalendarDays,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'

const navigationGroups = [
  {
    title: 'Academic Setup',
    icon: BookOpen,
    items: [
      'Academic Terms',
      'Programs',
      'Subjects',
      'Curricula',
      'Student Sections',
      'Subject Offerings',
      'Section Subjects',
    ],
  },
  {
    title: 'Faculty Management',
    icon: Users,
    items: [
      'Instructors',
      'Instructor Qualifications',
      'Instructor Availability',
      'Teaching Assignments',
    ],
  },
  {
    title: 'Resources & Constraints',
    icon: DoorOpen,
    items: [
      'Rooms',
      'Room Availability',
      'Timeslots',
      'Scheduling Constraints',
    ],
  },
  {
    title: 'Scheduling',
    icon: CalendarDays,
    items: [
      'Optimization Configuration',
      'Optimization Runs',
      'Generated Timetable',
      'Manual Schedule Editing',
      'Schedule Versions',
    ],
  },
  {
    title: 'Reports & Evaluation',
    icon: BarChart3,
    items: ['Performance Evaluation'],
  },
]

function Sidebar({ activePage = 'Dashboard', onNavigate }) {
  // Sidebar starts minimized
  const [collapsed, setCollapsed] = useState(true)

  const [expandedGroups, setExpandedGroups] = useState(
    navigationGroups.map((group) => group.title)
  )

  const [activePopup, setActivePopup] = useState(null)
  const [popupTop, setPopupTop] = useState(12)

  const navRef = useRef(null)
  const popupRef = useRef(null)

  // Close floating submenu when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        !navRef.current?.contains(event.target) &&
        !popupRef.current?.contains(event.target)
      ) {
        setActivePopup(null)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setActivePopup(null)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  // Expand or collapse a navigation group
  const toggleGroup = (groupTitle) => {
    setExpandedGroups((currentGroups) =>
      currentGroups.includes(groupTitle)
        ? currentGroups.filter((group) => group !== groupTitle)
        : [...currentGroups, groupTitle]
    )
  }

  // Handle navigation group selection
  const handleGroupClick = (event, group) => {
    if (!collapsed) {
      toggleGroup(group.title)
      return
    }

    if (activePopup === group.title) {
      setActivePopup(null)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()

    const estimatedHeight = Math.min(
      group.items.length * 40 + 65,
      window.innerHeight - 24
    )

    const top = Math.max(
      12,
      Math.min(
        rect.top,
        window.innerHeight - estimatedHeight - 12
      )
    )

    setPopupTop(top)
    setActivePopup(group.title)
  }

  // Navigate to a selected page
  const handleNavigation = (page) => {
    onNavigate?.(page)
    setActivePopup(null)
  }

  const activeGroup = navigationGroups.find(
    (group) => group.title === activePopup
  )

  return (
    <aside
      className={`relative flex h-screen min-h-screen shrink-0 flex-col bg-[#172B4D] text-white transition-[width] duration-300 ${
        collapsed ? 'w-[76px]' : 'w-[260px]'
      }`}
    >
      {/* Branding */}
      <div
        className={`flex h-[76px] shrink-0 items-center border-b border-white/10 ${
          collapsed ? 'justify-center px-3' : 'gap-3 px-5'
        }`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/30">
          <GraduationCap size={27} />
        </div>

        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold tracking-wide">
              CBOM
            </h1>
            <p className="text-xs text-slate-300">
              Scheduling System
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        ref={navRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-3 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Dashboard */}
        <button
          onClick={() => handleNavigation('Dashboard')}
          title={collapsed ? 'Dashboard' : undefined}
          aria-label="Dashboard"
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
            collapsed ? 'justify-center' : ''
          } ${
            activePage === 'Dashboard'
              ? 'bg-indigo-500/40 text-white'
              : 'text-slate-200 hover:bg-white/10'
          }`}
        >
          <LayoutDashboard size={20} className="shrink-0" />

          {!collapsed && <span>Dashboard</span>}
        </button>

        {/* Navigation Groups */}
        {navigationGroups.map((group) => {
          const GroupIcon = group.icon

          const isExpanded = expandedGroups.includes(
            group.title
          )

          const hasActivePage = group.items.includes(
            activePage
          )

          return (
            <div key={group.title} className="relative">
              <button
                onClick={(event) =>
                  handleGroupClick(event, group)
                }
                title={collapsed ? group.title : undefined}
                aria-label={group.title}
                aria-expanded={
                  collapsed
                    ? activePopup === group.title
                    : isExpanded
                }
                className={`mb-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left transition-colors ${
                  collapsed
                    ? 'justify-center'
                    : 'justify-between'
                } ${
                  activePopup === group.title || hasActivePage
                    ? 'bg-white/10 text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span
                  className={`flex items-center ${
                    collapsed ? 'justify-center' : 'gap-3'
                  }`}
                >
                  <GroupIcon
                    size={20}
                    className="shrink-0"
                  />

                  {!collapsed && (
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {group.title}
                    </span>
                  )}
                </span>

                {!collapsed && (
                  <ChevronDown
                    size={15}
                    className={`shrink-0 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* Expanded Sidebar Submenu */}
              {!collapsed && isExpanded && (
                <div className="ml-3 space-y-1 border-l border-white/10 pl-3">
                  {group.items.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleNavigation(item)}
                      className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        activePage === item
                          ? 'bg-indigo-500/40 text-white'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="leading-5">
                        {item}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Expand / Collapse Control */}
      <div className="shrink-0 border-t border-white/10 bg-[#172B4D] p-3">
        <button
          onClick={() => {
            setCollapsed((current) => !current)
            setActivePopup(null)
          }}
          title={
            collapsed
              ? 'Expand sidebar'
              : 'Collapse sidebar'
          }
          aria-label={
            collapsed
              ? 'Expand sidebar'
              : 'Collapse sidebar'
          }
          className={`flex w-full items-center justify-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
            collapsed ? '' : 'justify-start'
          }`}
        >
          {collapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <>
              <PanelLeftClose size={20} />
              <span>Collapse sidebar</span>
            </>
          )}
        </button>
      </div>

      {/* Compact Floating Submenu */}
      {collapsed && activeGroup && (
        <div
          ref={popupRef}
          className="fixed z-[100] w-60 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xl"
          style={{
            left: '84px',
            top: `${popupTop}px`,
            maxHeight: 'calc(100vh - 24px)',
          }}
        >
          {/* Submenu Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <activeGroup.icon
                size={18}
                className="text-blue-600"
              />

              <h2 className="text-sm font-semibold">
                {activeGroup.title}
              </h2>
            </div>

            <button
              onClick={() => setActivePopup(null)}
              aria-label="Close submenu"
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={17} />
            </button>
          </div>

          {/* Submenu Items */}
          <div className="max-h-[calc(100vh-90px)] overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeGroup.items.map((item) => (
              <button
                key={item}
                onClick={() => handleNavigation(item)}
                className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  activePage === item
                    ? 'bg-blue-50 font-semibold text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
