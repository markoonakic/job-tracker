import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listApplications } from '../lib/applications';
import Layout from '../components/Layout';
import ActivityHeatmap from '../components/ActivityHeatmap';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const { user } = useAuth();
  const [totalApplications, setTotalApplications] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTotalApplications() {
      try {
        const data = await listApplications({ page: 1, per_page: 1 });
        setTotalApplications(data.total);
      } catch {
        console.error('Failed to load total applications');
      } finally {
        setLoading(false);
      }
    }

    loadTotalApplications();
  }, []);

  if (loading) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {totalApplications === 0 ? (
          <EmptyState
            message="Welcome! Add your first job application to get started."
            icon="bi-plus-circle"
            action={{
              label: "Add Application",
              onClick: () => window.location.href = '/applications/new'
            }}
          />
        ) : (
          <>
            <h1 className="text-2xl font-bold text-primary mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/applications"
            className="bg-secondary rounded-lg p-6 border border-tertiary hover:bg-tertiary hover:-translate-y-0.5 transition-all duration-200"
          >
            <h2 className="text-lg font-semibold text-primary mb-2">Applications</h2>
            <p className="text-muted text-sm">View and manage your job applications</p>
          </Link>

          <Link
            to="/analytics"
            className="bg-secondary rounded-lg p-6 border border-tertiary hover:bg-tertiary hover:-translate-y-0.5 transition-all duration-200"
          >
            <h2 className="text-lg font-semibold text-primary mb-2">Analytics</h2>
            <p className="text-muted text-sm">Visualize your job search progress</p>
          </Link>

          <Link
            to="/settings"
            className="bg-secondary rounded-lg p-6 border border-tertiary hover:bg-tertiary hover:-translate-y-0.5 transition-all duration-200"
          >
            <h2 className="text-lg font-semibold text-primary mb-2">Settings</h2>
            <p className="text-muted text-sm">Customize themes, statuses, and more</p>
          </Link>

          {user?.is_admin && (
            <Link
              to="/admin"
              className="bg-secondary rounded-lg p-6 border border-tertiary hover:bg-tertiary hover:-translate-y-0.5 transition-all duration-200"
            >
              <h2 className="text-lg font-semibold text-[#d3869b] mb-2">Admin Panel</h2>
              <p className="text-muted text-sm">Manage users and view system statistics</p>
            </Link>
          )}
        </div>

        <div className="bg-secondary rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">Activity Overview</h2>
            <Link to="/analytics" className="text-sm text-[#689d6a] hover:text-[#8ec07c] transition-colors duration-200">
              View Analytics &rarr;
            </Link>
          </div>
          <ActivityHeatmap />
        </div>
          </>
        )}
      </div>
    </Layout>
  );
}
