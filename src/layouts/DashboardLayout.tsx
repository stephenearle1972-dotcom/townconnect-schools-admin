import { useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Bell,
  Users,
  Trophy,
  DollarSign,
  Bus,
  FileText,
  FolderOpen,
  Settings,
  LayoutDashboard,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'
import { differenceInDays, format } from 'date-fns'
import { useAuth } from '@/lib/auth'
import { useSchool } from '@/lib/school'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/teachers', label: 'Teachers', icon: Users },
  { to: '/dashboard/fixtures', label: 'Fixtures', icon: Trophy },
  { to: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { to: '/dashboard/notices', label: 'Notices', icon: Bell },
  { to: '/dashboard/fees', label: 'Fees', icon: DollarSign },
  { to: '/dashboard/bus-routes', label: 'Bus Routes', icon: Bus },
  { to: '/dashboard/narrative', label: 'About / Narrative', icon: FileText },
  { to: '/dashboard/files', label: 'Files', icon: FolderOpen },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function TrialBanner() {
  const { activeSchool } = useSchool()
  if (!activeSchool) return null

  const status = activeSchool.subscription_status
  const trialEnd = activeSchool.trial_ends_at ? new Date(activeSchool.trial_ends_at) : null
  const now = new Date()

  if (status === 'read_only' || status === 'cancelled' || status === 'past_due') {
    return (
      <div
        data-testid="trial-banner"
        data-trial-state="suspended"
        className="border-b border-destructive bg-destructive/10 px-6 py-3 text-sm"
      >
        <strong className="text-destructive">Account suspended.</strong>{' '}
        <span className="text-destructive/80">Read-only mode.</span>{' '}
        <a className="ml-2 underline text-navy" href="mailto:hello@townconnect.co.za">
          Contact us
        </a>
      </div>
    )
  }

  if (status === 'trial' && trialEnd) {
    if (trialEnd < now) {
      return (
        <div
          data-testid="trial-banner"
          data-trial-state="expired"
          className="border-b border-destructive bg-destructive/10 px-6 py-3 text-sm"
        >
          <strong className="text-destructive">Your trial has ended.</strong>{' '}
          <span className="text-destructive/80">Your bot is paused.</span>{' '}
          <a className="ml-2 underline text-navy" href="mailto:hello@townconnect.co.za?subject=Reactivate%20my%20school%20admin">
            Contact us to reactivate
          </a>
        </div>
      )
    }
    const daysLeft = Math.max(0, differenceInDays(trialEnd, now))
    return (
      <div
        data-testid="trial-banner"
        data-trial-state="trial"
        data-trial-days-left={daysLeft}
        className="border-b border-gold bg-gold/10 px-6 py-3 text-sm flex items-center justify-between gap-4 flex-wrap"
      >
        <span>
          <strong className="text-navy">Free trial — {daysLeft} day{daysLeft === 1 ? '' : 's'} left.</strong>{' '}
          <span className="text-navy/70">Upgrade to keep your bot live.</span>
        </span>
        <Button asChild size="sm" className="bg-navy hover:bg-navy/90">
          <a href="mailto:hello@townconnect.co.za?subject=Upgrade%20my%20school%20admin">Contact us to upgrade</a>
        </Button>
      </div>
    )
  }

  if (status === 'active' && activeSchool.paid_until) {
    return (
      <div
        data-testid="trial-banner"
        data-trial-state="paid"
        className="border-b bg-teal/10 px-6 py-2 text-xs text-teal"
      >
        Paid until {format(new Date(activeSchool.paid_until), 'd MMMM yyyy')}
      </div>
    )
  }
  return null
}

function SchoolSelector() {
  const { schools, activeSchool, setActiveSchoolId } = useSchool()
  if (schools.length <= 1) {
    return <span className="font-medium text-navy">{activeSchool?.name ?? '—'}</span>
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="font-medium text-navy">
          {activeSchool?.name ?? 'Select school'} <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Switch school</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {schools.map((s) => (
          <DropdownMenuItem key={s.id} onClick={() => setActiveSchoolId(s.id)}>
            {s.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function DashboardLayout() {
  const { user, signOut } = useAuth()
  const { schools, activeSchool, isLoading } = useSchool()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = (user?.email ?? '??').slice(0, 2).toUpperCase()

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading your school…</div>
  }

  // Authenticated but no school: route to /complete-signup as the proper finish-setup flow.
  if (!activeSchool && schools.length === 0) {
    return <Navigate to="/complete-signup" replace />
  }

  if (!activeSchool) {
    // Schools exist but none active — transient state. Brief fallback with sign-out escape hatch.
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-navy">Loading school…</h1>
          <Button variant="outline" onClick={signOut} className="ml-2">
            Sign out
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="border-b bg-white">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-navy">TownConnect</span>
              <span className="h-2 w-2 rounded-full bg-gold" />
              <span className="text-lg font-medium text-navy/80 hidden sm:inline">Schools</span>
            </div>
          </div>
          <div className="hidden md:block">
            <SchoolSelector />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account menu">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-navy text-white text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal text-muted-foreground">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="md:hidden border-t px-4 py-2 bg-white">
          <SchoolSelector />
        </div>
      </header>

      <TrialBanner />

      <div className="flex-1 flex flex-col md:flex-row">
        <aside
          className={cn(
            'border-r bg-white md:w-[250px] md:block',
            mobileOpen ? 'block' : 'hidden'
          )}
        >
          <nav className="p-3 space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-navy text-white'
                        : 'text-navy/70 hover:bg-navy/5 hover:text-navy'
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
