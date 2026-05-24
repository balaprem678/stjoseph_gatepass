export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
// export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stjoseph-gatepass.onrender.com/api';
// export const API_URL = 'http://localhost:5001/api';

export const apiCall = async (endpoint: string, method: string = 'GET', body: any = null, token: string | null = null) => {
    const headers: any = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options: any = {
        method,
        headers,
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    // Try to parse JSON safely
    let data: any = null;
    const text = await response.text();
    try {
        data = text ? JSON.parse(text) : null;
    } catch (err) {
        // non-JSON response
        data = { message: text };
    }

    if (!response.ok) {
        const msg = (data && data.message) ? data.message : `Request failed with status ${response.status}`;
        const error: any = new Error(msg);
        error.status = response.status;
        error.response = data;
        throw error;
    }

    return data;
};
