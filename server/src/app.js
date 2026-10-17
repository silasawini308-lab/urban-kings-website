require('dotenv').config();
const adminReportRoutes = require('./modules/reviews/admin-reports.routes')
const reviewRoutes = require('./modules/reviews/reviews.routes');
const careerRoutes = require('./modules/careers/careers.routes');
const deliveryRoutes = require('./modules/deliveries/deliveries.routes');
const paymentRoutes = require('./modules/payments/payments.routes');
const bookingRoutes = require('./modules/bookings/bookings.routes');
const workerRoutes =require('./modules/workers/workers.routes');
const orderRoutes = require('./modules/orders/orders.routes')
const express = require('express');
const cors = require('cors');

const authRoutes = require('./modules/auth/auth.routes');

const app = express();

app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // lets Express read JSON from request bodies
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
    next();
});

app.get('/', (req, res) => {
    res.send('Urban Kings API is running...');
});

const productRoutes = require('./modules/products/products.routes');
app.use('/api/products/:productId/reviews', reviewRoutes);
app.use('/api/admin/review-reports', adminReportRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/careers', careerRoutes);

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`);
}); 