import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

// ทดสอบการเชื่อมต่อ Supabase ด้วยการ ping ตาราง (จะ error ถ้า schema ยังไม่มี — นั่นโอเค)
async function checkConnection(): Promise<{ ok: boolean; latency: number }> {
  const start = Date.now()
  // rpc('version') เป็น built-in function ของ PostgreSQL — ไม่ต้องมี table ก่อน
  const { error } = await supabase.rpc('version' as never)
  const latency = Date.now() - start

  // error PGRST202 = function not found ใน PostgREST — แสดงว่า connection สำเร็จ
  // error อื่นๆ = connection ล้มเหลว
  const isRpcNotFound = error?.code === 'PGRST202'
  return { ok: !error || isRpcNotFound, latency }
}

export default function HelloPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['supabase-connection'],
    queryFn: checkConnection,
    retry: false,
  })

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-4xl">🔩</div>
          <h1 className="text-2xl font-bold tracking-tight">SiriWeb</h1>
          <p className="text-muted-foreground text-sm">เว็บอะไหล่รถยนต์ — Phase 0 Foundation</p>
        </div>

        {/* Connection Status Card */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Supabase Connection
          </h2>

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-sm">กำลังเชื่อมต่อ...</span>
            </div>
          )}

          {!isLoading && !isError && data?.ok && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  เชื่อมต่อสำเร็จ
                </span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium">URL:</span> {supabaseUrl?.replace('https://', '')}
                </p>
                <p>
                  <span className="font-medium">Latency:</span> {data.latency}ms
                </p>
              </div>
            </div>
          )}

          {(isError || (!isLoading && !data?.ok)) && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  เชื่อมต่อไม่ได้
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                กรุณาตรวจสอบ VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ใน .env
              </p>
            </div>
          )}
        </div>

        {/* Stack badges */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['React 19', 'TypeScript', 'Vite', 'Tailwind v4', 'shadcn/ui', 'Supabase'].map(
            (tech) => (
              <span
                key={tech}
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
              >
                {tech}
              </span>
            )
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">Phase 0 Foundation ✅</p>
      </div>
    </div>
  )
}
