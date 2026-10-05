import type { Session } from '@supabase/supabase-js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'

export interface Org {
  id: string
  name: string
  tax_code: string | null
  plan: string
}

export interface Profile {
  id: string
  org_id: string
  facility_id: string | null
  full_name: string
  phone: string | null
  role: 'admin' | 'manager' | 'officer' | 'operator' | 'viewer'
  organizations: Org | null
}

export interface Facility {
  id: string
  org_id: string
  name: string
  address: string | null
  gpmt_number: string | null
  gpmt_issuer: string | null
}

interface AuthState {
  session: Session | null
  profile: Profile | null
  org: Org | null
  facilities: Facility[]
  facilityId: string | null
  facility: Facility | null
  role: Profile['role'] | null
  loading: boolean
  setFacilityId: (id: string) => void
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const FACILITY_KEY = 'ehsviet_facility'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [facilityId, setFacilityIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (uid: string) => {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', uid)
      .maybeSingle()
    if (!prof) {
      setProfile(null)
      setFacilities([])
      setFacilityIdState(null)
      return
    }
    setProfile(prof as Profile)
    const { data: facs } = await supabase
      .from('facilities')
      .select('*')
      .eq('org_id', (prof as Profile).org_id)
      .order('created_at', { ascending: true })
    const list = (facs ?? []) as Facility[]
    setFacilities(list)
    const saved = localStorage.getItem(FACILITY_KEY)
    const preferred =
      (saved && list.find((f) => f.id === saved)?.id) ||
      (prof as Profile).facility_id ||
      list[0]?.id ||
      null
    setFacilityIdState(preferred)
  }, [])

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const s = data.session
    setSession(s)
    if (s?.user) await loadProfile(s.user.id)
    else setProfile(null)
  }, [loadProfile])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await refresh()
      if (mounted) setLoading(false)
    })()
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, s) => {
      setSession(s)
      if (s?.user) await loadProfile(s.user.id)
      else {
        setProfile(null)
        setFacilities([])
        setFacilityIdState(null)
      }
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [refresh, loadProfile])

  const setFacilityId = useCallback((id: string) => {
    localStorage.setItem(FACILITY_KEY, id)
    setFacilityIdState(id)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      org: profile?.organizations ?? null,
      facilities,
      facilityId,
      facility: facilities.find((f) => f.id === facilityId) ?? null,
      role: profile?.role ?? null,
      loading,
      setFacilityId,
      refresh,
      signOut,
    }),
    [session, profile, facilities, facilityId, loading, setFacilityId, refresh, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider')
  return ctx
}
