const pool = require('./src/config/db');

async function seed() {
  try {
    await pool.query(`
      INSERT INTO products (name, category, price, stock, image_url) VALUES
      ('Royal Silk Shirt', 'clothing', 250.00, 12, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500'),
      ('Gold Luxe Watch', 'watches', 850.00, 5, 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500'),
      ('Queen Leather Bag', 'bags', 420.00, 8, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500'),
      ('Suede Classic Loafers', 'shoes', 380.00, 10, 'https://images.unsplash.com/photo-1614252235316-8c857d38babc?w=500'),
      ('24K Glow Serum', 'skincare', 180.00, 20, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500'),
      ('Oud Royal Fragrance', 'fragrance', 320.00, 15, 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500');
    `);
    console.log("✅ 6 products added!");
  } catch (err) {
    console.log("Error:", err.message);
  }
  process.exit();
}
seed();