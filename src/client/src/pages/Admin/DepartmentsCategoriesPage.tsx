import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Department, Category, TicketPriority } from '../../types';
import {
  FolderTree,
  Building,
  Layers,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
  Loader2,
  Tag,
  Plus,
} from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export const DepartmentsCategoriesPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Department creation state
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [isCreatingDept, setIsCreatingDept] = useState(false);
  const [deptSuccess, setDeptSuccess] = useState<string | null>(null);
  const [deptError, setDeptError] = useState<string | null>(null);

  // Category creation state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDeptId, setNewCatDeptId] = useState('');
  const [newCatPriority, setNewCatPriority] = useState<TicketPriority>('MEDIUM');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [subcatInput, setSubcatInput] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [catSuccess, setCatSuccess] = useState<string | null>(null);
  const [catError, setCatError] = useState<string | null>(null);

  // Deletion loading state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'department' | 'category'; id: string; name: string } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

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
        const depts = deptRes.data.departments;
        setDepartments(depts);
        if (depts.length > 0) {
          setNewCatDeptId((prev) => (prev && depts.some((d) => d.id === prev) ? prev : depts[0].id));
        }
      }

      if (catRes.data.success) {
        setCategories(catRes.data.categories);
      }
    } catch (err: any) {
      console.error('Failed to load departments/categories', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptError(null);
    setDeptSuccess(null);

    const trimmedName = newDeptName.trim();
    if (!trimmedName) {
      setDeptError('Please enter a department name.');
      return;
    }

    setIsCreatingDept(true);
    try {
      const res = await adminApi.createDepartment({
        name: trimmedName,
        description: newDeptDesc.trim() || undefined,
      });

      if (res.data.success) {
        setDeptSuccess(`Department "${trimmedName}" created successfully.`);
        setNewDeptName('');
        setNewDeptDesc('');
        await loadData();
        setTimeout(() => setDeptSuccess(null), 5000);
      } else {
        setDeptError('Could not create department. Please try again.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create department.';
      setDeptError(msg);
    } finally {
      setIsCreatingDept(false);
    }
  };

  const handleAddSubcatTag = () => {
    const trimmed = subcatInput.trim();
    if (!trimmed) return;
    if (!subcategories.includes(trimmed)) {
      setSubcategories([...subcategories, trimmed]);
    }
    setSubcatInput('');
  };

  const handleRemoveSubcatTag = (tagToRemove: string) => {
    setSubcategories(subcategories.filter((s) => s !== tagToRemove));
  };

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);
    setCatSuccess(null);

    const trimmedName = newCatName.trim();
    if (!trimmedName) {
      setCatError('Please enter a category name.');
      return;
    }

    const deptId = newCatDeptId || (departments.length > 0 ? departments[0].id : '');
    if (!deptId) {
      setCatError('Please select a department for this category.');
      return;
    }

    setIsCreatingCat(true);
    try {
      const res = await adminApi.createCategory({
        name: trimmedName,
        departmentId: deptId,
        defaultPriority: newCatPriority,
        subcategories: subcategories,
      });

      if (res.data.success) {
        const subCount = subcategories.length;
        setCatSuccess(
          `Category "${trimmedName}" created successfully${subCount > 0 ? ` with ${subCount} subcategories` : ''}.`
        );
        setNewCatName('');
        setSubcategories([]);
        setSubcatInput('');
        await loadData();
        setTimeout(() => setCatSuccess(null), 5000);
      } else {
        setCatError('Could not create category. Please try again.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create category.';
      setCatError(msg);
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    const { type, id, name } = itemToDelete;
    if (type === 'department') {
      setDeptError(null);
      try {
        const res = await adminApi.deleteDepartment(id);
        if (res.data.success) {
          setDeptSuccess(`Department "${name}" deleted.`);
          await loadData();
          setTimeout(() => setDeptSuccess(null), 4000);
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Failed to delete department.';
        setDeptError(msg);
      } finally {
        setIsDeletingItem(false);
        setItemToDelete(null);
      }
    } else {
      setCatError(null);
      try {
        const res = await adminApi.deleteCategory(id);
        if (res.data.success) {
          setCatSuccess(`Category "${name}" deleted.`);
          await loadData();
          setTimeout(() => setCatSuccess(null), 4000);
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Failed to delete category.';
        setCatError(msg);
      } finally {
        setIsDeletingItem(false);
        setItemToDelete(null);
      }
    }
  };

  const priorityColors: Record<TicketPriority, string> = {
    LOW: 'bg-slate-50 text-slate-700 border-slate-200',
    MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
    HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
    CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <Breadcrumbs items={[{ label: 'Departments & Categories' }]} />

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ======================================================== */}
        {/* Departments Panel */}
        {/* ======================================================== */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-600" />
              Internal Support Departments
            </h3>
            <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {departments.length} active
            </span>
          </div>

          {/* Department Feedback Alerts */}
          {deptSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{deptSuccess}</span>
            </div>
          )}

          {deptError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deptError}</span>
            </div>
          )}

          {/* Add Department Form */}
          <form onSubmit={handleCreateDept} className="space-y-2.5 p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200/90 text-xs">
            <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Add New Support Department
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                placeholder="Department name (e.g. Infrastructure)..."
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
              />
              <button
                type="submit"
                disabled={isCreatingDept || !newDeptName.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0"
              >
                {isCreatingDept ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <span>+ Add</span>
                )}
              </button>
            </div>
            <input
              type="text"
              placeholder="Description (optional, e.g. Handles server hosting and deployment)..."
              value={newDeptDesc}
              onChange={(e) => setNewDeptDesc(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
            />
          </form>

          {/* Department List */}
          <div className="space-y-2.5 max-h-[32rem] overflow-y-auto pr-1">
            {departments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No departments configured yet. Add your first department above.
              </div>
            ) : (
              departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200 hover:border-slate-300 transition-all flex items-start justify-between gap-3 text-xs group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">{dept.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-bold text-slate-600 border border-slate-200 shrink-0">
                        {dept._count?.members || 0} agents
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {dept.description || 'General support department'}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-purple-700 font-semibold">
                      <span>Manager: {dept.manager?.fullName || 'Not assigned'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setItemToDelete({ type: 'department', id: dept.id, name: dept.name })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Department"
                    aria-label={`Delete department ${dept.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* Categories Panel */}
        {/* ======================================================== */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Categories & Subcategories
            </h3>
            <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {categories.length} active
            </span>
          </div>

          {/* Category Feedback Alerts */}
          {catSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{catSuccess}</span>
            </div>
          )}

          {catError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{catError}</span>
            </div>
          )}

          {/* Add Category Form */}
          <form onSubmit={handleCreateCat} className="space-y-3 p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200/90 text-xs">
            <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Create New Category
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Infrastructure Outage..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newCatDeptId}
                  onChange={(e) => setNewCatDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Default Priority
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TicketPriority[]).map((p) => {
                  const isSelected = newCatPriority === p;
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setNewCatPriority(p)}
                      className={`py-1.5 px-2 rounded-lg text-center text-[10px] font-bold border transition-all ${
                        isSelected
                          ? `${priorityColors[p]} ring-2 ring-blue-400 font-extrabold shadow-sm`
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subcategory Tag Builder */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Subcategories (Optional tags)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Type a subcategory and press Enter (e.g. CPU Spike)..."
                  value={subcatInput}
                  onChange={(e) => setSubcatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubcatTag();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddSubcatTag}
                  disabled={!subcatInput.trim()}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700 font-bold rounded-xl transition-colors text-xs"
                >
                  + Add Tag
                </button>
              </div>

              {subcategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {subcategories.map((sub) => (
                    <span
                      key={sub}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-medium text-[11px]"
                    >
                      <Tag className="w-3 h-3 text-blue-500" />
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubcatTag(sub)}
                        className="p-0.5 hover:text-rose-600 text-slate-400 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isCreatingCat || !newCatName.trim()}
                className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                {isCreatingCat ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>+ Create Category</span>
                )}
              </button>
            </div>
          </form>

          {/* Category List */}
          <div className="space-y-2.5 max-h-[32rem] overflow-y-auto pr-1">
            {categories.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No categories configured yet. Create one using the form above.
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200 hover:border-slate-300 transition-all space-y-2 text-xs group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900">{cat.name}</span>
                      <span className="text-slate-500 text-[11px] ml-2">({cat.department?.name})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                          priorityColors[cat.defaultPriority as TicketPriority] || 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        Default {cat.defaultPriority}
                      </span>
                      <button
                        onClick={() => setItemToDelete({ type: 'category', id: cat.id, name: cat.name })}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Category"
                        aria-label={`Delete category ${cat.name}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
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
              ))
            )}
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={itemToDelete?.type === 'department' ? 'Delete this Department?' : 'Delete this Category?'}
        message={`Are you sure you want to delete ${itemToDelete?.type === 'department' ? 'department' : 'category'} "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeletingItem}
      />
    </div>
  );
};

export default DepartmentsCategoriesPage;
