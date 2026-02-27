import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';

interface DashboardStats {
  adminCount: number;
  regularUserCount: number;
  totalPromiseAmount: number;
  musiCount: number;
  maleCount: number;
  femaleCount: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats>({
    adminCount: 0,
    regularUserCount: 0,
    totalPromiseAmount: 0,
    musiCount: 0,
    maleCount: 0,
    femaleCount: 0,
  });
  const [memberStats, setMemberStats] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      // Check if user is admin and get name
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, name, surname')
        .eq('id', session.user.id)
        .single();

      if (userError || userData?.role !== 'admin') {
        navigate('/');
        return;
      }

      // Set admin name
      setAdminName(`${userData.name} ${userData.surname}`);

      // Fetch admin count
      const { count: adminCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      // Fetch regular user count
      const { count: regularUserCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user');

      // Fetch musi count (users with musi=true)
      const { count: musiCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user')
        .eq('musi', true);

      // Fetch male count (both user and admin)
      const { count: maleCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .in('role', ['user', 'admin'])
        .eq('gender', 'male');

      // Fetch female count (both user and admin)
      const { count: femaleCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .in('role', ['user', 'admin'])
        .eq('gender', 'female');

      // Fetch total promise amount
      const { data: promises } = await supabase
        .from('promises')
        .select('promise');

      const totalPromiseAmount = promises?.reduce((sum, p) => sum + (p.promise || 0), 0) || 0;

      // Fetch member promise statistics with payments (grouped by user)
      const { data: userPromises } = await supabase
        .from('promises')
        .select(`
          id,
          promise,
          user_id,
          users(name, surname, jamaatID),
          payments(amount)
        `);

      // Group promises by user and calculate total promise and total paid
      const userStatsMap = new Map();
      userPromises?.forEach((p: any) => {
        if (p.users) {
          const userId = p.user_id;
          if (!userStatsMap.has(userId)) {
            userStatsMap.set(userId, {
              userId,
              name: p.users.name,
              surname: p.users.surname,
              jamaatID: p.users.jamaatID,
              totalPromise: 0,
              totalPaid: 0,
            });
          }
          const userStat = userStatsMap.get(userId);
          userStat.totalPromise += p.promise || 0;
          
          // Calculate total paid from payments
          const paidAmount = p.payments?.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0) || 0;
          userStat.totalPaid += paidAmount;
        }
      });

      // Convert to array and sort by total promise (descending)
      const sortedStats = Array.from(userStatsMap.values())
        .sort((a, b) => b.totalPromise - a.totalPromise)
        .slice(0, 10); // Top 10 members

      setStats({
        adminCount: adminCount || 0,
        regularUserCount: regularUserCount || 0,
        totalPromiseAmount: totalPromiseAmount,
        musiCount: musiCount || 0,
        maleCount: maleCount || 0,
        femaleCount: femaleCount || 0,
      });

      setMemberStats(sortedStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-grow p-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Willkommen zurück, {adminName || 'Admin User'}!</p>
            <p className="text-sm text-gray-500">Hier ist eine Übersicht über Ihre Plattform</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Admin Count Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Admin Anzahl</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.adminCount}</p>
                </div>
                <div className="bg-red-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Regular Users Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Normale Mitglieder</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.regularUserCount}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Musi Count Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Musi Mitglieder</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {stats.musiCount}/{stats.regularUserCount}
                  </p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Male Count Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Männliche Mitglieder</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.maleCount}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Female Count Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Weibliche Mitglieder</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.femaleCount}</p>
                </div>
                <div className="bg-pink-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Promise Amount Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Gesamtes Versprechen</p>
                  <p className="text-3xl font-bold text-gray-800">{formatCurrency(stats.totalPromiseAmount)}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

          </div>

          {/* Member Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Mitglieder Statistik</h2>
              <p className="text-sm text-gray-500">Sortiert nach Versprechen (höchste bis niedrigste)</p>
            </div>

            <div className="space-y-4">
              {memberStats.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Keine Daten vorhanden</p>
              ) : (
                <>
                  {memberStats.map((member, index) => {
                    const completionPercentage = member.totalPromise > 0 
                      ? (member.totalPaid / member.totalPromise) * 100 
                      : 0;
                    const remaining = member.totalPromise - member.totalPaid;
                    
                    return (
                      <div key={member.userId} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-700 w-6">#{index + 1}</span>
                            <span className="font-medium text-gray-900">
                              {member.name} {member.surname}
                            </span>
                            <Link 
                              to={`/admin/charity-promise?jamaatID=${member.jamaatID}`}
                              className="text-blue-600 hover:text-blue-800 text-xs hover:underline cursor-pointer"
                            >
                              (ID: {member.jamaatID})
                            </Link>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              {formatCurrency(member.totalPaid)} / {formatCurrency(member.totalPromise)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Übrig: {formatCurrency(remaining)}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                          <div
                            className={`h-full rounded-full flex items-center justify-end px-3 transition-all duration-500 ${
                              completionPercentage >= 100 
                                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                                : completionPercentage >= 50 
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                                : 'bg-gradient-to-r from-orange-500 to-orange-600'
                            }`}
                            style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                          >
                            {completionPercentage > 5 && (
                              <span className="text-white text-xs font-medium">
                                {completionPercentage.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
