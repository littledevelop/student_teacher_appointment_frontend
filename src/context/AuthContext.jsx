import { createContext, useState, useContext, useEffect, useCallback } from "react";
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setToken] = useState(() => {
        return localStorage.getItem('token') || null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Set token in axios headers when token changes
    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/api/login', { email, password });
            const userData = response.data.user;
            const authToken = response.data.token;

            if(!userData || !authToken){
                throw new Error('Invalid login response');
            }

            if (userData && authToken) {
                setUser(userData);
                setToken(authToken);
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('token', authToken);
                setLoading(false);
                return { success: true };
            }

        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            setError(errorMessage);
            setLoading(false);
            return { success: false, error: errorMessage };
        }
    };

    const register = async (nameOrFormData, email, password, role) => {
        setLoading(true);
        setError(null);
        try {
            // Support both: register(formData) and register(name, email, password, role)
            const isFormData = nameOrFormData && typeof nameOrFormData === 'object' && !email;
            const payload = isFormData
                ? (() => {
                    const fd = nameOrFormData;
                    const body = { name: fd.name, email: fd.email, password: fd.password, role: fd.role || 'student' };
                    if (fd.role === 'teacher') {
                        if (fd.department) body.department = fd.department;
                        if (fd.subject) body.subject = fd.subject;
                        if (fd.specialization) body.specialization = fd.specialization;
                        if (fd.officeHours) body.officeHours = fd.officeHours;
                        if (fd.bio) body.bio = fd.bio;
                    }
                    if (fd.role === 'student' && (fd.studentId || fd.year || fd.course)) {
                        if (fd.studentId) body.studentId = fd.studentId;
                        if (fd.year) body.year = fd.year;
                        if (fd.course) body.course = fd.course;
                    }
                    return body;
                })()
                : { name: nameOrFormData, email, password, role };
            const response = await api.post('/api/register', payload);
            const userData = response.data.user;
            const authToken = response.data.token;
            
            setUser(userData);
            setToken(authToken);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', authToken);
            setLoading(false);
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Registration failed';
            setError(errorMessage);
            setLoading(false);
            return { success: false, error: errorMessage };
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        setLoading(false);
        setError(null);
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
    };

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return (
        <AuthContext.Provider value={{ 
            user, 
            token,
            loading, 
            error, 
            login, 
            register,
            logout,
            clearError
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;