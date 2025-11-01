import { API } from '../config/apiconfig.js';

export function showErrorPage(message) {
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #f9f9f9 0%, #e8f4f8 100%);">
        <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 90%;">
          <h1 style="color: #dc3545; margin-bottom: 20px;">خطأ</h1>
          <p style="font-size: 18px; color: #333; margin-bottom: 30px;">${message}</p>
          <a href="/" style="background: linear-gradient(135deg, #04c20e 0%, #00a2ff 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">العودة للصفحة الرئيسية</a>
        </div>
      </div>
    `;
}

export function showPageContent(profileBox, mainContent) {
    if (profileBox) profileBox.style.display = 'block';
    if (mainContent) mainContent.style.display = 'block';
}

export function hidePageContent(profileBox, mainContent) {
    if (profileBox) profileBox.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
}

export async function loadUserData(profileAvatar, profileName, profileTiktokId, profileBox, mainContent) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        let username = urlParams.get('username');

        if (!username) {
            const pathParts = window.location.pathname.split('/');
            username = pathParts.pop() || pathParts.pop();
        }

        if (username && username.startsWith('@')) {
            username = username.slice(1);
        }

        if (!username) {
            showErrorPage('اسم المستخدم مطلوب');
            return null; // إرجاع null بدل false
        }

        // جلب بيانات المستخدم من API الخاص بك
        const response = await fetch(`${API.USER.GET_BY_USERNAME}/${username}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.status && data.user) {
            profileAvatar.src = data.user.avatar_url || 'https://i.pravatar.cc/150?img=12';
            profileName.textContent = data.user.name || data.user.username || 'مستخدم';
            profileTiktokId.textContent = `@${data.user.username || username}`;

            document.title = `تبرع لـ ${data.user.name || data.user.username}`;
            showPageContent(profileBox, mainContent);
            
            // إرجاع بيانات المستخدم كاملة
            return data.user;
        } else {
            showErrorPage('لم يتم العثور على اسم المستخدم. يرجى التحقق والمحاولة مرة أخرى.');
            return null;
        }
    } catch (err) {
        console.error('خطأ في تحميل بيانات المستخدم:', err);
        
        // Fallback في حالة الخطأ
        const urlParams = new URLSearchParams(window.location.search);
        let username = urlParams.get('username') || 'مستخدم';
        
        if (username && username.startsWith('@')) {
            username = username.slice(1);
        }
        
        profileAvatar.src = 'https://i.pravatar.cc/150?img=12';
        profileName.textContent = username;
        profileTiktokId.textContent = `@${username}`;
        
        document.title = `تبرع لـ ${username}`;
        showPageContent(profileBox, mainContent);
        
        return null;
    }
}