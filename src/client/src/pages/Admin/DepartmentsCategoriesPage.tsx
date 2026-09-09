import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Department, Category } from '../../types';
import { FolderTree, Building, Layers } from 'lucide-react';

export const DepartmentsCategoriesPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Department state
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [isCreatingDept, setIsCreatingDept] = useState(false);

  // New Category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDeptId, setNewCatDeptId] = useState('');
  const [newCatPriority, setNewCatPriority] = useState('MEDIUM');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [deptRes, catRes] = await Promise.all([
        adminApi.getDepartments(),
        adminApi.getCategories(),
      ]);
      if (deptRes.data.success) {
        setDepartments(deptRes.data.departments);
        if (deptRes.data.departments.length > 0) {
          setNewCatDeptId(deptRes.data.departments[0].id);
        }
      }
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    setIsCreatingDept(true);
    try {
      const res = await adminApi.createDepartment({
        name: newDeptName.trim(),
        description: newDeptDesc.trim() || undefined,
      });
      if (res.data.success) {
        setNewDeptName('');
        setNewDeptDesc('');
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingDept(false);
    }
  };

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatDeptId) return;

    setIsCreatingCat(true);
    try {
      const res = await adminApi.createCategory({
        name: newCatName.trim(),
        departmentId: newCatDeptId,
        defaultPriority: newCatPriority,
      });
      if (res.data.success) {
        setNewCatName('');
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingCat(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shadow-sm">
          <FolderTree className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Departments & Category Routing</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Configure internal support teams, ticket classification trees, and subcategories.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments Panel */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-600" />
              Internal Support Departments
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{departments.length} active</span>
          </div>

          <form onSubmit={handleCreateDept} className="flex gap-2 text-xs">
            <input
              type="text"
              required
              placeholder="New Department name..."
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={isCreatingDept || !newDeptName.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-sm"
            >
              + Add
            </button>
          </form>

          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{dept.name}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{dept.description || 'General support department'}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-purple-700 font-semibold">
                    <span>Manager: {dept.manager?.fullName || 'Not assigned'}</span>
                  </div>
                </div>
                <div className="text-right text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-bold border border-slate-200 shadow-sm">
                    {dept._count?.members || 0} agents
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Panel */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Categories & Subcategories
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{categories.length} active</span>
          </div>

          <form onSubmit={handleCreateCat} className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Category name..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
              />
              <select
                value={newCatDeptId}
                onChange={(e) => setNewCatDeptId(e.target.value)}
                className="px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreatingCat || !newCatName.trim()}
                className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-bold transition-all shadow-sm"
              >
                + Create Category
              </button>
            </div>
          </form>

          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{cat.name}</span>
                    <span className="text-slate-500 text-[11px] ml-2">({cat.department?.name})</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    Default {cat.defaultPriority}
                  </span>
                </div>

                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cat.subcategories.map((sub) => (
                      <span
                        key={sub.id}
                        className="px-2 py-0.5 rounded-md bg-white text-[10px] text-slate-600 border border-slate-200 shadow-sm"
                      >
                        {sub.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
