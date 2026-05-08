import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NavSection, ContentPillar } from '@/types'

// ── UI Store ──────────────────────────────────────────────────────────────

interface UIState {
  sidebarOpen: boolean
  activeSection: NavSection
  theme: 'light' | 'dark'
  language: 'es' | 'de' | 'en'
  sidebarOpenSection: string | null
  
  setSidebarOpen: (open: boolean) => void
  setActiveSection: (section: NavSection) => void
  setTheme: (theme: 'light' | 'dark') => void
  setLanguage: (lang: 'es' | 'de' | 'en') => void
  toggleSidebarSection: (section: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeSection: 'home',
      theme: 'light',
      language: 'es',
      sidebarOpenSection: null,

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveSection: (section) => set({ activeSection: section }),
      setTheme: (theme) => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('nicola-theme', theme)
      },
      setLanguage: (lang) => set({ language: lang }),
      toggleSidebarSection: (section) =>
        set((state) => ({
          sidebarOpenSection: state.sidebarOpenSection === section ? null : section,
        })),
    }),
    {
      name: 'nicola-ui',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        activeSection: state.activeSection,
      }),
    }
  )
)

// ── Auth Store ─────────────────────────────────────────────────────────────

interface AuthState {
  user: any | null
  profile: any | null
  loading: boolean
  
  setUser: (user: any | null) => void
  setProfile: (profile: any | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  profile: null,
  loading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  signOut: () => set({ user: null, profile: null }),
}))

// ── Content Store ─────────────────────────────────────────────────────────

interface ContentState {
  items: any[]
  selectedPillar: ContentPillar | null
  selectedStatus: string | null
  searchQuery: string
  
  setItems: (items: any[]) => void
  setSelectedPillar: (pillar: ContentPillar | null) => void
  setSelectedStatus: (status: string | null) => void
  setSearchQuery: (query: string) => void
}

export const useContentStore = create<ContentState>()((set) => ({
  items: [],
  selectedPillar: null,
  selectedStatus: null,
  searchQuery: '',

  setItems: (items) => set({ items }),
  setSelectedPillar: (pillar) => set({ selectedPillar: pillar }),
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))