import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { User, Department, UserRole } from '../../types';
import { Users, UserPlus } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New User Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'password123',
    role: 'AGENT' as UserRole,
    departmentId: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, deptsRes] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getDepartments(),
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.departments);
        if (deptsRes.data.departments.length > 0) {
          setFormData((prev) => ({ ...prev, departmentId: deptsRes.data.departments[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;

    setIsCreating(true);
    setError(null);
    try {
      const res = await adminApi.createUser(formData);
      if (res.data.success) {
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          password: 'password123',
          role: 'AGENT',
          departmentId: departments[0]?.id || '',
        });
        await loadData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const roleColors: Record<UserRole, string> = {
    ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
    MANAGER: 'bg-purple-50 text-purple-700 border-purple-200',
    AGENT: 'bg-blue-50 text-blue-700 border-blue-200',
    TELECALLER: 'bg-amber-50 text-amber-700 border-amber-200',
    CUSTOMER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">User & Role Management</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Provision internal staff accounts, support agents, telecallers, and department leads.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create User Form (1 col) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Create System User</h3>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Agent Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="agent@supportpro.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1 555-0100"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">System Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="AGENT">Support Agent</option>
                <option value="TELECALLER">Telecaller</option>
                <option value="MANAGER">Team Leader / Manager</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>

            {['AGENT', 'MANAGER'].includes(formData.role) && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Department</label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isCreating}
              className="w-full mt-2 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-bold shadow-sm transition-all"
            >
              {isCreating ? 'Creating Account...' : '+ Create Account'}
            </button>
          </form>
        </div>

        {/* User Directory Table (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">System Users Directory</h3>
            <span className="text-xs text-slate-500 font-semibold">{users.length} accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4 text-center">Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${roleColors[u.role]}`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {u.department?.name || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        {(u as any)._count?.assignedTickets || 0} tickets
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
