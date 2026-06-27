# API Specification (Phase 1)

Phase 1 ใช้ **Supabase auto-generated REST API** เป็นหลัก ส่วน complex query (smart_search) เรียกผ่าน `rpc()` ตรงๆ — ไม่ต้องมี custom backend ใน Phase 1

ไฟล์นี้ describe Supabase RPC calls + table queries หลักที่ frontend ต้องใช้

## Conventions

### Supabase Client Setup
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        'x-session-id': getOrCreateSessionId(), // สำหรับ guest
      },
    },
  }
);
```

### Headers
- `Authorization: Bearer <token>` — auto-set โดย Supabase client เมื่อ user login (Phase 2+)
- `x-session-id` — session UUID สำหรับ guest (ใช้กับ RLS)

### Error Handling
Supabase return `{ data, error }` — ตรวจ `error` ก่อนใช้ `data` เสมอ

```typescript
const { data, error } = await supabase.from('products').select();
if (error) {
  console.error(error);
  return;
}
// ใช้ data
```

---

## Endpoints / Operations

### Search

#### Smart Search (RPC)
```typescript
const { data, error } = await supabase.rpc('smart_search', {
  p_query: 'ผ้าเบรก civic',
  p_vehicle_id: 42,        // optional
  p_category_id: 5,         // optional
  p_brand: 'Brembo',        // optional
  p_min_price: 500,         // optional
  p_max_price: 5000,        // optional
  p_limit: 20,
  p_offset: 0,
});

// data: Array<{ id, sku, name_th, brand, price, in_stock, relevance }>
```

#### Search Suggestions (autocomplete)
```typescript
const { data, error } = await supabase
  .from('products')
  .select('name_th, brand')
  .textSearch('searchable_text', query, { type: 'websearch' })
  .limit(5);
```

#### Log Search (async)
```typescript
// fire and forget
supabase.from('search_logs').insert({
  query,
  results_count,
  session_id,
  vehicle_filter: vehicleId,
});
```

### Products

#### Get Product Detail
```typescript
const { data, error } = await supabase
  .from('products')
  .select(`
    *,
    category:product_categories(id, name_th, slug),
    images:product_images(url, alt_text, is_primary, sort_order),
    compatible_vehicles:product_vehicles(
      vehicle:vehicles(id, brand, model, year_from, year_to, engine)
    ),
    inventory:product_inventory(quantity)
  `)
  .eq('id', productId)
  .single();
```

#### List Products with Filters
```typescript
let query = supabase
  .from('products')
  .select(`
    id, sku, name_th, brand, price,
    images:product_images!inner(url, is_primary)
  `)
  .eq('images.is_primary', true);

if (vehicleId) {
  query = query.eq('product_vehicles.vehicle_id', vehicleId);
}
if (categoryId) query = query.eq('category_id', categoryId);
if (brand) query = query.eq('brand', brand);
if (minPrice) query = query.gte('price', minPrice);
if (maxPrice) query = query.lte('price', maxPrice);

const { data, error } = await query
  .order(sortBy)
  .range(offset, offset + pageSize - 1);
```

### Categories

```typescript
const { data, error } = await supabase
  .from('product_categories')
  .select('*, children:product_categories!parent_id(*)')
  .is('parent_id', null)
  .order('sort_order');
```

### Vehicles

#### Get Brands
```typescript
const { data, error } = await supabase
  .from('vehicles')
  .select('brand')
  .order('brand');
// dedupe ที่ frontend
```

#### Get Models by Brand
```typescript
const { data, error } = await supabase
  .from('vehicles')
  .select('model, year_from, year_to')
  .eq('brand', brand)
  .order('model');
```

#### Lookup Specific Vehicle
```typescript
const { data, error } = await supabase
  .from('vehicles')
  .select('id, engine')
  .eq('brand', brand)
  .eq('model', model)
  .lte('year_from', year)
  .gte('year_to', year);
```

### Garage

#### List Vehicles
```typescript
const { data, error } = await supabase
  .from('user_vehicles')
  .select('*, vehicle:vehicles(*)')
  .eq('session_id', sessionId)
  .order('is_primary', { ascending: false });
```

#### Add Vehicle to Garage
```typescript
const { data, error } = await supabase
  .from('user_vehicles')
  .insert({
    session_id: sessionId,
    vehicle_id: vehicleId,
    nickname,
    license_plate,
    is_primary,
  })
  .select()
  .single();
```

#### Remove Vehicle
```typescript
const { error } = await supabase
  .from('user_vehicles')
  .delete()
  .eq('id', userVehicleId);
```

### Wishlist

#### List
```typescript
const { data, error } = await supabase
  .from('wishlist_items')
  .select(`
    id, note, added_at,
    product:products(
      id, sku, name_th, brand, price,
      images:product_images(url, is_primary)
    )
  `)
  .eq('session_id', sessionId)
  .order('added_at', { ascending: false });
```

#### Add
```typescript
const { data, error } = await supabase
  .from('wishlist_items')
  .insert({ session_id: sessionId, product_id: productId, note })
  .select()
  .single();
```

#### Remove
```typescript
const { error } = await supabase
  .from('wishlist_items')
  .delete()
  .eq('id', wishlistItemId);
```

### Inquiries

#### Submit Inquiry
```typescript
const { data, error } = await supabase
  .from('inquiries')
  .insert({
    session_id: sessionId,
    customer_name,
    contact_phone,
    contact_line,
    contact_email,
    vehicle_id,
    message,
    product_ids: [123, 456],  // ID ของสินค้าที่สนใจ
    source: 'product_page',   // หรือ 'search', 'contact_form'
  })
  .select()
  .single();

// trigger email notification ผ่าน Supabase Edge Function
```

## Edge Function: Send Inquiry Email

```typescript
// supabase/functions/send-inquiry-email/index.ts
import { serve } from 'std/http/server.ts';

serve(async (req) => {
  const { inquiry_id } = await req.json();
  
  // Fetch inquiry detail
  // Send email via Resend API (free tier)
  // Update inquiry.email_sent_at
});
```

ตั้ง webhook ใน Supabase: when row inserted in `inquiries` → call this function

## Rate Limits

ใน Phase 1 Supabase free tier มี built-in rate limit (~ 1000 req/sec แต่ละ user)
Phase 2 ถ้าเพิ่ม custom API ค่อยใส่ specific rate limit per endpoint

## OpenAPI / Types

Supabase auto-generate TypeScript types

```bash
# สร้าง types จาก database schema
npx supabase gen types typescript --project-id <ref> > src/types/supabase.ts
```

ใช้ใน code
```typescript
import type { Database } from '@/types/supabase';
type Product = Database['public']['Tables']['products']['Row'];
```

## Phase 2: เพิ่ม Custom Backend

เมื่อต้องการ
- Order workflow ที่ complex
- Payment webhooks
- Background jobs (email queue, inventory sync)
- Rate limit ที่ละเอียด
- Server-side analytics

จะเพิ่ม Express API ที่
- POST /api/orders/checkout (handle payment flow)
- POST /api/payments/webhook
- POST /api/notifications/send
- etc.

แต่ Phase 1 ไม่ต้อง — Supabase API พอ
