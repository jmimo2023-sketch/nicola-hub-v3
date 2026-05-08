export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Connect accounts and manage preferences</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <span className="text-3xl">⚙️</span>
        <h2 className="font-display text-xl font-bold mt-4 mb-2">Connections & Preferences</h2>
        <p className="text-muted-foreground text-sm">Connect Instagram, manage brand voice, and configure settings. Coming in Sprint 2.</p>
      </div>
    </div>
  )
}