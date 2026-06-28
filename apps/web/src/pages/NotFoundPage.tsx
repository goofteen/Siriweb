import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-bold text-muted-foreground/30">404</p>
      <h1 className="mt-3 text-xl font-bold">ไม่พบหน้าที่ค้นหา</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ลองตรวจสอบ URL อีกครั้ง หรือกลับไปที่หน้าหลัก
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        กลับหน้าหลัก
      </Link>
    </div>
  )
}
