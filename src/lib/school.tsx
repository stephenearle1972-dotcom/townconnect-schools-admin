import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import { useAuth } from './auth'
import type { Database } from './database.types'

type School = Database['public']['Tables']['schools']['Row']

type SchoolContextValue = {
  schools: School[]
  activeSchool: School | null
  setActiveSchoolId: (id: string) => void
  isLoading: boolean
  refresh: () => void
}

const SchoolContext = createContext<SchoolContextValue | undefined>(undefined)

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(
    () => localStorage.getItem('tc_active_school') ?? null
  )

  const { data: schools = [], isLoading, refetch } = useQuery({
    queryKey: ['my-schools', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('school_admins')
        .select('school:schools(*)')
        .eq('user_id', user.id)
      if (error) throw error
      return (data ?? [])
        .map((r) => (r as { school: School | null }).school)
        .filter((s): s is School => s !== null)
    },
    enabled: !!user,
  })

  useEffect(() => {
    if (schools.length === 0) return
    if (!activeSchoolId || !schools.find((s) => s.id === activeSchoolId)) {
      const next = schools[0].id
      setActiveSchoolId(next)
      localStorage.setItem('tc_active_school', next)
    }
  }, [schools, activeSchoolId])

  const activeSchool = schools.find((s) => s.id === activeSchoolId) ?? null

  const handleSet = (id: string) => {
    setActiveSchoolId(id)
    localStorage.setItem('tc_active_school', id)
  }

  return (
    <SchoolContext.Provider
      value={{
        schools,
        activeSchool,
        setActiveSchoolId: handleSet,
        isLoading,
        refresh: refetch,
      }}
    >
      {children}
    </SchoolContext.Provider>
  )
}

export function useSchool() {
  const ctx = useContext(SchoolContext)
  if (!ctx) throw new Error('useSchool must be used within SchoolProvider')
  return ctx
}
