import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { User, Department, UserRole } from '../../types';
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Key,
  CheckCircle2,
  Ban,
  X,
  AlertTriangle,
  RefreshCw,
  Check,
} from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New User Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'AGENT' as UserRole,
    departmentId: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<{
    fullName: string;
    phone: string;
    role: UserRole;
    departmentId: string;
  }>({
    fullName: '',
    phone: '',
    role: 'AGENT',
    departmentId: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Password Reset State
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('Password123!');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Delete User State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

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
          password: 'Password123!',
          role: 'AGENT',
          departmentId: departments[0]?.id || '',
        });
        showNotification(`User ${formData.email} provisioned successfully!`);
        await loadData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  // 1. Edit User Modal open
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.fullName || '',
      phone: user.phone || '',
      role: user.role,
      departmentId: user.departmentId || (departments[0]?.id || ''),
    });
  };

  // 1. Submit Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsUpdating(true);
    try {
      const res = await adminApi.updateUser(editingUser.id, editFormData);
      if (res.data.success) {
        showNotification(`User ${editingUser.email} updated successfully!`);
        setEditingUser(null);
        await loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user profile');
    } finally {
      setIsUpdating(false);
    }
  };

  // 2. Toggle Status (Active / Suspended)
  const handleToggleStatus = async (user: User) => {
    try {
      const res = await adminApi.toggleUserStatus(user.id);
      if (res.data.success) {
        showNotification(res.data.message || `Status updated for ${user.fullName}`);
        await loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle user status');
    }
  };

  // 3. Reset Password
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;

    setIsResettingPassword(true);
    try {
      const res = await adminApi.resetUserPassword(passwordResetUser.id, newPasswordInput);
      if (res.data.success) {
        showNotification(res.data.message);
        setPasswordResetUser(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // 4. Delete User
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    setIsDeleting(true);
    try {
      const res = await adminApi.deleteUser(deletingUser.id);
      if (res.data.success) {
        showNotification(res.data.message);
        setDeletingUser(null);
        await loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
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
    <div className="space-y-6 animate-fade-in pb-12">
      <Breadcrumbs items={[{ label: 'User & Role Management' }]} />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">User & Role Management</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Provision internal staff accounts, edit permissions, reset credentials, and manage active status.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors shadow-sm self-start sm:self-auto"
          title="Refresh User Directory"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

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
              <label className="block font-semibold text-slate-700 mb-1">Temporary Password *</label>
              <input
                type="text"
                required
                placeholder="Password123!"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 font-mono text-[11px]"
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
              className="w-full mt-2 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Create Account</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* User Directory Table with Full Actions Column (2 cols) */}
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
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Workload</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{u.fullName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${roleColors[u.role]}`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {u.department?.name || 'General Support'}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        {(u as any)._count?.assignedTickets || 0} active
                      </span>
                    </td>

                    {/* Row Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 transition-colors"
                          title="Edit User Profile"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Status Button */}
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            u.isActive
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                          title={u.isActive ? 'Suspend Account' : 'Activate Account'}
                        >
                          {u.isActive ? <Ban className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => setPasswordResetUser(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 border border-slate-200 transition-colors"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete User Button */}
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: Edit User Profile */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Edit User Profile</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email (Read-Only)</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">System Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="AGENT">Support Agent</option>
                  <option value="TELECALLER">Telecaller</option>
                  <option value="MANAGER">Team Leader / Manager</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              {['AGENT', 'MANAGER'].includes(editFormData.role) && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Department</label>
                  <select
                    value={editFormData.departmentId}
                    onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- No Department Assigned --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  {isUpdating ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reset Password */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Reset User Credentials</h3>
              </div>
              <button
                onClick={() => setPasswordResetUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Reset password for <strong>{passwordResetUser.fullName}</strong> ({passwordResetUser.email}).
            </p>

            <form onSubmit={handleConfirmResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Temporary Password</label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">Confirm User Removal</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to remove <strong>{deletingUser.fullName}</strong> ({deletingUser.email})?
                If they have existing ticket history, their account will be safely deactivated instead of breaking relational audit records.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                {isDeleting ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
