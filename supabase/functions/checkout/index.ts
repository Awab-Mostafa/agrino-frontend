import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

type Item = { product_id: string; quantity: number }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { items, customer } = await req.json() as { items: Item[]; customer: any }
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
      })
    }

    // 👇 استخدم أسماء secrets الجديدة
    const supabase = createClient(
      Deno.env.get('PROJECT_URL')!,          // كان SUPABASE_URL
      Deno.env.get('SERVICE_ROLE_KEY')!      // كان SUPABASE_SERVICE_ROLE_KEY
    )

    const ids = items.map((i) => i.product_id)
    const { data: products, error: pErr } = await supabase
      .from('products').select('id, price, stock, is_active, name').in('id', ids)
    if (pErr) throw pErr

    const map = new Map(products.map((p: any) => [p.id, p]))
    let total = 0
    for (const i of items) {
      const p = map.get(i.product_id)
      if (!p || !p.is_active) throw new Error('Product unavailable: ' + i.product_id)
      if (!i.quantity || i.quantity < 1) throw new Error('Bad quantity for ' + i.product_id)
      total += Number(p.price) * Number(i.quantity)
    }

    const { data: order, error: oErr } = await supabase
      .from('orders')
      .insert({
        customer_name: customer?.name ?? 'Guest',
        customer_phone: customer?.phone ?? '',
        customer_address: customer?.address ?? '',
        total, status: 'pending',
      })
      .select('id').single()
    if (oErr) throw oErr

    const itemsRows = items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: map.get(i.product_id).price,
    }))
    const { error: oiErr } = await supabase.from('order_items').insert(itemsRows)
    if (oiErr) throw oiErr

    return new Response(JSON.stringify({ ok: true, order_id: order.id, total }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
    })
  }
})
