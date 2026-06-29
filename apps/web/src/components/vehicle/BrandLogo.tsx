/**
 * BrandLogo — แสดง logo ยี่ห้อรถ จาก /logos/{brand}.svg
 * ถ้าไม่มีรูป (onError) จะแสดงชื่อย่อแทน
 */
interface BrandLogoProps {
  brand: string
  className?: string
}

const BRAND_LOGO_MAP: Record<string, string> = {
  Toyota: '/logos/toyota.svg',
  Honda: '/logos/honda.svg',
  Nissan: '/logos/nissan.svg',
  Mazda: '/logos/mazda.svg',
  Mitsubishi: '/logos/mitsubishi.svg',
  Isuzu: '/logos/isuzu.svg',
  Subaru: '/logos/subaru.svg',
  Suzuki: '/logos/suzuki.svg',
}

export function BrandLogo({ brand, className = 'h-5 w-10 object-contain' }: BrandLogoProps) {
  const src = BRAND_LOGO_MAP[brand]
  if (!src) return null
  return (
    <img
      src={src}
      alt={brand}
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}
