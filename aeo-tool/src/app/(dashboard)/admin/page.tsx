"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session && session.user.role !== "admin") {
      router.push("/");
      return;
    }
    fetchUsers();
  }, [session]);

  const fetchUsers = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
        setLoading(false);
      });
  };

  const openCreateForm = () => {
    setEditingUser(null);
    setForm({ name: "", email: "", password: "", role: "user" });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (user: UserItem) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);

    if (editingUser) {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingUser.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setSaving(false); return; }
    } else {
      if (!form.password) { setError("Password is required for new users"); setSaving(false); return; }
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setSaving(false); return; }
    }

    setSaving(false);
    setShowForm(false);
    fetchUsers();
  };

  const deleteUser = async (id: string, email: string) => {
    if (!confirm(`Delete user ${email}?`)) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    fetchUsers();
  };

  if (session?.user.role !== "admin") return null;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1b4332]">User Management</h1>
          <p className="text-[#6b7280] mt-1">Manage users and their roles</p>
        </div>
        <button onClick={openCreateForm} className="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Add User
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="card p-6 mb-6 border-2 border-[#52b788]">
          <h3 className="text-lg font-semibold text-[#1b4332] mb-4">
            {editingUser ? "Edit User" : "Create New User"}
          </h3>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input-field"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input-field"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">
                Password {editingUser && <span className="text-[#6b7280]">(leave blank to keep)</span>}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="input-field"
                placeholder={editingUser ? "Leave blank to keep current" : "Password"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="input-field"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? (
                <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : editingUser ? "Update User" : "Create User"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="card p-6 animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-[#d8f3dc] rounded" />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1b4332] text-white">
                <th className="text-left px-6 py-3 text-sm font-semibold">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Email</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Role</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Created</th>
                <th className="text-right px-6 py-3 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#d8f3dc] hover:bg-[#f0faf4] transition-colors">
                  <td className="px-6 py-4 font-medium text-[#1b4332]">{u.name}</td>
                  <td className="px-6 py-4 text-[#6b7280]">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      u.role === "admin"
                        ? "bg-[#fff3e0] text-[#e65100]"
                        : "bg-[#e3f2fd] text-[#1565c0]"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6b7280]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEditForm(u)}
                        className="text-sm px-3 py-1 rounded-lg bg-[#d8f3dc] text-[#2d6a4f] hover:bg-[#b7e4c7] transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteUser(u.id, u.email)}
                        className="text-sm px-3 py-1 rounded-lg bg-[#fecaca] text-[#991b1b] hover:bg-[#fca5a5] transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
