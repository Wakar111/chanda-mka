import { supabase } from "../supabaseClient"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import mkaLogo from "/mka-logo.png"


export default function Login() {
    const [jamaatID, setJamaatID] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        try {
            // Convert jamaatID to integer for database comparison
            const jamaatIDNumber = parseInt(jamaatID, 10);
            console.log("Trying to login with jamaatID:", jamaatIDNumber);
            
            if (isNaN(jamaatIDNumber)) {
                setError("Bitte geben Sie eine gültige Jamaat ID ein.")
                return
            }

            // First, fetch the email associated with the jamaatID
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("email, role")
                .eq("jamaatID", jamaatIDNumber)
                .maybeSingle()

            console.log("User data:", userData);
            console.log("User error:", userError);

            if (userError || !userData) {
                setError("Jamaat ID nicht gefunden. Bitte überprüfen Sie Ihre Eingabe.")
                console.error("Failed to find user:", userError);
                return
            }

            console.log("Found user, attempting login with email:", userData.email);

            // Sign in with the email and password
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: userData.email,
                password,
            })

            console.log("Auth error:", authError);

            if (authError) {
                setError("Falsches Passwort. Bitte versuchen Sie es erneut.")
                return
            }

            // Redirect to user or admin dashboard based on role
            if (userData.role === "admin") {
                navigate("/admin")
            } else {
                navigate("/user")
            }
        } catch (error) {
            setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.")
        }
    }


  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <img src={mkaLogo} alt="MKA Logo" className="h-20 w-auto mb-4" />
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">
            Login to your account
          </h2>
          <p className="text-center text-gray-600 text-sm px-4">
            Welcome to the MKA Charity Overview System. This platform helps track and manage charitable activities across Jamaat Ahmadiyya, promoting transparency and efficiency in our humanitarian efforts.
          </p>
        </div>
        <form className="space-y-5" onSubmit={handleLogin}>
          {/* Jamaat ID */}
          <div>
            <label
              htmlFor="jamaatID"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Jamaat ID
            </label>
            <input
              id="jamaatID"
              type="text"
              placeholder="Ihre Jamaat ID"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
              value={jamaatID}
              onChange={(e) => setJamaatID(e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-sm text-blue-600 hover:underline"
          >
            Passwort vergessen?
          </button>
        </div>
        {/* small text with admin account in the center */}
        <p className="text-sm text-gray-600 mt-2 text-center">
          Hinweis: Melden Sie sich mit Ihrer Jamaat ID und Ihrem Passwort an
        </p>
      </div>
    </div>
  )
}
