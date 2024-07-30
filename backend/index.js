const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const port = 3000;
const ipAddress = '172.22.37.36';
const secretKey = 'reward';

// Create connection pool to MySQL database
const db = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: 'Edgochoco7.',
  database: 'greenreward'
});

// Middleware to parse JSON requests
app.use(bodyParser.json());

// CORS middleware
app.use(cors());

// Endpoint to fetch user points
app.get('/userPoints', (req, res) => {
  const query = 'SELECT lastName, schoolId, rfidTags, point FROM points';
  db.query(query, (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Error fetching user data' });
    }
    res.json(results);
  });
});

// Define the generateRandomString function
const generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// Endpoint to handle user login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Query to check if user exists and fetch user data including schoolId and rfidTags
  const sql = 'SELECT schoolId, rfidTags, password FROM user WHERE schoolId = ? AND password = ? AND remarks = 0';
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
      return;
    }

    if (results.length > 0) {
      const { schoolId, rfidTags } = results[0]; // Extract schoolId and rfidTags from query results

      // Generate a unique random string for each user
      const randomString = generateRandomString(10);

      // Generate a unique token for each user based on their schoolId and additional unique data
      const tokenPayload = {
        schoolId,
        username, // Include username or other unique user data here
        randomString, // Include the generated random string
        timestamp: Date.now(),
      };
      const token = jwt.sign(tokenPayload, secretKey, { expiresIn: '1h' });

      // Send response with token, schoolId, and rfidTags as string without quotes
      res.json({ success: true, message: 'Login successful', token, schoolId, rfidTags: rfidTags.toString() });
    } else {
      // Authentication failed
      res.status(401).json({ success: false, message: 'Invalid schoolId or password' });
    }
  });
});

// Endpoint to fetch user data
app.get('/userData', (req, res) => {
  const { schoolId } = req.query;

  if (!schoolId) {
    return res.status(400).json({ success: false, message: 'Missing schoolId parameter' });
  }

  // Log the received schoolId for debugging
  console.log('Received schoolId:', schoolId);

  // Query to fetch complete user data based on schoolId
  const sql = `
    SELECT u.firstName, u.lastName, u.middleName, u.schoolId, p.point 
    FROM user u 
    INNER JOIN points p ON u.schoolId = p.schoolId 
    WHERE u.schoolId = ?
  `;

  db.query(sql, [schoolId], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }

    if (results.length > 0) {
      const userData = {
        firstName: results[0].firstName,
        lastName: results[0].lastName,
        middleName: results[0].middleName,
        schoolId: results[0].schoolId,
        points: results[0].point
      };
      res.json({ success: true, userData }); // Send complete user data in response
    } else {
      console.error('User not found for schoolId:', schoolId);
      res.status(404).json({ success: false, message: 'User not found' });
    }
  });
});

// Endpoint to change password
app.post('/changePassword', (req, res) => {
  const { schoolId, newPassword } = req.body;

  if (!schoolId || !newPassword) {
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }

  // Update the user's password in the database
  const updatePasswordQuery = 'UPDATE user SET password = ? WHERE schoolId = ?';
  db.query(updatePasswordQuery, [newPassword, schoolId], (error, results) => {
    if (error) {
      console.error('Error updating password:', error);
      return res.status(500).json({ success: false, message: 'Error updating password' });
    }

    if (results.affectedRows > 0) {
      res.json({ success: true, message: 'Password updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  });
});

// Endpoint to fetch product prices
app.get('/productPrices', (req, res) => {
  const productIds = req.query.productId.split(',').map(id => parseInt(id, 10));
  const placeholders = productIds.map(() => '?').join(','); // Create placeholders for each productId
  const query = `SELECT productId, price FROM product WHERE productId IN (${placeholders})`;

  db.query(query, productIds, (error, results) => {
    if (error) {
      console.error('Error fetching product prices:', error);
      return res.status(500).json({ message: 'Error fetching product prices' });
    }
    const prices = results.reduce((acc, product) => {
      acc[product.productId] = product.price;
      return acc;
    }, {});
    res.json({ prices });
  });
});

// Endpoint to check pending orders
app.post('/checkPendingOrders', (req, res) => {
  const { schoolId } = req.body;

  // Query to check if there are any pending orders for the given schoolId
  const checkPendingQuery = 'SELECT COUNT(*) AS count FROM orders WHERE schoolId = ? AND remarks = "pending"';

  db.query(checkPendingQuery, [schoolId], (error, results) => {
    if (error) {
      console.error('Error checking pending orders:', error);
      return res.status(500).json({ success: false, message: 'Error checking pending orders' });
    }

    const pendingCount = results[0].count;

    if (pendingCount > 0) {
      return res.json({ success: true, hasPending: true });
    } else {
      return res.json({ success: true, hasPending: false });
    }
  });
});

// Endpoint to place an order
app.post('/orders', (req, res) => {
  const { schoolId, productId, RFIDTags, quantity } = req.body;

  // Log the received request body
  console.log('Received Request Body:', req.body);

  // Fetch user data
  const userQuery = 'SELECT point FROM points WHERE schoolId = ?';
  db.query(userQuery, [schoolId], (userError, userResults) => {
    if (userError || userResults.length === 0) {
      console.error('User not found or error:', userError);
      return res.status(400).json({ success: false, message: 'User not found or error' });
    }

    const userPoints = userResults[0].point;

    // Fetch product details
    const productQuery = 'SELECT price, qty FROM product WHERE productId = ?';
    db.query(productQuery, [productId], (productError, productResults) => {
      if (productError || productResults.length === 0) {
        console.error('Product not found or error:', productError);
        return res.status(400).json({ success: false, message: 'Product not found or error' });
      }

      // Log the product results to debug the issue
      console.log('Product Results:', productResults);

      if (!productResults[0] || !productResults[0].price) {
        console.error('Price field is missing in productResults:', productResults);
        return res.status(500).json({ success: false, message: 'Price field is missing in product results' });
      }

      const productPrice = productResults[0].price; // Assign product price from query results
      const productQty = productResults[0].qty; // Get the available quantity of the product
      const totalCost = productPrice * quantity;

      // Check if the product has enough quantity
      if (productQty < quantity) {
        console.warn('Insufficient product quantity for Product ID:', productId);
        return res.status(400).json({ success: false, message: 'Insufficient product quantity' });
      }

      // Check if user has enough points
      if (userPoints < totalCost) {
        console.warn('Insufficient points for School ID:', schoolId);
        return res.status(400).json({ success: false, message: 'Insufficient points' });
      }

      // Calculate the remaining points after deduction
      const remainingPoints = userPoints - totalCost;

      // Insert the order into the orders table
      const insertOrderQuery = 'INSERT INTO orders (schoolId, productId, RFIDTags, quantity, remarks) VALUES (?, ?, ?, ?, "success")';
      db.query(insertOrderQuery, [schoolId, productId, RFIDTags, quantity], (insertError, insertResults) => {
        if (insertError) {
          console.error('Error placing order:', insertError);
          return res.status(500).json({ success: false, message: 'Error placing order' });
        }

        // Update the user's points
        const updateUserPointsQuery = 'UPDATE points SET point = ? WHERE schoolId = ?';
        db.query(updateUserPointsQuery, [remainingPoints, schoolId], (updateError) => {
          if (updateError) {
            console.error('Error updating user points:', updateError);
            return res.status(500).json({ success: false, message: 'Error updating user points' });
          }

          // Update the product quantity in the product table
          const newProductQty = productQty - quantity; // Calculate the new product quantity
          const updateProductQtyQuery = 'UPDATE product SET qty = ? WHERE productId = ?';
          db.query(updateProductQtyQuery, [newProductQty, productId], (productQtyUpdateError) => {
            if (productQtyUpdateError) {
              console.error('Error updating product quantity:', productQtyUpdateError);
              return res.status(500).json({ success: false, message: 'Error updating product quantity' });
            }

            // Send response with success message
            res.json({ success: true, message: 'Order placed successfully' });
          });
        });
      });
    });
  });
});

// Start the server
app.listen(port, ipAddress, () => {
  console.log(`Server running at http://${ipAddress}:${port}/`);
});
