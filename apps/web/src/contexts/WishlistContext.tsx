/**
 * WishlistContext — wishlist ที่ผูกกับ session (เก็บใน Supabase)
 * ใช้ optimistic update: เปลี่ยน UI ก่อน แล้วค่อย sync ไป Supabase
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createSessionClient } from '@/lib/supabase'
import { useSession } from './SessionContext'

export interface WishlistItem {
  id: number
  productId: number
  note: string | null
  addedAt: string
}

interface WishlistContextValue {
  items: WishlistItem[]
  isLoading: boolean
  isInWishlist: (productId: number) => boolean
  addToWishlist: (productId: number, note?: string) => Promise<void>
  removeFromWishlist: (productId: number) => Promise<void>
  toggleWishlist: (productId: number) => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { sessionId } = useSession()
  // สร้าง client ใหม่เมื่อ sessionId เปลี่ยน เพื่อแนบ x-session-id header ตาม RLS policy
  const supabase = useMemo(() => createSessionClient(sessionId), [sessionId])
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // โหลด wishlist จาก Supabase เมื่อ session เปลี่ยน
  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data } = await supabase
        .from('wishlist_items')
        .select('id, product_id, note, added_at')
        .eq('session_id', sessionId)
        .order('added_at', { ascending: false })

      if (!cancelled && data) {
        setItems(
          data.map((row) => ({
            id: row.id,
            productId: row.product_id,
            note: row.note,
            addedAt: row.added_at ?? new Date().toISOString(),
          }))
        )
      }
      if (!cancelled) setIsLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  const isInWishlist = useCallback(
    (productId: number) => items.some((i) => i.productId === productId),
    [items]
  )

  const addToWishlist = useCallback(
    async (productId: number, note?: string) => {
      // optimistic update
      const tempItem: WishlistItem = {
        id: -Date.now(),
        productId,
        note: note ?? null,
        addedAt: new Date().toISOString(),
      }
      setItems((prev) => [tempItem, ...prev])

      const { data, error } = await supabase
        .from('wishlist_items')
        .insert({ session_id: sessionId, product_id: productId, note: note ?? null })
        .select('id, product_id, note, added_at')
        .single()

      if (error) {
        // rollback
        setItems((prev) => prev.filter((i) => i.id !== tempItem.id))
        return
      }

      // replace temp item with real row
      setItems((prev) =>
        prev.map((i) =>
          i.id === tempItem.id
            ? {
                id: data.id,
                productId: data.product_id,
                note: data.note,
                addedAt: data.added_at ?? new Date().toISOString(),
              }
            : i
        )
      )
    },
    [sessionId]
  )

  const removeFromWishlist = useCallback(
    async (productId: number) => {
      const item = items.find((i) => i.productId === productId)
      if (!item) return

      // optimistic remove
      setItems((prev) => prev.filter((i) => i.productId !== productId))

      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('session_id', sessionId)
        .eq('product_id', productId)

      if (error) {
        // rollback
        setItems((prev) => [item, ...prev])
      }
    },
    [items, sessionId]
  )

  const toggleWishlist = useCallback(
    async (productId: number) => {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId)
      } else {
        await addToWishlist(productId)
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
  )

  return (
    <WishlistContext.Provider
      value={{ items, isLoading, isInWishlist, addToWishlist, removeFromWishlist, toggleWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist ต้องใช้ภายใน WishlistProvider')
  return ctx
}
