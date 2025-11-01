
const db = require('../config/db');
const dotenv = require('dotenv');

const getAmountByUsername = async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ status: false, message: 'Username is required' });
  }

  const query = `
    SELECT ua.id, ua.amount, ua.currency 
    FROM useramount ua 
    INNER JOIN users u ON ua.userID = u.id 
    WHERE u.tiktokuser = ?
  `;

  try {
    const [results] = await db.query(query, [username]);

    if (results.length === 0) {
      return res.json({ status: true, amounts: [], message: 'No amounts found for this user' });
    }

    const amounts = results.map(row => ({
      id: row.id,
      amount: row.amount,
      currency: row.currency
    }));

    return res.json({ 
      status: true, 
      username: username,
      amounts 
    });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

const getAmount = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ status: false, message: 'Unauthorized' });
  }

  const query = 'SELECT id, amount, currency FROM useramount WHERE userID = ?';

  try {
    const [results] = await db.query(query, [userId]);

    if (results.length === 0) {
      return res.json({ status: true, amounts: [] });
    }

    const amounts = results.map(row => ({
      id: row.id,
      amount: row.amount,
      currency: row.currency
    }));

    return res.json({ status: true, amounts });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

const addAmount = async (req, res) => {
  const userId = req.user?.id;
  const { amount, currency } = req.body; // تغيير من amounts إلى amount و currency مباشرة

  if (!userId) {
    return res.status(401).json({ status: false, message: 'Unauthorized' });
  }

  if (!amount || !currency) {
    return res.status(400).json({ 
      status: false, 
      message: 'Amount and currency are required' 
    });
  }

  // تحقق من صحة العملة
  const validCurrencies = ['USD', 'EGP'];
  if (!validCurrencies.includes(currency.toUpperCase())) {
    return res.status(400).json({ 
      status: false, 
      message: 'Invalid currency. Use USD or EGP' 
    });
  }

  // تحقق من أن المبلغ رقم موجب
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({ 
      status: false, 
      message: 'Amount must be a positive number' 
    });
  }

  const query = 'INSERT INTO useramount (userID, amount, currency) VALUES (?, ?, ?)';

  try {
    const [result] = await db.query(query, [userId, amountNum, currency.toUpperCase()]);

    // جلب كل المبالغ بعد الإضافة
    const [amounts] = await db.query('SELECT id, amount, currency FROM useramount WHERE userID = ?', [userId]);

    return res.status(200).json({
      status: true,
      message: 'Amount added successfully',
      amounts: amounts
    });
  } catch (err) {
    console.error('Error adding amount:', err);
    return res.status(500).json({ 
      status: false, 
      message: 'Internal server error' 
    });
  }
};

// حذف مبلغ محدد
const deleteAmount = async (req, res) => {
  const userId = req.user?.id;
  const { amountId } = req.params;

  if (!userId) {
    return res.status(401).json({ status: false, message: 'Unauthorized' });
  }

  if (!amountId) {
    return res.status(400).json({ 
      status: false, 
      message: 'Amount ID is required' 
    });
  }

  const query = 'DELETE FROM useramount WHERE id = ? AND userID = ?';

  try {
    const [result] = await db.query(query, [amountId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        status: false, 
        message: 'Amount not found or you do not have permission to delete it' 
      });
    }

    // جلب المبالغ المتبقية بعد الحذف
    const [amounts] = await db.query('SELECT id, amount, currency FROM useramount WHERE userID = ?', [userId]);

    return res.json({
      status: true,
      message: 'Amount deleted successfully',
      amounts: amounts
    });
  } catch (err) {
    console.error('Error deleting amount:', err);
    return res.status(500).json({ 
      status: false, 
      message: 'Internal server error' 
    });
  }
};

// حذف كل المبالغ
const deleteAllAmount = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ status: false, message: 'Unauthorized' });
  }

  const query = 'DELETE FROM useramount WHERE userID = ?';

  try {
    const [result] = await db.query(query, [userId]);

    return res.json({
      status: true,
      message: `All amounts deleted successfully`,
      deletedCount: result.affectedRows
    });
  } catch (err) {
    console.error('Error deleting all amounts:', err);
    return res.status(500).json({ 
      status: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
    getAmount,
    addAmount,
    deleteAmount,
    deleteAllAmount,
    getAmountByUsername
}