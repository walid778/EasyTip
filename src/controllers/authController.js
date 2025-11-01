const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const token = require('../utils/jwt');
const tokenBlacklist = require('../config/tokenBlacklist');


// ------------------ Register ------------------
const Register = async (req, res) => {
  try {
    const { email, password, name, tiktokuser, tiktoklink, phonenumber } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({status: false, message: 'Email and password are required' });
    }

    const checkQuery = 'SELECT * FROM users WHERE email = ?';
    const insertQuery = 'INSERT INTO users (email, password, name, tiktokuser, avatar_url, tiktoklink, phonenumber) VALUES (?, ?, ?, ?, ?, ?, ?)';

    const [existing] = await db.query(checkQuery, [email]);
    if (existing.length > 0) {
      return res.status(400).json({status: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
if (req.file && !allowedMimeTypes.includes(req.file.mimetype)) {
  return res.status(400).json({status: false, message: 'Invalid file type' });
}
    let avatarUrl = null;
    if (req.file) {
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    await db.query(insertQuery, [email, hashedPassword, name, tiktokuser, avatarUrl, tiktoklink, phonenumber]);

    return res.status(201).json({ 
      status: true,
      message: 'User created successfully' 
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ------------------ Login ------------------
const Login = async (req, res) => {
  const { email, password } = req.body;
  const checkQuery = 'SELECT * FROM users WHERE email = ?';

  try {
    const [result] = await db.query(checkQuery, [email]);
    if (result.length === 0) {
      return res.status(400).json({status: false, message: 'User not found' });
    }

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({status: false, message: 'Invalid credentials' });
    }

    const accessToken = token.generateAccessToken(user);
    const refreshToken = token.generateRefreshToken(user);

    await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

    return res.status(200).json({
      status: true,
      id: user.id,
      tiktokuser: user.tiktokuser,
      message: 'User logged in successfully',
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const Logout = async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ status: false, message: 'No token provided' });

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') 
    return res.status(401).json({ status: false, message: 'Invalid token format' });

  const jwtToken = tokenParts[1];

  try {
    // التحقق من التوكن مع تجاهل الانتهاء ولكن التحقق من التوقيع
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ status: false, message: 'Invalid token payload' });
    }

    // إلغاء كلا التوكنين
    await db.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [decoded.id]);
    tokenBlacklist.add(jwtToken);
    return res.json({ 
      status: true, 
      message: 'Logged out successfully' 
    });

  } catch (err) {
    // تحسين رسائل الخطأ
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: false, message: 'Invalid token signature' });
    }
    if (err.name === 'TokenExpiredError') {
      // حتى لو انتهى، نحاول مسح الـ refresh token إذا أمكن
      try {
        const decoded = jwt.decode(jwtToken);
        if (decoded && decoded.id) {
          await db.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [decoded.id]);
        }
      } catch (dbErr) {
        // تجاهل أخطاء DB في هذه الحالة
      }
      return res.status(401).json({ status: false, message: 'Token expired' });
    }
    
    console.error("Logout error:", err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
// ------------------ Refresh Token ------------------
const RefreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE refresh_token = ?', [refreshToken]);
    if (rows.length === 0) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const user = rows[0];

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err) => {
      if (err) {
        return res.status(403).json({ message: 'Expired or invalid refresh token' });
      }

      const newAccessToken = token.generateAccessToken(user);
      const newRefreshToken = token.generateRefreshToken(user);

      db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [newRefreshToken, user.id]);

      return res.json({
        status: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const VerifyToken = async (req, res) => {
  res.json({ 
    status: true, 
    message: 'Token is valid',
    user: req.user 
  });
};

// ------------------ Get Current User ------------------
const GetCurrentUser = async (req, res) => {
  try {

    const userId = req.user.id;

    const [users] = await db.query(
      'SELECT id, email, name, tiktokuser, avatar_url, tiktoklink, created_at, phonenumber FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    res.json({
      status: true,
      message: 'User data retrieved successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tiktokuser: user.tiktokuser,
        avatar_url: user.avatar_url,
        tiktoklink: user.tiktoklink,
        created_at: user.created_at,
        phonenumber: user.phonenumber
      }
    });

  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};


module.exports = {
    Register,
    Login,
    Logout,
    RefreshToken,
    VerifyToken,
    GetCurrentUser
};
