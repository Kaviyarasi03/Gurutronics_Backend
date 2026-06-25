const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Gurutronics Backend Running 🚀");
});

app.get("/api/prebuilds", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM prebuilt_pcs ORDER BY id"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Database Error",
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});



// BRANDS
app.get("/api/brands", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM brands ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Brands database error" });
  }
});

// SUBCATEGORIES
app.get("/api/subcategories", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM subcategories ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Subcategories database error" });
  }
});

// PRODUCTS
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.tag,

        p.category_id,
        c.category_name AS category,

        p.subcategory_id,
        s.subcategory_name AS subcategory,

        p.brand_id,
        b.brand_name AS brand,

        p.name,
        p.price,
        p.old_price,
        p.rating,
        p.reviews,
        p.in_stock,
        p.image_url

      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      ORDER BY p.id;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Products database error" });
  }
});

// SINGLE PRODUCT
app.get("/api/products/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        p.id,
        p.tag,

        p.category_id,
        c.category_name AS category,

        p.subcategory_id,
        s.subcategory_name AS subcategory,

        p.brand_id,
        b.brand_name AS brand,

        p.name,
        p.price,
        p.old_price,
        p.rating,
        p.reviews,
        p.in_stock,
        p.image_url

      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE p.id = $1;
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Single product database error" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Categories database error" });
  }
});

const nodemailer = require("nodemailer");

app.post("/api/send-order-mail", async (req, res) => {
  const { customerName, contactNumber, products, subtotal, discount, total } = req.body;

  const productList = products
    .map(
      (p) =>
        `${p.name} | Qty: ${p.qty} | Price: ₹${p.price} | Subtotal: ₹${p.subtotal}`
    )
    .join("\n");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: "kaviyarasi1603@gmail.com",
    subject: "New Gurutronics Order",
    text: `
Name: ${customerName}
Contact: ${contactNumber}

Products:
${productList}

Subtotal: ₹${subtotal}
Discount: ₹${discount}
Total: ₹${total}
`,
  });

  res.json({ message: "Order mail sent" });
});