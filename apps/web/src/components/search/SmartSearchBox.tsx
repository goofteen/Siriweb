/**
 * SmartSearchBox — search input พร้อม autocomplete
 * - debounce 300ms ก่อน fetch suggestions
 * - กด Enter หรือเลือก suggestion → navigate ไป /search?q=...
 * - zero-result handling: แสดง "ลองค้น..." แนะนำ
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
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
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      return
    }

    debounceRef.current = setTimeout(async () => {
      const results = await searchSuggestions(query, 6)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
      setSelectedIndex(-1)
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
    if (onSearch) {
      onSearch(trimmed)
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') handleSubmit(query)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0) {
        handleSubmit(suggestions[selectedIndex].name_th)
      } else {
        handleSubmit(query)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
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
      {showSuggestions && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
        >
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
