// นำเข้าชุดโมดูลที่จำเป็น
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');


// สร้างแอป Express
const app = express();

// ใช้ CORS middleware เพื่ออนุญาตให้ frontend React เชื่อมต่อกับ backend ได้
app.use(cors());
app.use(bodyParser.json()); // ใช้ bodyParser middleware เพื่อแยกข้อมูล JSON จาก request body

// ตั้งค่าพอร์ตสำหรับเซิร์ฟเวอร์
const PORT = process.env.PORT || 5000;

// สร้างการเชื่อมต่อกับฐานข้อมูล MySQL
const db = mysql.createConnection({
    host: 'localhost',  // ชื่อโฮสต์ของเซิร์ฟเวอร์ MySQL
    user: 'root',       // ชื่อผู้ใช้ MySQL
    password: '',       // รหัสผ่าน MySQL
    database: 'buffe_foodlist'  // ชื่อฐานข้อมูล MySQL
});

// เชื่อมต่อกับฐานข้อมูล MySQL
db.connect(err => {
    if (err) {
        console.error('MySQL connection error:', err);
        process.exit(1);  // หยุดการทำงานหากเชื่อมต่อไม่ได้
    }
    console.log('MySQL Connected...');
});

// ฟังก์ชันการสร้าง QR Code
function generateQRCode(tableNumber, callback) {
    const url = `http://172.20.10.2:3000/Menufoods?table=${tableNumber}`; // URL ที่เป็น public
    QRCode.toDataURL(url, function (err, qrCodeUrl) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, qrCodeUrl);
        }
    });
}

// สร้าง API เพื่อสร้าง QR Code สำหรับโต๊ะ
app.get('/api/generate-qr/:tableNumber', (req, res) => {
    const { tableNumber } = req.params;
    generateQRCode(tableNumber, (err, qrCodeUrl) => {
        if (err) {
            res.status(500).json({ error: 'Failed to generate QR code' });
        } else {
            res.status(200).json({ qrCodeUrl });
        }
    });
});


// สร้าง API เพื่อดึงข้อมูลจากฐานข้อมูล
app.get('/api/getdata', (req, res) => {
    const query = 'SELECT * FROM orders';  // แทนที่ด้วยชื่อจริงของตาราง
    db.query(query, (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send(err);
        } else {
            res.status(200).json(result);  // ส่งข้อมูลกลับไปในรูปแบบ JSON
        }
    });
});

// สร้าง API เพื่ออัปเดตสถานะของเมนูอาหาร
app.post('/api/updateStatus', (req, res) => {
    const { id } = req.body;
    const query = 'UPDATE orders SET status = "delivered" WHERE Table_ID = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            res.status(500).send(err);
        } else {
            res.status(200).send('Status updated');
        }
    });
});

// สร้าง API เพื่ออัปเดตข้อมูลในฐานข้อมูล
app.put('/api/update/:id', (req, res) => {
    const { id } = req.params;
    const { Food_Name, Values_food } = req.body;
    const query = 'UPDATE orders SET Food_Name = ?, Values_food = ? WHERE Table_ID = ?';
    db.query(query, [Food_Name, Values_food, id], (err, result) => {
      if (err) {
        console.error('Error executing query:', err);
        res.status(500).send(err);
      } else {
        res.status(200).json({ Table_ID: id, Food_Name, Values_food });
      }
    });
});

// ลบข้อมูลที่มี Table_ID เดิม
app.delete('/api/delete/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM orders WHERE Table_ID = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send(err);
        } else {
            res.status(200).send(`Record with Table_ID = ${id} deleted.`);
        }
    });
});

// เพิ่มข้อมูลใหม่
app.post('/api/create', (req, res) => {
    const { Table_ID, Food_Name, Values_food } = req.body;
    const query = 'INSERT INTO orders (Table_ID, Food_Name, Values_food) VALUES (?, ?, ?)';
    db.query(query, [Table_ID, Food_Name, Values_food], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send(err);
        } else {
            res.status(201).json({ Table_ID, Food_Name, Values_food });
        }
    });
});









// API สำหรับดึงข้อมูลโต๊ะ
app.get('/api/getTables', (req, res) => {
    const query = 'SELECT * FROM tables';

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching tables from database:', err);
        } else {
            // หากดึงข้อมูลจากฐานข้อมูลสำเร็จ
            res.status(200).json(result);  // ส่งข้อมูลโต๊ะจากฐานข้อมูล
        }
    });
});

// API สำหรับอัปเดตสถานะของโต๊ะในฐานข้อมูล
app.put('/api/updateTableStatus/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // อัปเดตสถานะของโต๊ะในฐานข้อมูล
    const query = 'UPDATE tables SET status = ? WHERE id = ?';
    db.query(query, [status, id], (err, result) => {
        if (err) {
            console.error('Error updating table status:', err);
            res.status(500).send('Error updating table status');
        } else {
            res.status(200).json({ id, status }); // ส่งข้อมูลโต๊ะที่อัปเดตแล้วกลับไป
        }
    });
});






const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });


app.post('/api/foods', upload.single('image'), (req, res) => {
  const { name } = req.body;
  const image = req.file.filename;

  const query = 'INSERT INTO addmenu (name, image_url) VALUES (?, ?)';
  db.query(query, [name, `/uploads/${image}`], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      res.status(500).send('Error adding food item');
    } else {
      res.status(201).json({ message: 'Food item added successfully' });
    }
  });
});

// API สำหรับดึงข้อมูลรายการอาหาร
app.get('/api/foods', (req, res) => {
  const query = 'SELECT * FROM addmenu';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Error fetching data');
    } else {
      res.status(200).json(result);
    }
  });
});

// ให้โฟลเดอร์ uploads สามารถเข้าถึงได้
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API สำหรับลบรายการอาหารตาม name
app.delete('/api/foods/:name', (req, res) => {
    const { name } = req.params;
    const query = 'DELETE FROM addmenu WHERE name = ?';
    db.query(query, [name], (err, result) => {
      if (err) {
        console.error('Error deleting data:', err);
        res.status(500).send('Error deleting food item');
      } else if (result.affectedRows === 0) {
        res.status(404).send('Food item not found');
      } else {
        res.status(200).json({ message: 'Food item deleted successfully' });
      }
    });
  });
  


















// เริ่มต้นเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
