'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input } from '@dissafyt/ui';
import { Users, Shield, UserCheck, RefreshCw, Search } from 'lucide-react';
import { adminFetch } from '../../lib/operator';

interface UserItem {
  id: string;
  email?: string;
  full_name?: string | null;
  phone?: string | null;
  roles: string[];
  created_at: string;
}

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await adminFetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleToggleRole(userId: string, role: string, currentlyHas: boolean) {
    setStatusMsg(null);
    try {
      const res = await adminFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          role,
          action: currentlyHas ? 'revoke' : 'assign',
        }),
      });

      if (res.ok) {
        setStatusMsg(`Role '${role}' ${currentlyHas ? 'revoked' : 'assigned'} successfully.`);
        loadUsers();
      } else {
        const err = await res.json();
        setStatusMsg(`Failed: ${err.error}`);
      }
    } catch {
      setStatusMsg('Network error while updating role.');
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Users className="mr-3 h-8 w-8 text-amber-500" />
            Platform Customer Directory
          </h1>
          <p className="text-sm text-stone-400">
            View unified customer identities and grant operational permissions (Admin, Barber, Staff).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadUsers}
          className="border-stone-700 text-stone-300 hover:bg-stone-800"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh Directory
        </Button>
      </div>

      {statusMsg && (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
          {statusMsg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center space-x-3 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or user ID..."
            className="pl-9 bg-stone-900 border-stone-700"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="border-stone-800 bg-stone-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Registered Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            All profiles synchronized via Supabase Auth and PostgreSQL triggers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-stone-500">Loading directory...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-stone-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-300">
                <thead className="border-b border-stone-800 text-xs uppercase text-stone-500">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Assigned Roles</th>
                    <th className="py-3 px-4 text-right">Role Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {filteredUsers.map((user) => {
                    const isAdmin = user.roles?.includes('admin');
                    const isBarber = user.roles?.includes('barber');
                    const isStaff = user.roles?.includes('staff');

                    return (
                      <tr key={user.id} className="hover:bg-stone-800/40">
                        <td className="py-3 px-4 font-medium text-white">
                          <div>{user.full_name || 'Anonymous User'}</div>
                          <div className="text-xs text-stone-500 font-mono">{user.email}</div>
                          <div className="text-[10px] text-stone-600 font-mono">{user.id}</div>
                        </td>
                        <td className="py-3 px-4 text-stone-400">
                          {user.phone || 'No phone set'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map((r) => (
                              <span
                                key={r}
                                className={`rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wider ${
                                  r === 'admin'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : r === 'barber'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-stone-800 text-stone-400'
                                }`}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleRole(user.id, 'admin', isAdmin)}
                            className={`border-stone-700 text-xs ${
                              isAdmin ? 'bg-red-500/20 text-red-300' : 'hover:bg-stone-800 text-stone-300'
                            }`}
                          >
                            <Shield className="mr-1 h-3 w-3" />
                            {isAdmin ? 'Revoke Admin' : 'Make Admin'}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleRole(user.id, 'barber', isBarber)}
                            className={`border-stone-700 text-xs ${
                              isBarber ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-stone-800 text-stone-300'
                            }`}
                          >
                            <UserCheck className="mr-1 h-3 w-3" />
                            {isBarber ? 'Revoke Barber' : 'Make Barber'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
