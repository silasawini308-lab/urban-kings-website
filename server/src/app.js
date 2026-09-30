require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./modules/auth/auth.routes');

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], allowedHeaders: ["Content-Type"]}));
app.use(express.json()); // lets Express read JSON from request bodies

app.get('/', (req, res) => {
    res.send('Urban Kings API is running...');
});

const productRoutes = require('./modules/products/products.routes');
app.use('/api/products', productRoutes);

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`);
}); 