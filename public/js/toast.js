// toast.js

export function showToast(message, type = "info") {
  // إنشاء الكونتينر لو مش موجود
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // إنشاء التوست
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.textContent = message;

  // إضافة التوست إلى الكونتينر
  toastContainer.appendChild(toast);

  // تشغيل الأنيميشن
  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  // إزالة التوست بعد فترة
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
