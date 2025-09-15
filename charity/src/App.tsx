import './App.css'
import Login from "./pages/Login";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

// User pages
import Home from "./pages/user/Home";
import Info from "./pages/user/Info";
import Profile from "./pages/user/Profile";
import Contact from "./pages/user/Contact";

// Admin pages
import CreateUser from "./pages/admin/CreateUser";
import CharityPromise from "./pages/admin/CharityPromise";

function App() {

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      
      {/* Shared Routes */}
      <Route path="/profile" element={
        <ProtectedRoute requiredRole={['admin', 'user']}>
          <Profile />
        </ProtectedRoute>
      } />

      {/* User Routes */}
      <Route path="/user" element={
        <ProtectedRoute requiredRole="user">
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/user/info" element={
        <ProtectedRoute requiredRole="user">
          <Info />
        </ProtectedRoute>
      } />
      <Route path="/user/contact" element={
        <ProtectedRoute requiredRole="user">
          <Contact />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/create-user" element={
        <ProtectedRoute requiredRole="admin">
          <CreateUser />
        </ProtectedRoute>
      } />
      <Route path="/admin/charity-promise" element={
        <ProtectedRoute requiredRole="admin">
          <CharityPromise />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App
