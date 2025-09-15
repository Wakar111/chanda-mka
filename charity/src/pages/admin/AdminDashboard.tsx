import { useEffect, useState } from 'react';
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

interface AdminInfo {
  name: string;
  surname: string;
  jamaatID: string;
  jamaat: string;
  role: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminInfo();
  }, []);

  const fetchAdminInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('users')
        .select('name, surname, jamaatID, jamaat, role')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setAdminInfo(data);
    } catch (error) {
      console.error('Error fetching admin info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    }
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          {adminInfo && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-800 font-semibold">{adminInfo.name} {adminInfo.surname}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Jamaat ID</label>
                  <p className="text-gray-800 font-semibold">{adminInfo.jamaatID}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Jamaat</label>
                  <p className="text-gray-800 font-semibold">{adminInfo.jamaat}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Role</label>
                  <p className="text-gray-800 font-semibold capitalize">{adminInfo.role}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Welcome to the Admin Dashboard
            </h1>
            <button
              onClick={handleLogout}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
