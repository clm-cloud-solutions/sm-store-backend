import { reserveStock, releaseStock, createOrder } from "../lib/db-client.js";
import { fetchProduct } from "../lib/db-client.js";
import { cors } from "../lib/cors.js";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, items, shipping } = req.body;
    if (!userId || !items || !items.length) {
      return res.status(400).json({ error: "userId, items[], and shipping required" });
    }
    if (!shipping || !shipping.name || !shipping.address || !shipping.city) {
      return res.status(400).json({ error: "shipping must include name, address, city" });
    }

    // Step 1: Validate products and stock
    const enrichedItems = [];
    for (const item of items) {
      const result = await fetchProduct(item.productId);
      const product = result.data;
      if (product.stock < item.qty) {
        return res.status(409).json({
          error: `Insufficient stock for ${product.name}`,
          step: "validation",
        });
      }
      enrichedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: item.qty,
      });
    }

    // Step 2: Reserve stock
    const reserved = [];
    try {
      for (const item of enrichedItems) {
        await reserveStock(item.productId, item.qty);
        reserved.push(item);
      }
    } catch (err) {
      // Rollback reserved items
      for (const item of reserved) {
        try { await releaseStock(item.productId, item.qty); } catch {}
      }
      return res.status(409).json({ error: "Stock reservation failed", step: "reserve" });
    }

    // Step 3: Create order
    let order;
    try {
      const result = await createOrder(userId, enrichedItems, shipping);
      order = result.data;
    } catch (err) {
      // Rollback stock
      for (const item of reserved) {
        try { await releaseStock(item.productId, item.qty); } catch {}
      }
      return res.status(502).json({ error: "Order creation failed", step: "create_order" });
    }

    res.status(201).json({
      data: {
        orderId: order.id,
        total: order.total,
        status: order.status,
        items: enrichedItems.length,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
