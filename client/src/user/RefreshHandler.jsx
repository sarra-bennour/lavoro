import React, { useEffect } from "react";
import { useNavigate , useLocation} from "react-router-dom";

function RefreshHandler({ setIsAuthenticated }) {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const data = localStorage.getItem('userInfo');
        const token = JSON.parse(data)?.token;
        if (token) {
            setIsAuthenticated(true);
            if (location.pathname === '/' || location.pathname === '/signin') {
                navigate('/profile', { replace: false });
            }
        }
    }, [location, navigate, setIsAuthenticated]);

    return null;
}

export default RefreshHandler;