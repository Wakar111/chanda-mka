import { supabase } from "../supabaseClient"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import mkaLogo from "/mka-logo.png"


export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        // sign in with supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            setError(authError.message)
            return
        }

        // Fetch user profile to check role
        const { data: profileData, error: profileError } = await supabase.from("users").select("role").eq("id", authData.user?.id).single()

        if (profileError || !profileData) {
            setError(profileError?.message || "Profile not found")
            return
        }

        // Redirect to user or admin dashboard based on role
        if (profileData.role === "admin") {
            navigate("/admin")
        } else {
            navigate("/user")
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
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
