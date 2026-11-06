
import { useState } from 'react'
import {
  Bell,
  ChevronDown,
  UserRound,
  Settings,
  LogOut,
} from 'lucide-react'

function Header() {
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="relative z-20 flex h-[76px] items-center justify-end border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">

      {/* Right-side actions */}
      <div className="flex items-center gap-4">

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100"
        >
          <Bell size={22} />

          {/* Unread indicator */}
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        {/* User Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50"
          >
            {/* Avatar */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              MF
            </div>

            {/* User Information */}
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-slate-800">
                Schedule Maker
              </p>
              <p className="text-xs text-slate-500">
                Administrator
              </p>
            </div>

            <ChevronDown
              size={18}
              className={`text-slate-500 transition-transform ${
                profileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-2 shadow-lg">

              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserRound size={17} />
                My Profile
              </button>

              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Settings size={17} />
                Account Settings
              </button>

              <div className="my-2 border-t border-slate-100" />

              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={17} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
