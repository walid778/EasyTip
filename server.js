const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const verifyToken = require('./src/middlewares/verifyToken');
const csrf = require('csurf');
const cookieParser = require('cookie-parser'); 

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { status: false, message: 'Too many attempts' }
});

dotenv.config();

const app = express();
const server = http.createServer(app);

const serverip = process.env.SERVERIP ? process.env.SERVERIP.replace(/https?:\/\//, '') : 'localhost';
const port = process.env.PORT || 3000;


if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://i.pravatar.cc', 'https://staging.fawaterk.com', 'https://your-other-image-source.com'],
      styleSrc: ["'self'", "'unsafe-inline'"], // إذا كنت بحاجة إلى إضافة أشياء أخرى مثل CSS
      scriptSrc: ["'self'", "'unsafe-inline'"], // إذا كنت بحاجة إلى إضافة السكربتات
    }
  }
}));
} else {
  app.use(helmet({
    crossOriginOpenerPolicy: false,
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
  }));
}



/*if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
} else {
  app.use(helmet({
    crossOriginOpenerPolicy: false,
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
  }));
}*/

app.use(compression());

// Middlewares
//app.use(cors());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json()); 
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

const csrfProtection = csrf({ 
    cookie: { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS في production
        sameSite: 'strict'
    } 
});

app.get('/api/csrf-token', csrfProtection, (req, res) => {
    try {
        res.json({ 
            csrfToken: req.csrfToken(),
            status: true
        });
    } catch (error) {
        console.error('Error generating CSRF token:', error);
        res.status(500).json({ 
            status: false,
            message: 'Failed to generate CSRF token'
        });
    }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/donation/:username', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'donation', 'donation.html'));
});

// Route لتحميل صفحة الداشبورد
app.get('/dashboard/:username', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard', 'dashboard.html'));
});

app.use('/api/payments/create', csrfProtection);

// Middleware للتحقق من صحة الوصول للداشبورد
app.get('/api/dashboard/access/:username', verifyToken, (req, res) => {
  const requestedUsername = req.params.username;
  const loggedUsername = req.user.tiktokuser;

  if (requestedUsername !== loggedUsername) {
    return res.status(403).json({
      status: false,
      message: 'Access denied: you cannot view another user\'s dashboard'
    });
  }

  res.json({
    status: true,
    message: 'Access granted'
  });
});

//#region 
// ⭐ Routes لصفحات الدفع
app.get('/payments/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payments', 'success.html'));
});

app.get('/payments/failed', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payments', 'failed.html'));
});

app.get('/payments/pending', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payments', 'pending.html'));
});

app.get('/payments/error', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payments', 'error.html'));
});
//#endregion

//#region Routes
const authRoute = require('./src/routes/authRoute');
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoute);

const userRoute = require('./src/routes/userRoute');
app.use('/api/users', userRoute);

const amountRoute = require('./src/routes/amountRoute');
app.use('/api/amounts', amountRoute);


const paymentRoute = require('./src/routes/paymentRoute');
app.use('/api/payments', paymentRoute);
//#endregion

server.listen(port, serverip, () => console.log(`✅ Server running at http://${serverip}:${port}`));