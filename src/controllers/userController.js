const db = require('../config/db');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({
                status: false,
                message: 'No image selected'
            });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        await db.query(
            'UPDATE users SET avatar_url = ? WHERE id = ?',
            [avatarUrl, userId]
        );

        const fullAvatarUrl = process.env.SERVERIP + ":" + process.env.PORT + avatarUrl;

        res.json({
            status: true,
            message: 'Profile picture updated successfully',
            avatar: req.file.filename,
            avatar_url: fullAvatarUrl
        });

    } catch (error) {
        console.error('Error in uploadAvatar:', error);
        res.status(500).json({
            status: false,
            message: 'Error while uploading image'
        });
    }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, tiktokuser, tiktoklink, currentPassword, newPassword, phonenumber } = req.body;

    // إذا تم إرسال كلمات المرور
    if (currentPassword && newPassword) {
      const [userRows] = await db.query(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );

      if (userRows.length === 0) {
        return res.status(404).json({
          status: false,
          message: 'User not found'
        });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, userRows[0].password);
      if (!isValidPassword) {
        return res.status(400).json({
          status: false,
          message: 'Current password is incorrect'
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );
    }

    // تحديث البيانات الأساسية
    await db.query(
      'UPDATE users SET name = ?, email = ?, tiktokuser = ?, tiktoklink = ?, phonenumber = ? WHERE id = ?',
      [name, email, tiktokuser, tiktoklink, phonenumber, userId]
    );

    res.json({
      status: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({
      status: false,
      message: 'Error while updating profile'
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      status: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteAccount:', error);
    res.status(500).json({
      status: false,
      message: 'Error while deleting account'
    });
  }
};

const GetUserByName = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        status: false,
        message: 'اسم المستخدم مطلوب'
      });
    }

    // البحث عن المستخدم بالاسم
    const [users] = await db.query(
      'SELECT id, email, name, tiktokuser, avatar_url, tiktoklink, phonenumber FROM users WHERE tiktokuser = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'لم يتم العثور على المستخدم'
      });
    }

    const user = users[0];

    res.json({
      status: true,
      message: 'تم جلب بيانات المستخدم بنجاح',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tiktokuser: user.tiktokuser,
        avatar_url: user.avatar_url,
        tiktoklink: user.tiktoklink,
        phonenumber: user.phonenumber
      }
    });

  } catch (err) {
    console.error('خطأ في جلب بيانات المستخدم:', err);
    res.status(500).json({
      status: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
};

module.exports = {
    uploadAvatar,
    updateProfile,
    deleteAccount,
    GetUserByName
}