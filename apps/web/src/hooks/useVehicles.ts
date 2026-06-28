import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ดึงรายชื่อยี่ห้อรถทั้งหมด (distinct)
export function useVehicleBrands() {
  return useQuery({
    queryKey: ['vehicle-brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('brand').order('brand')
      if (error) throw error
      // distinct brands
      const brands = [...new Set(data.map((r) => r.brand))]
      return brands
    },
    staleTime: 10 * 60 * 1000, // brands ไม่ค่อยเปลี่ยน
  })
}

// ดึงรุ่นรถตามยี่ห้อ
export function useVehicleModels(brand: string | null) {
  return useQuery({
    queryKey: ['vehicle-models', brand],
    queryFn: async () => {
      if (!brand) return []
      const { data, error } = await supabase
        .from('vehicles')
        .select('model')
        .eq('brand', brand)
        .order('model')
      if (error) throw error
      const models = [...new Set(data.map((r) => r.model))]
      return models
    },
    enabled: !!brand,
    staleTime: 10 * 60 * 1000,
  })
}

// ดึงปีตามยี่ห้อ + รุ่น
export function useVehicleYears(brand: string | null, model: string | null) {
  return useQuery({
    queryKey: ['vehicle-years', brand, model],
    queryFn: async () => {
      if (!brand || !model) return []
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, year_from, year_to')
        .eq('brand', brand)
        .eq('model', model)
        .order('year_from', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!brand && !!model,
    staleTime: 10 * 60 * 1000,
  })
}

// ดึง vehicle detail ตาม ID
export function useVehicle(vehicleId: number | null) {
  return useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!vehicleId,
    staleTime: 10 * 60 * 1000,
  })
}
