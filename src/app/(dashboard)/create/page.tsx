export default function CreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Create Content</h1>
        <p className="text-muted-foreground mt-1">Generate, design, and edit content with AI</p>
      </div>
      
      {/* AI Generator — coming next sprint */}
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✨</span>
        </div>
        <h2 className="font-display text-xl font-bold mb-2">AI Content Generator</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Generate captions, hashtags, and complete content with your brand voice. Coming in Sprint 2.
        </p>
      </div>
    </div>
  )
}