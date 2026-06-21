import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Organizations from './pages/Organizations';
import OrganizationDetails from './pages/OrganizationDetails';
import RepositoryDetails from './pages/RepositoryDetails';
import RepositoryCompare from './pages/RepositoryCompare';
import QueueMetrics from './pages/QueueMetrics';

const ProtectedRoute = ({ children }) => {
    const { token, loading } = useAuth();
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-dark-bg text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
            </div>
        );
    }
    return token ? children : <Navigate to="/login" replace />;
};

const AppLayout = () => {
    const { token } = useAuth();
    return (
        <div className="min-h-screen bg-dark-bg text-gray-200">
            {token && <Navbar />}
            <main className="container mx-auto px-4 pb-12">
                <Routes>
                    <Route path="/" element={<ProtectedRoute><Organizations /></ProtectedRoute>} />
                    <Route path="/organizations" element={<ProtectedRoute><Organizations /></ProtectedRoute>} />
                    <Route path="/orgs/:orgId" element={<ProtectedRoute><OrganizationDetails /></ProtectedRoute>} />
                    <Route path="/repos/:repoId" element={<ProtectedRoute><RepositoryDetails /></ProtectedRoute>} />
                    <Route path="/compare" element={<ProtectedRoute><RepositoryCompare /></ProtectedRoute>} />
                    <Route path="/queues" element={<ProtectedRoute><QueueMetrics /></ProtectedRoute>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppLayout />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
