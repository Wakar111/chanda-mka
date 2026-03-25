import { supabase } from "../supabaseClient"
import { Link, useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import mkaLogo from "/mka-logo.png"
import { useEffect, useState, useRef } from "react"

export default function Navbar() {
    const navigate = useNavigate()
    const location = useLocation()
    const [userRole, setUserRole] = useState<string | null>(null)
    const [userName, setUserName] = useState<string>('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        checkUserRole()
    }, [location])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const checkUserRole = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            setUserRole(null)
            setUserName('')
            return
        }

        const { data: userData } = await supabase
            .from('users')
            .select('role, name, surname')
            .eq('id', session.user.id)
            .single()

        setUserRole(userData?.role || null)
        setUserName(userData ? `${userData.name} ${userData.surname}` : '')
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
                    
                    {/* Admin Profile Dropdown */}
                    <div className="relative inline-block" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center space-x-2 hover:text-gray-300 focus:outline-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {userName && <span className="text-sm">{userName}</span>}
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Admin Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                <Link
                                    to="/profile"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    Profile
                                </Link>
                                <Link
                                    to="/change-password"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    Passwort ändern
                                </Link>
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false)
                                        handleLogout()
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )
        }

        return (
            <>
                <Link to="/user" className="hover:text-gray-300">Home</Link>
                <Link to="/user/promises" className="hover:text-gray-300">Promises</Link>
                <Link to="/user/info" className="hover:text-gray-300">Info</Link>
                <Link to="/user/contact" className="hover:text-gray-300">Contact</Link>
                <Link to="/user/chanda-rechner" className="hover:text-gray-300">Chanda Rechner</Link>
                <Link to="/user/online-spenden" className="hover:text-gray-300">Online Spenden</Link>
                
                {/* Profile Dropdown */}
                <div className="relative inline-block" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-2 hover:text-gray-300 focus:outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {userName && <span className="text-sm">{userName}</span>}
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                            <Link
                                to="/profile"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                Profile
                            </Link>
                            <Link
                                to="/change-password"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                Passwort ändern
                            </Link>
                            <button
                                onClick={() => {
                                    setIsDropdownOpen(false)
                                    handleLogout()
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </>
        )
    }

    return (
        <nav className="bg-black text-white px-4 md:px-6 py-3 shadow-md">
            <div className="flex justify-between items-center">
                {/* Logo and Title */}
                <div className="flex items-center space-x-2 md:space-x-4">
                    <img src={mkaLogo} alt="MKA Logo" className="h-8 md:h-10 w-auto" />
                    <h1 className="text-base md:text-lg font-bold">Charity App</h1>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex md:space-x-4">
                    {renderNavLinks()}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 rounded-md hover:bg-gray-800 focus:outline-none"
                    aria-label="Toggle menu"
                >
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        {isMobileMenuOpen ? (
                            <path d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden mt-4 pb-4 space-y-2">
                    {userRole === 'admin' ? (
                        <>
                            <Link to="/admin" className="block py-2 px-4 hover:bg-gray-800 rounded" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                            <Link to="/admin/create-user" className="block py-2 px-4 hover:bg-gray-800 rounded" onClick={() => setIsMobileMenuOpen(false)}>Create User</Link>
                            <Link to="/admin/charity-promise" className="block py-2 px-4 hover:bg-gray-800 rounded" onClick={() => setIsMobileMenuOpen(false)}>Set Charity Promise</Link>
                            <Link to="/admin/set-chanda-type" className="block py-2 px-4 hover:bg-gray-800 rounded" onClick={() => setIsMobileMenuOpen(false)}>Set Chanda Type</Link>
                            <div className="border-t border-gray-700 my-2"></div>
                            <Link to="/profile" className="block py-2 px-4 hover:bg-gray-800 rounded" onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
                            <Link to="/change-password" className="block py-2 px-4 hover:bg-gray-800 rounded" onClick={() => setIsMobileMenuOpen(false)}>Passwort ändern</Link>
                            <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="block w-full text-left py-2 px-4 hover:bg-gray-800 rounded">Logout</button>
                        </>
                    ) : userRole ? (
                        <>
                            <Link to="/user" className="block py-2 px-4 hover:bg-gray-800 rounded" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                            <Link to="/user/info" className="block py-2 px-4 hover:bg-gray-800 rounded" onClick={() => setIsMobileMenuOpen(false)}>Info</Link>
                            <Link to="/user/contact" className="block py-2 px-4 hover:bg-gray-800 rounded" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
                            <div className="border-t border-gray-700 my-2"></div>
                            <Link to="/profile" className="block py-2 px-4 hover:bg-gray-800 rounded" onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
                            <Link to="/change-password" className="block py-2 px-4 hover:bg-gray-800 rounded" onClick={() => setIsMobileMenuOpen(false)}>Passwort ändern</Link>
                            <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="block w-full text-left py-2 px-4 hover:bg-gray-800 rounded">Logout</button>
                        </>
                    ) : (
                        <Link to="/login" className="block py-2 px-4 hover:bg-gray-800 rounded" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                    )}
                </div>
            )}
        </nav>
      )
}
