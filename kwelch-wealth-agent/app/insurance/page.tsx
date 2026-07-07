'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PolicyCard } from '@/components/insurance/PolicyCard'
import { PolicyUpload } from '@/components/insurance/PolicyUpload'
import { CoverageAnalysis } from '@/components/insurance/CoverageAnalysis'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { InsurancePolicy } from '@/types'

export default function InsurancePage() {
  const [policies, setPolicies] = useState<InsurancePolicy[] | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/insurance/list')
      const json = await res.json()
      if (json.success) setPolicies(json.data)
      else setError(json.error || 'Failed to load policies')
    } catch {
      setError('Failed to load policies')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function remove(id: number) {
    await fetch(`/api/insurance/delete?id=${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <PageWrapper>
      <div className="flex justify-between items-center">
        <p className="text-sm font-body text-[#9CA3AF]">
          Upload a policy PDF — the AI extracts coverage, premiums, and riders automatically.
        </p>
        <Button size="sm" onClick={() => setShowUpload((v) => !v)}>
          {showUpload ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showUpload ? 'Close' : 'Upload Policy'}
        </Button>
      </div>

      {showUpload && (
        <PolicyUpload
          onUploaded={() => {
            setShowUpload(false)
            load()
          }}
        />
      )}

      {error && (
        <Card>
          <p className="text-sm font-body text-[#C0392B]">{error}</p>
        </Card>
      )}

      {policies === null && !error && (
        <Card className="flex justify-center py-12">
          <Spinner size="lg" />
        </Card>
      )}

      {policies && policies.length === 0 && (
        <Card>
          <div className="text-center py-10 space-y-2">
            <p className="text-sm font-body text-[#F5F5F5]">No policies on file yet.</p>
            <p className="text-xs font-body text-[#9CA3AF]">
              Hit “Upload Policy” and drop in a PDF — extraction takes about ten seconds.
            </p>
          </div>
        </Card>
      )}

      {policies && policies.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {policies.map((policy) => (
            <PolicyCard key={policy.id} policy={policy} onDelete={remove} />
          ))}
        </div>
      )}

      {policies && policies.length > 0 && <CoverageAnalysis policies={policies} />}
    </PageWrapper>
  )
}
