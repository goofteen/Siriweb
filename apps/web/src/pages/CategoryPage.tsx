/**
 * CategoryPage — redirect ไป SearchPage พร้อม category filter
 * เก็บไว้เพื่อรองรับ URL เดิม (/category/:slug) ที่อาจถูก bookmark หรือ share ไว้
 */
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCategoryBySlug } from '@/hooks/useCategories'

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data: category, isLoading } = useCategoryBySlug(slug)

  useEffect(() => {
    if (category) {
      // redirect ถาวรไป SearchPage พร้อม category filter
      navigate(`/search?category=${category.id}`, { replace: true })
    }
  }, [category, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  // category ไม่เจอ
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="font-medium">ไม่พบหมวดหมู่นี้</p>
      <a href="/" className="text-sm text-primary hover:underline">
        กลับหน้าหลัก
      </a>
    </div>
  )
}
