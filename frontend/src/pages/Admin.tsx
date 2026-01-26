import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listUsers, updateUser, getAdminStats } from '../lib/admin';
import type { User, AdminStats } from '../lib/admin';
import Layout from '../components/Layout';
import Loading from '../components/Loading';

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'users'>('stats');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [usersData, statsData] = await Promise.all([
        listUsers(),
        getAdminStats(),
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch {
      setError('Failed to load admin data. You may not have admin privileges.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleAdmin(userId: string, currentValue: boolean) {
    try {
      await updateUser(userId, { is_admin: !currentValue });
      loadData();
    } catch {
      setError('Failed to update user');
    }
  }

  async function handleToggleActive(userId: string, currentValue: boolean) {
    try {
      await updateUser(userId, { is_active: !currentValue });
      loadData();
    } catch {
      setError('Failed to update user');
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-primary mb-6">Admin Panel</h1>

        {error && (
          <div className="bg-[#fb4934]/20 border border-[#fb4934] text-[#fb4934] px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded font-medium transition-all duration-200 ${
              activeTab === 'stats'
                ? 'bg-[#689d6a] text-[#282828] hover:bg-[#8ec07c]'
                : 'bg-[#3c3836] text-[#ebdbb2] hover:bg-[#504945]'
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded font-medium transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-[#689d6a] text-[#282828] hover:bg-[#8ec07c]'
                : 'bg-[#3c3836] text-[#ebdbb2] hover:bg-[#504945]'
            }`}
          >
            Users
          </button>
        </div>

        {loading ? (
          <Loading message="Loading admin data..." />
        ) : activeTab === 'stats' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-secondary rounded-lg p-6">
                <h3 className="text-muted text-sm mb-1">Total Users</h3>
                <p className="text-3xl font-bold text-primary">{stats?.total_users || 0}</p>
              </div>
              <div className="bg-secondary rounded-lg p-6">
                <h3 className="text-muted text-sm mb-1">Total Applications</h3>
                <p className="text-3xl font-bold text-primary">{stats?.total_applications || 0}</p>
              </div>
            </div>

            <div className="bg-secondary rounded-lg p-6">
              <h3 className="text-lg font-semibold text-primary mb-4">Applications by Status</h3>
              {stats?.applications_by_status && stats.applications_by_status.length > 0 ? (
                <div className="space-y-2">
                  {stats.applications_by_status.map((item) => (
                    <div key={item.status} className="flex justify-between items-center">
                      <span className="text-primary">{item.status}</span>
                      <span className="text-[#8ec07c] font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No data available</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-secondary rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-tertiary">
                <tr>
                  <th className="px-4 py-3 text-left text-muted text-sm font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-muted text-sm font-medium">Joined</th>
                  <th className="px-4 py-3 text-center text-muted text-sm font-medium">Admin</th>
                  <th className="px-4 py-3 text-center text-muted text-sm font-medium">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tertiary">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-tertiary/50">
                    <td className="px-4 py-3 text-primary">{u.email}</td>
                    <td className="px-4 py-3 text-secondary">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                        disabled={u.id === user?.id}
                        className={`px-2 py-1 rounded text-xs ${
                          u.is_admin
                            ? 'bg-[#d3869b]/20 text-[#d3869b]'
                            : 'bg-[#3c3836] text-[#928374]'
                        } disabled:opacity-50`}
                      >
                        {u.is_admin ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                        disabled={u.id === user?.id}
                        className={`px-2 py-1 rounded text-xs ${
                          u.is_active
                            ? 'bg-[#b8bb26]/20 text-[#b8bb26]'
                            : 'bg-[#fb4934]/20 text-[#fb4934]'
                        } disabled:opacity-50`}
                      >
                        {u.is_active ? 'Yes' : 'No'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
