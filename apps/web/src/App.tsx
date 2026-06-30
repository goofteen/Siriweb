import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'

// customer pages
const HomePage = lazy(() => import('./pages/HomePage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const GaragePage = lazy(() => import('./pages/GaragePage'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const InquiryPage = lazy(() => import('./pages/InquiryPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// admin pages
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'))
const AdminProductFormPage = lazy(() => import('./pages/admin/AdminProductFormPage'))
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'))
const AdminCategoryFormPage = lazy(() => import('./pages/admin/AdminCategoryFormPage'))
const AdminVehiclesPage = lazy(() => import('./pages/admin/AdminVehiclesPage'))
const AdminVehicleFormPage = lazy(() => import('./pages/admin/AdminVehicleFormPage'))
const AdminInquiriesPage = lazy(() => import('./pages/admin/AdminInquiriesPage'))
const AdminBranchesPage = lazy(() => import('./pages/admin/AdminBranchesPage'))

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ─── customer routes ─── */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/garage" element={<GaragePage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/inquiry" element={<InquiryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ─── admin routes (ไม่มี AppLayout / BottomNav) ─── */}
        <Route
          path="/admin/*"
          element={
            <AdminAuthProvider>
              <Routes>
                <Route path="login" element={<AdminLoginPage />} />
                <Route element={<AdminProtectedRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<Navigate to="products" replace />} />
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route path="products/new" element={<AdminProductFormPage />} />
                    <Route path="products/:id/edit" element={<AdminProductFormPage />} />
                    <Route path="categories" element={<AdminCategoriesPage />} />
                    <Route path="categories/new" element={<AdminCategoryFormPage />} />
                    <Route path="categories/:id/edit" element={<AdminCategoryFormPage />} />
                    <Route path="vehicles" element={<AdminVehiclesPage />} />
                    <Route path="vehicles/new" element={<AdminVehicleFormPage />} />
                    <Route path="vehicles/:id/edit" element={<AdminVehicleFormPage />} />
                    <Route path="branches" element={<AdminBranchesPage />} />
                    <Route path="inquiries" element={<AdminInquiriesPage />} />
                  </Route>
                </Route>
              </Routes>
            </AdminAuthProvider>
          }
        />
      </Routes>
    </Suspense>
  )
}

export default App
