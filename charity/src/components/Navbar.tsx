import { supabase } from "../supabaseClient"
import { Link, useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import mkaLogo from "/mka-logo.png"
import { useEffect, useState } from "react"

export default function Navbar() {
    const navigate = useNavigate()
    const location = useLocation()
    const [userRole, setUserRole] = useState<string | null>(null)

    useEffect(() => {
        checkUserRole()
    }, [location])

    const checkUserRole = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            setUserRole(null)
            return
        }

        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()

        setUserRole(userData?.role || null)
    }

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error("Error logging out:", error)
        }
        navigate("/login")
    }

    const renderNavLinks = () => {
        if (!userRole) {
            return (
                <Link to="/login" className="hover:text-gray-300">Login</Link>
            )
        }

        if (userRole === 'admin') {
            return (
                <>
                    <Link to="/admin" className="hover:text-gray-300">Dashboard</Link>
                    <Link to="/admin/create-user" className="hover:text-gray-300">Create User</Link>
                    <Link to="/admin/charity-promise" className="hover:text-gray-300">Set Charity Promise</Link>
                    <Link to="/admin/set-chanda-type" className="hover:text-gray-300">Set Chanda Type</Link>
                    <Link to="/profile" className="hover:text-gray-300">Profile</Link>
                    <button onClick={handleLogout} className="hover:text-gray-300">Logout</button>
                </>
            )
        }

        return (
            <>
                <Link to="/user" className="hover:text-gray-300">Home</Link>
                <Link to="/user/info" className="hover:text-gray-300">Info</Link>
                <Link to="/profile" className="hover:text-gray-300">Profile</Link>
                <Link to="/user/contact" className="hover:text-gray-300">Contact</Link>
                <button onClick={handleLogout} className="hover:text-gray-300">Logout</button>
            </>
        )
    }

    return (
        <nav className="bg-black text-white px-6 py-3 flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-4">
                <img src={mkaLogo} alt="MKA Logo" className="h-10 w-auto" />
                <h1 className="text-lg font-bold">Charity App</h1>
            </div>
            <div className="space-x-4">
                {renderNavLinks()}
            </div>
        </nav>
      )
}
