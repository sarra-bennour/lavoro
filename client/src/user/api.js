import axios from 'axios';

const api = axios.create({
    baseURL:"https://lavoro-back.onrender.com/users",
});

export const googleAuth =(code)=>api.get(`/google?code=${code}`);
