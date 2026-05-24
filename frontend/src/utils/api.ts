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
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
};
