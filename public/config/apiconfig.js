// API Configuration File
export class ApiConfig {
    constructor() {
        this.BASE_URL = 'https://easytip-production.up.railway.app';
        this.API_KEY = '227aca8bf6731507d99c882bb645264ed9ffe07372b1e7c3f4';
    }

    // Auth Endpoints
    get AUTH() {
        return {
            LOGIN: `${this.BASE_URL}/api/auth/login`,
            REGISTER: `${this.BASE_URL}/api/auth/register`,
            LOGOUT: `${this.BASE_URL}/api/auth/logout`,
            REFRESH: `${this.BASE_URL}/api/auth/refresh-token`,
            VERIFY: `${this.BASE_URL}/api/auth/verify-token`,
            FORGOT_PASSWORD: `${this.BASE_URL}/api/auth/forgot-password`,
            ME: `${this.BASE_URL}/api/auth/me`
        };
    }

    // User Endpoints
    get USER() {
        return {
            GET_DATA: `${this.BASE_URL}/api/users/getuserdata`,
            GET_BY_USERNAME: `${this.BASE_URL}/api/users/getbyusername`,
            UPDATE_PROFILE: `${this.BASE_URL}/api/users/updateprofile`,
            UPLOAD_AVATAR: `${this.BASE_URL}/api/users/upload-avatar`,
            DELETE_ACCOUNT: `${this.BASE_URL}/api/users/deleteaccount`,

        };
    }

    // Amount Endpoints
    get AMOUNT() {
        return {
            GET_BY_USER: `${this.BASE_URL}/api/amounts/getAmountByUsername`,
            GET_MY_AMOUNT: `${this.BASE_URL}/api/amounts/getamount`,
            ADD_AMOUNT: `${this.BASE_URL}/api/amounts/addamount`,
            DELETE_AMOUNT: `${this.BASE_URL}/api/amounts/deleteAmount`,
            DELETE_ALL: `${this.BASE_URL}/api/amounts/deleteAllAmounts`,
        };
    }

    // PaymentMethod Endpoints
    get PAYMENT_METHOD() {
        return {
            GET_BY_USER: `${this.BASE_URL}/api/payments/getPayment`,
        };
    }
}

// Export instance
export const API = new ApiConfig();
