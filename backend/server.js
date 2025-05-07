// backend/server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // เพื่อให้สามารถรับข้อมูล JSON

// เชื่อมต่อ MySQL
const db = mysql.createConnection({
  host: 'localhost', // ชื่อโฮสต์
  user: 'root', // ชื่อผู้ใช้ MySQL (ค่าเริ่มต้นคือ 'root')
  password: '', // รหัสผ่าน MySQL (ค่าเริ่มต้นคือไม่มีรหัสผ่าน)
  database: 'mydatabase', // ชื่อฐานข้อมูลที่สร้างใน phpMyAdmin
});

// ตรวจสอบการเชื่อมต่อ
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// API endpoint เพื่อดึงข้อมูล
app.get('/api/items', (req, res) => {
  db.query('SELECT * FROM items', (err, results) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.json(results);
  });
});

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
