const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mysql = require('mysql');
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const pool = mysql.createConnection({
            host:"localhost",
            user:"johnmarc_johnmarco",
            password:"Sm7DLnR55E6nrwYRdYNM",
            database:"johnmarc_johnmarco"
     });

     pool.connect(err => {
    if (err) throw err;
    console.log("✅ MySQL Connected!");
});
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const session = require("express-session");

app.use(session({
    secret: "johnaddtocartpin",  // use a strong secret
    resave: false,
    saveUninitialized: true
}));

app.get('/', (req, res) => {
    
    pool.query("SELECT * FROM herosection",(err,result)=> {
    if(err){
        console.error("error");
    }else{
        
        res.render('index',{result:result, user: req.session.user });
    }
})
});

app.get('/resister', (req, res) => {
        res.sendFile(path.join(__dirname,'views', 'resister.html'));
    });

app.post("/resister", async (req, res) => {
const { username, mobilenumber, password } = req.body;

    const sql = "INSERT INTO users (username, mobilenumber, password) VALUES (?, ?, ?)";
   
    pool.query(sql, [username, mobilenumber, password], (err) => {
        if (err) {
            console.error(err);
            return res.send("❌ Registration failed. Email may already exist.");
        }
        res.send("✅ Registration successful!");
    });
});

app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname,'views', 'login.html'));
    });

app.post("/login", (req, res) => {
    const { mobilenumber, password } = req.body;

    const sql = "SELECT * FROM users WHERE mobilenumber = ?";
    pool.query(sql, [mobilenumber], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.render("login", { error: "❌ User not found." });
        }

        const user = results[0];

        // check password
        if (user.password !== password) {
            return res.render("login", { error: "❌ Incorrect password." });
        }

        // Save session
        req.session.user = { id: user.uid, username: user.username, mobilenumber: user.mobilenumber };
        res.redirect("/");
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

app.get('/menu/:category', (req, res) => {
    const selectedCategory = req.params.category;

    pool.query("SELECT * FROM product WHERE category = ?", [selectedCategory], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching products");
        }

        pool.query("SELECT * FROM category", (err, category) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error fetching categories");
            }

            res.render('menu', { result: result, category: category, selectedCategory: selectedCategory,user: req.session.user });
        });
    });
});
    
app.get('/cart', (req, res) => {
    let cart = req.session.cart || [];
    let totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    pool.query("SELECT * FROM offer", (err, result) => {
        if (err) {
            console.error("Error fetching offers:", err);
            return res.status(500).send("Database error");
        }
        // Render after fetching offers
        res.render("cart", { cart, totalPrice, user: req.session.user, offers: result });
    });
});

    app.post("/cart", (req, res) => {
        const { id, itemname, itemimage, price, quantity, size, category } = req.body;
        
        if (!req.session.cart) {
            req.session.cart = [];
        }
        
        // Check if item already exists in cart
        let existing = req.session.cart.find(item => item.id === id && item.size === size);
        
        if (existing) {
            existing.quantity += parseInt(quantity);
        } else {
            req.session.cart.push({
                id,
                name: itemname,
                image: itemimage,
                price: parseFloat(price),
                size,
                category,
                quantity: parseInt(quantity)
            });
        }
    
        res.redirect("/cart");
    });    
    
app.post("/cart/remove/:index", (req, res) => {
    let index = req.params.index;
    if (req.session.cart) {
        req.session.cart.splice(index, 1);
    }
    res.redirect("/cart");
});

app.post("/checkout", (req, res) => {
    if (!req.session.user) {
    return res.json({ success: false, message: "⚠️ Please login to place order." });
  }

  const cart = req.session.cart || [];
  if (cart.length === 0) {
    return res.json({ success: false, message: "⚠️ Your cart is empty." });
  }

  const { address, payment_method, mobile } = req.body;

  // make sure you save id & username in session during login
  const uid = req.session.user.id;
  const username = req.session.user.username;

  const total_price = cart.reduce(
    (sum, item) => sum + (Number(item.price) * Number(item.quantity)),0);

const now = new Date();
const hours = now.getHours().toString().padStart(2, "0");
const minutes = now.getMinutes().toString().padStart(2, "0");
const time = `${hours}:${minutes}`;

const date = now.toISOString().split("T")[0];
   const mobilen = req.session.user.mobilenumber
  const sql = `
    INSERT INTO orders (oname, size, quantity, total_price, payment_method, address, mobile, user)
    VALUES ?
  `;

  const values = cart.map(item => [
    item.name,            
    item.size,            
    Number(item.quantity),
    Number(total_price),  
    payment_method,
    address,
    mobilen,
    username
  ]);

  pool.query(sql, [values], (err) => {
    if (err) {
      console.error("❌ Order insert failed:", err);
      return res.json({ success: false, message: "❌ Failed to place order." });
    }

    req.session.cart = []; // clear cart

    return res.json({
      success: true,
      message: "✅ Order placed successfully!",
      time,
      date
    });
  });
});
        
app.get('/myorders', (req, res) => {
  if (!req.session.user) {
    return res.redirect("/cart"); // force login if not logged in
  }

  const uid = req.session.user.mobilenumber;

  const sql = `
    SELECT 
      created_at,
      SUM(total_price) AS total_price,

      -- Name column: merge size items + non-size items
      GROUP_CONCAT(
        CASE 
          WHEN size IS NULL OR size = '' 
            THEN CONCAT(oname, ' (x', quantity, ')')
          ELSE CONCAT(oname, ' (', size, ' x', quantity, ')')
        END
        SEPARATOR ', '
      ) AS oname,

      payment_method,
      status
    FROM orders
    WHERE mobile = ?
    GROUP BY created_at, payment_method, status
    ORDER BY created_at DESC
  `;

  pool.query(sql, [uid], (err, orders) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching orders");
    }

    res.render("myorder", { orders, user: req.session.user });
  });
});


const PORT = 4000;
app.listen(PORT,()=>{
  console.log(`running at http://localhost:${PORT}`)

});
