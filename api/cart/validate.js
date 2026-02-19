import { fetchProduct } from "../../lib/db-client.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items[] required" });
    }

    const validated = [];
    const errors = [];

    for (const item of items) {
      try {
        const result = await fetchProduct(item.productId);
        const product = result.data;
        if (product.stock < item.qty) {
          errors.push({ productId: item.productId, error: "Insufficient stock", available: product.stock });
        } else {
          validated.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            qty: item.qty,
            subtotal: product.price * item.qty,
          });
        }
      } catch {
        errors.push({ productId: item.productId, error: "Product not found" });
      }
    }

    const total = validated.reduce((sum, v) => sum + v.subtotal, 0);

    res.status(errors.length > 0 ? 422 : 200).json({
      data: { items: validated, total: Math.round(total * 100) / 100, errors },
    });
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message });
  }
}
