const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
const tiktokUrlRegex = /^(https?:\/\/)?(www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+\/?$/;


const validateLogin = (data) => {
    if (typeof data !== 'object' || data === null) {
        return { valid: false, message: "Invalid request format" };
    }

    const { email, password } = data; // ❌ إزالة username لأنك لا تستخدمه في الـ controller

    // التحقق من البريد الإلكتروني
    if (!email) {
        return { valid: false, message: "Email is required" };
    }

    // التحقق من كلمة المرور
    if (password.length < 6) {
        return { valid: false, message: "Password must be at least 6 characters" };
    }

    // التحقق من تنسيق البريد الإلكتروني
    if (!emailRegex.test(email)) {
        return { valid: false, message: "Invalid email format" };
    }

    // التحقق من كلمة المرور (6 أرقام على الأقل)
    const passwordRegex2 = /^\d{6,}$/;
    if (!passwordRegex2.test(password)) {
        return { valid: false, message: "Password must be at least 6 digits" };
    }

    // ✅ الصحيح: استخدم regex واحد متوافق
    /*if (!passwordRegex.test(password)) {
      return { valid: false, message: "Password must contain uppercase, lowercase and numbers, at least 6 characters" };
    }*/

    return { valid: true };
};

const validateRegister = (data) => {
  
    if (typeof data !== 'object' || data === null) {
        return { valid: false, message: "Invalid request format" };
    }

 
    const { name, tiktokuser, email, password, tiktoklink, phonenumber } = data;

    // التحقق من الحقول المطلوبة
    if (!name || !tiktokuser || !email || !password || !tiktoklink || !phonenumber) {
        return { valid: false, message: "All fields are required" };
    }

    // التحقق من رقم الهاتف 
    if (phonenumber.trim().length < 10) {
        return { valid: false, message: "PhoneNumber must be at least 10 characters long" };
    }
    // التحقق من الاسم
    if (typeof name !== 'string' || name.trim().length < 2) {
        return { valid: false, message: "Name must be at least 2 characters long" };
    }

    // التحقق من اسم TikTok
    if (typeof tiktokuser !== 'string' || tiktokuser.trim().length < 3) {
        return { valid: false, message: "TikTok username must be at least 3 characters long" };
    }

    // التحقق من البريد الإلكتروني
    if (!emailRegex.test(email)) {
        return { valid: false, message: "Invalid email format" };
    }

    // التحقق من رابط TikTok
    if (!tiktokUrlRegex.test(tiktoklink)) {
        return { valid: false, message: "Invalid TikTok link format" };
    }

    // التحقق من كلمة المرور
    if (password.length < 6) {
        return { valid: false, message: "Password must be at least 6 characters long" };
    }

    /*if (!strongPasswordRegex.test(password)) {
      return { valid: false, message: "Password must contain uppercase, lowercase and numbers" };
    }*/

    return { valid: true };
};

module.exports = {
    validateLogin,
    validateRegister
};