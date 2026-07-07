'use client'

import { useRef, useState } from 'react'
import { FileUp, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface PolicyUploadProps {
  onUploaded: () => void
}

export function PolicyUpload({ onUploaded }: PolicyUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function pick(selected: File | null) {
    setError(null)
    if (selected && !selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are accepted.')
      return
    }
    setFile(selected)
  }

  async function upload() {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/insurance/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Upload failed')
      setFile(null)
      onUploaded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          pick(e.dataTransfer.files[0] ?? null)
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-10 cursor-pointer transition-colors',
          error
            ? 'border-red-500/50 bg-red-500/5'
            : dragging
              ? 'border-[#C9A84C] bg-[#C9A84C]/5'
              : 'border-[#1E1E1E] bg-surface hover:border-[#C9A84C]/40'
        )}
      >
        <FileUp className="h-8 w-8 text-[#C9A84C]" />
        <p className="text-sm font-body text-[#F5F5F5]">
          {dragging ? 'Drop it here' : 'Drag & drop a policy PDF, or click to browse'}
        </p>
        <p className="text-xs font-body text-[#9CA3AF]">PDF only · processed in memory, never stored</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </div>

      {file && (
        <div className="flex items-center justify-between rounded-md bg-[#1A1A1A] border border-[#1E1E1E] px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#C9A84C]" />
            <span className="text-sm font-body text-[#F5F5F5]">{file.name}</span>
            <span className="text-xs font-mono text-[#9CA3AF]">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <Button onClick={upload} loading={uploading} size="sm">
            {uploading ? 'Extracting data with AI…' : 'Upload & Extract'}
          </Button>
        </div>
      )}

      {error && <p className="text-sm font-body text-[#C0392B]">{error}</p>}
    </div>
  )
}
