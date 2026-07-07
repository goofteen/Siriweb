import { useState, useRef } from 'react'
import { Plus, Trash2, X, Building2 } from 'lucide-react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'

interface Branch {
  id: number
  name: string
  code: string
  sort_order: number
  is_active: boolean
}

export default function AdminBranchesPage() {
  const queryClient = useQueryClient()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickName, setQuickName] = useState('')
  const [quickCode, setQuickCode] = useState('')
  const [quickSaving, setQuickSaving] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, code, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order')
        .order('name')
      if (error) throw error
      return (data ?? []) as Branch[]
    },
    staleTime: 30 * 1000,
  })

  const branches = data ?? []

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('branches').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] })
    },
  })

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = quickName.trim()
    const code = quickCode.trim().toUpperCase()
    if (!name || !code) return
    setQuickSaving(true)
    const { error } = await supabase
      .from('branches')
      .insert({ name, code, is_active: true, sort_order: 0 })
    if (error) {
      alert(`เพิ่มไม่สำเร็จ: ${error.message}`)
      setQuickSaving(false)
      return
    }
    queryClient.invalidateQueries({ queryKey: ['admin-branches'] })
    setQuickName('')
    setQuickCode('')
    setQuickSaving(false)
    setShowQuickAdd(false)
  }

  function handleDelete(branch: Branch) {
    const confirmed = window.confirm(`ลบสาขา '${branch.name}'?\nข้อมูลสต็อกของสาขานี้จะถูกลบด้วย`)
    if (!confirmed) return
    deleteMutation.mutate(branch.id)
  }

  function openQuickAdd() {
    setShowQuickAdd(true)
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }

  function closeQuickAdd() {
    setShowQuickAdd(false)
    setQuickName('')
    setQuickCode('')
  }

  return (
    <div>
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">สาขา</h1>
          {!isLoading && (
            <p className="mt-0.5 text-sm text-muted-foreground">{branches.length} สาขา</p>
          )}
        </div>
        <Button variant="outline" onClick={showQuickAdd ? closeQuickAdd : openQuickAdd}>
          <Plus className="mr-1.5 size-4" />
          เพิ่มสาขา
        </Button>
      </div>

      {/* quick-add inline form */}
      {showQuickAdd && (
        <form
          onSubmit={handleQuickAdd}
          className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3"
        >
          <Input
            ref={nameInputRef}
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            placeholder="ชื่อสาขา เช่น สาขาลาดพร้าว"
            className="min-w-40 flex-1"
            required
          />
          <Input
            value={quickCode}
            onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
            placeholder="รหัสสาขา เช่น LPR"
            className="w-36"
            required
          />
          <Button
            type="submit"
            size="sm"
            disabled={quickSaving || !quickName.trim() || !quickCode.trim()}
          >
            {quickSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
          <button
            type="button"
            onClick={closeQuickAdd}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </form>
      )}

      {/* table */}
      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="mb-3 size-10 text-muted-foreground/30" />
            <p className="font-medium">ยังไม่มีสาขา</p>
            <p className="mt-1 text-sm text-muted-foreground">กด "เพิ่มสาขา" เพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    ชื่อสาขา
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">รหัส</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">ลำดับ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {branches.map((branch) => (
                  <tr key={branch.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{branch.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {branch.code}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {branch.sort_order}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleDelete(branch)}
                          disabled={deleteMutation.isPending}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="ลบสาขา"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
