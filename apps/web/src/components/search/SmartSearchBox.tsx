/**
 * SmartSearchBox — search input พร้อม autocomplete
 * - debounce 300ms ก่อน fetch suggestions
 * - แสดง suggestions จาก ILIKE + fuzzy fallback (ดู search.ts)
 * - กด Enter หรือเลือก suggestion → navigate ไป /search?q=...
 * - dropdown คงอยู่ระหว่าง fetch — ไม่กะพริบหาย
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { searchSuggestions } from '@/lib/search'
import { cn } from '@/lib/utils'

interface SmartSearchBoxProps {
  initialValue?: string
  placeholder?: string
  autoFocus?: boolean
  onSearch?: (query: string) => void
  className?: string
}

export function SmartSearchBox({
  initialValue = '',
  placeholder = 'ค้นหาอะไหล่ รุ่นรถ หรือรหัสสินค้า...',
  autoFocus = false,
  onSearch,
  className,
}: SmartSearchBoxProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<Array<{ name_th: string; brand: string | null }>>(
    []
  )
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ปิด dropdown เมื่อ click นอก component
  const closeDropdown = useCallback(() => {
    setShowSuggestions(false)
  }, [])

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [closeDropdown])

  // sync ถ้า initialValue เปลี่ยน (เช่น กลับมาหน้า search)
  useEffect(() => {
    setQuery(initialValue)
  }, [initialValue])

  // debounce fetch suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      setIsFetching(false)
      return
    }

    // แสดง loading indicator ทันที ไม่รอ debounce
    setIsFetching(true)
    setShowSuggestions(true)

    debounceRef.current = setTimeout(async () => {
      const results = await searchSuggestions(query, 6)
      setSuggestions(results)
      setIsFetching(false)
      setSelectedIndex(-1)
      // ถ้าผลว่างเปล่า ยังคง showSuggestions=false (ปิด dropdown)
      if (results.length === 0) setShowSuggestions(false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function handleSubmit(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    setShowSuggestions(false)
    setSuggestions([])
    setIsFetching(false)
    if (onSearch) {
      onSearch(trimmed)
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (showSuggestions && suggestions.length > 0 && selectedIndex >= 0) {
        handleSubmit(suggestions[selectedIndex].name_th)
      } else {
        handleSubmit(query)
      }
      return
    }

    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const dropdownVisible = showSuggestions && (isFetching || suggestions.length > 0)

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative flex items-center">
        {isFetching ? (
          <Loader2 className="absolute left-3 size-4 animate-spin text-muted-foreground" />
        ) : (
          <Search className="absolute left-3 size-4 text-muted-foreground" />
        )}
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => (suggestions.length > 0 || isFetching) && setShowSuggestions(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className="h-12 pl-9 pr-9 text-base"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setSuggestions([])
              setShowSuggestions(false)
              setIsFetching(false)
              inputRef.current?.focus()
            }}
            aria-label="ล้างการค้นหา"
            className="absolute right-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* autocomplete dropdown */}
      {dropdownVisible && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
        >
          {/* loading skeleton */}
          {isFetching && suggestions.length === 0 && (
            <li className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              <span>กำลังค้นหา...</span>
            </li>
          )}

          {/* suggestions */}
          {suggestions.map((s, i) => (
            <li
              key={i}
              role="option"
              aria-selected={i === selectedIndex}
              onMouseDown={() => handleSubmit(s.name_th)}
              className={cn(
                'flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                i === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
              )}
            >
              <Search className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{s.name_th}</span>
              {s.brand && <span className="shrink-0 text-xs text-muted-foreground">{s.brand}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
