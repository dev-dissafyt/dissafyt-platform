'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
} from '@dissafyt/ui';
import {
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Key,
  History,
  RefreshCw,
  FileText,
  Clock,
  CreditCard,
  Building2,
  UserPlus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Search,
  Users,
  Check,
  X,
  Sliders,
  DollarSign,
  AlertCircle,
  Landmark,
} from 'lucide-react';
import {
  adminFetch,
  getActiveOperator,
  AdminOperator,
  DEFAULT_OPERATOR,
} from '../../lib/operator';
import type {
  BarbershopLocation,
  UserWithProfile,
  AppRole,
} from '@dissafyt/database';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'rbac' | 'gateways' | 'audit'>('rbac');
  const [operator, setOperator] = useState<AdminOperator>(DEFAULT_OPERATOR);
  const [mounted, setMounted] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tab 1: RBAC & Promotion State
  const [bootstrapEmail, setBootstrapEmail] = useState('');
  const [submittingBootstrap, setSubmittingBootstrap] = useState(false);
  const [locations, setLocations] = useState<BarbershopLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Quick Role Assignment Modal/Inline Form State
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignLocationId, setAssignLocationId] = useState('');
  const [assignRole, setAssignRole] = useState<AppRole>('barber');
  const [assigningRole, setAssigningRole] = useState(false);

  // Tab 2: Configured Gateways & APIs State
  const [gatewayLocationId, setGatewayLocationId] = useState<string>('');
  const [showKey, setShowKey] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [savingGateway, setSavingGateway] = useState(false);
  const [gatewayForm, setGatewayForm] = useState({
    use_custom_payfast: false,
    payfast_merchant_id: '',
    payfast_merchant_key: '',
    payfast_passphrase: '',
    pos_terminal_id: '',
    admin_fee_pct: 5.0,
    payout_bank_name: '',
    payout_account_number: '',
    payout_branch_code: '',
  });

  // Tab 3: Database Audit Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  const isPlatformAdmin = mounted && operator.role === 'admin';
  const isBranchManager = mounted && operator.role === 'barbershop_manager';

  async function loadLocations() {
    setLoadingLocations(true);
    try {
      const res = await adminFetch('/api/locations');
      if (res.ok) {
        const data: BarbershopLocation[] = await res.json();
        setLocations(data);
        return data;
      }
    } catch (e) {
      console.error('Failed to load locations:', e);
    } finally {
      setLoadingLocations(false);
    }
    return [];
  }

  async function loadUsers(locId?: string) {
    setLoadingUsers(true);
    try {
      const targetLoc = locId !== undefined ? locId : selectedLocationId;
      const url = targetLoc && targetLoc !== 'all' ? `/api/users?locationId=${targetLoc}` : '/api/users';
      const res = await adminFetch(url);
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadLogs() {
    setLoadingLogs(true);
    try {
      const res = await adminFetch('/api/audit');
      if (res.ok) setLogs(await res.json());
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    const currentOp = getActiveOperator();
    setOperator(currentOp);
    setMounted(true);

    if (currentOp.role === 'barbershop_manager' && currentOp.locationId) {
      setSelectedLocationId(currentOp.locationId);
      setGatewayLocationId(currentOp.locationId);
      setAssignLocationId(currentOp.locationId);
    }

    loadLocations().then((locs) => {
      if (locs.length > 0 && currentOp.role !== 'barbershop_manager') {
        setGatewayLocationId(locs[0].id);
        setAssignLocationId(locs[0].id);
      }
    });

    loadUsers(currentOp.role === 'barbershop_manager' && currentOp.locationId ? currentOp.locationId : undefined);
    loadLogs();
  }, []);

  // Sync gateway form when gatewayLocationId changes
  useEffect(() => {
    if (!gatewayLocationId) return;
    const loc = locations.find((l) => l.id === gatewayLocationId);
    if (loc) {
      setGatewayForm({
        use_custom_payfast: Boolean(loc.use_custom_payfast),
        payfast_merchant_id: loc.payfast_merchant_id || '',
        payfast_merchant_key: loc.payfast_merchant_key || '',
        payfast_passphrase: loc.payfast_passphrase || '',
        pos_terminal_id: loc.pos_terminal_id || '',
        admin_fee_pct: loc.admin_fee_pct !== undefined && loc.admin_fee_pct !== null ? Number(loc.admin_fee_pct) : 5.0,
        payout_bank_name: loc.payout_bank_name || '',
        payout_account_number: loc.payout_account_number || '',
        payout_branch_code: loc.payout_branch_code || '',
      });
    }
  }, [gatewayLocationId, locations]);

  // When location filter in RBAC tab changes
  function handleLocationFilterChange(locId: string) {
    setSelectedLocationId(locId);
    loadUsers(locId);
  }

  async function handleBootstrapAdmin(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingBootstrap(true);
    setStatusMsg(null);

    try {
      const res = await adminFetch('/api/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: bootstrapEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: data.message || 'Account successfully promoted to Admin!' });
        setBootstrapEmail('');
        await loadUsers();
        loadLogs();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to promote account.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error during admin promotion.' });
    } finally {
      setSubmittingBootstrap(false);
    }
  }

  async function handleToggleRole(
    userId: string,
    role: AppRole,
    currentlyHas: boolean,
    targetLocationId?: string | null
  ) {
    const locKey = targetLocationId || 'global';
    setUpdatingRole(`${userId}-${role}-${locKey}`);
    setStatusMsg(null);

    try {
      const res = await adminFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          role,
          action: currentlyHas ? 'revoke' : 'assign',
          locationId: targetLocationId || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({
          type: 'success',
          text: `Role '${role}' ${currentlyHas ? 'revoked' : 'assigned'} successfully.`,
        });
        await loadUsers();
        loadLogs();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to update user role.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error while updating role.' });
    } finally {
      setUpdatingRole(null);
    }
  }

  async function handleAssignBranchRole(e: React.FormEvent) {
    e.preventDefault();
    if (!assignUserId || !assignRole) return;
    setAssigningRole(true);
    setStatusMsg(null);

    const targetLoc = assignRole === 'admin' ? null : (assignLocationId || null);

    try {
      const res = await adminFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: assignUserId,
          role: assignRole,
          action: 'assign',
          locationId: targetLoc,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Assigned role '${assignRole}' to user successfully.` });
        setShowAssignForm(false);
        setAssignUserId('');
        await loadUsers();
        loadLogs();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to assign role.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error while assigning role.' });
    } finally {
      setAssigningRole(false);
    }
  }

  async function handleSaveGateway(e: React.FormEvent) {
    e.preventDefault();
    if (!gatewayLocationId) return;
    setSavingGateway(true);
    setStatusMsg(null);

    try {
      const res = await adminFetch(`/api/locations/${gatewayLocationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          use_custom_payfast: gatewayForm.use_custom_payfast,
          payfast_merchant_id: gatewayForm.payfast_merchant_id.trim() || null,
          payfast_merchant_key: gatewayForm.payfast_merchant_key.trim() || null,
          payfast_passphrase: gatewayForm.payfast_passphrase.trim() || null,
          pos_terminal_id: gatewayForm.pos_terminal_id.trim() || null,
          admin_fee_pct: Number(gatewayForm.admin_fee_pct) || 5.0,
          payout_bank_name: gatewayForm.payout_bank_name.trim() || null,
          payout_account_number: gatewayForm.payout_account_number.trim() || null,
          payout_branch_code: gatewayForm.payout_branch_code.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({
          type: 'success',
          text: `Branch gateway & banking credentials for "${data.name}" saved successfully.`,
        });
        await loadLocations();
        loadLogs();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to update gateway settings.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error saving gateway configuration.' });
    } finally {
      setSavingGateway(false);
    }
  }

  // Filtered Users for Tab 1
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q))
    );
  });

  // Filtered Logs for Tab 3
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !auditSearch ||
      (log.actor_email && log.actor_email.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.entity_name && log.entity_name.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.entity_type && log.entity_type.toLowerCase().includes(auditSearch.toLowerCase()));

    const matchesFilter =
      auditActionFilter === 'all' ||
      (auditActionFilter === 'roles' && (log.action.includes('role') || log.action.includes('admin'))) ||
      (auditActionFilter === 'locations' && log.action.includes('location')) ||
      (auditActionFilter === 'services' && log.action.includes('service')) ||
      (auditActionFilter === 'products' && log.action.includes('product')) ||
      (auditActionFilter === 'staff' && log.action.includes('staff'));

    return matchesSearch && matchesFilter;
  });

  const selectedLocObj = locations.find((l) => l.id === gatewayLocationId);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Settings className="mr-3 h-8 w-8 text-amber-500" />
          Platform Settings & Governance
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          Operational infrastructure, branch-scoped RBAC, custom payment gateways, and database audit compliance.
        </p>
      </div>

      {/* Global Status Message Banner */}
      {statusMsg && (
        <div
          className={`rounded-md border p-4 text-sm flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/20 bg-red-500/10 text-red-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-stone-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tab Navigation Menu Header */}
      <div className="flex border-b border-stone-800 space-x-1 sm:space-x-3 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'rbac'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-md'
              : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-700'
          }`}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Platform & Branch RBAC</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gateways')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'gateways'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-md'
              : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-700'
          }`}
        >
          <CreditCard className="h-4 w-4 shrink-0" />
          <span>Configured Gateways & APIs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-md'
              : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-700'
          }`}
        >
          <History className="h-4 w-4 shrink-0" />
          <span>Database Audit Trail & Compliance</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-stone-800 text-amber-400 border border-stone-700">
            {logs.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: Platform & Branch RBAC                            */}
      {/* ======================================================== */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          {/* Card: Initialize / Promote Platform Administrator */}
          <Card className="border-amber-500/40 bg-stone-900/80 shadow-lg shadow-amber-500/5">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Key className="mr-2 h-5 w-5 text-amber-500" />
                Initialize / Promote Platform Administrator
              </CardTitle>
              <CardDescription>
                Grant the global <code className="text-amber-400">admin</code> role to an existing registered user account across all platform locations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPlatformAdmin ? (
                <form onSubmit={handleBootstrapAdmin} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-stone-300">Registered Email Address</Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        type="email"
                        value={bootstrapEmail}
                        onChange={(e) => setBootstrapEmail(e.target.value)}
                        placeholder="e.g. operator@dissafyt.com"
                        className="bg-stone-950 border-stone-700"
                        required
                      />
                      <Button
                        type="submit"
                        disabled={submittingBootstrap}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-semibold shrink-0"
                      >
                        {submittingBootstrap ? 'Promoting...' : 'Promote to Admin'}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-stone-500">
                    Note: The user must already exist in the database (e.g. registered customer account). Global admins receive full access to all branch financial records and platform catalogs.
                  </p>
                </form>
              ) : (
                <div className="rounded border border-stone-800 bg-stone-950/60 p-4 text-xs text-stone-400 flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>
                    Global Administrator initialization is restricted to Platform Admins. Branch managers may only assign branch-specific roles below.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Branch Role-Based Access Control (RBAC) */}
          <Card className="border-stone-800 bg-stone-900/50">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-white flex items-center">
                  <ShieldCheck className="mr-2 h-5 w-5 text-amber-500" />
                  Branch Role-Based Access Control (RBAC)
                </CardTitle>
                <CardDescription>
                  Govern permissions and assign roles per studio branch (Barbershop Manager, Barber, Staff).
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowAssignForm(!showAssignForm)}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {showAssignForm ? 'Close Assignment Form' : 'Assign User to Branch'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadUsers()}
                  disabled={loadingUsers}
                  className="border-stone-700 text-stone-300 hover:bg-stone-800"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Assign User to Branch Form (Expandable) */}
              {showAssignForm && (
                <div className="p-4 rounded-lg border border-amber-500/30 bg-stone-950/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center">
                      <UserPlus className="mr-2 h-4 w-4 text-amber-400" />
                      Grant Role to User for Branch
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAssignForm(false)}
                      className="text-stone-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleAssignBranchRole} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-stone-300">Select User</Label>
                      <select
                        value={assignUserId}
                        onChange={(e) => setAssignUserId(e.target.value)}
                        className="w-full h-10 px-3 rounded-md bg-stone-900 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500"
                        required
                      >
                        <option value="">-- Choose User --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name || u.email} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-stone-300">Branch Location</Label>
                      <select
                        value={assignLocationId}
                        onChange={(e) => setAssignLocationId(e.target.value)}
                        disabled={isBranchManager}
                        className="w-full h-10 px-3 rounded-md bg-stone-900 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500 disabled:opacity-60"
                        required={assignRole !== 'admin'}
                      >
                        {isPlatformAdmin && <option value="">-- Global / No Location --</option>}
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-stone-300">Role to Assign</Label>
                      <select
                        value={assignRole}
                        onChange={(e) => setAssignRole(e.target.value as AppRole)}
                        className="w-full h-10 px-3 rounded-md bg-stone-900 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500"
                      >
                        <option value="barber">Barber (Branch Operational)</option>
                        <option value="barbershop_manager">Barbershop Manager (Branch Lead)</option>
                        <option value="staff">Staff (Frontdesk / Reception)</option>
                        {isPlatformAdmin && <option value="admin">Platform Admin (Global)</option>}
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex justify-end">
                      <Button
                        type="submit"
                        disabled={assigningRole || !assignUserId}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
                      >
                        {assigningRole ? 'Assigning Role...' : 'Save Role Assignment'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Filters Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Building2 className="h-4 w-4 text-stone-400 shrink-0" />
                  <span className="text-xs text-stone-400 font-medium shrink-0">Filter Branch:</span>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => handleLocationFilterChange(e.target.value)}
                    disabled={isBranchManager}
                    className="h-9 px-3 rounded-md bg-stone-950 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500 disabled:opacity-70"
                  >
                    {isPlatformAdmin && <option value="all">All Branches (Global Directory)</option>}
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} {loc.is_flagship ? '(Flagship)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                  <Input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, email, or ID..."
                    className="pl-9 h-9 text-xs bg-stone-950 border-stone-700"
                  />
                </div>
              </div>

              {/* Users & Roles Table */}
              {loadingUsers ? (
                <div className="py-12 text-center text-stone-500 text-sm">Loading users and permissions...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-stone-500 text-sm">
                  <Users className="mx-auto h-8 w-8 text-stone-600 mb-2" />
                  No users matched the search query or branch filter.
                </div>
              ) : (
                <div className="overflow-x-auto border border-stone-800 rounded-md">
                  <table className="w-full text-left text-xs text-stone-300">
                    <thead className="border-b border-stone-800 bg-stone-950/80 text-[10px] uppercase text-stone-500">
                      <tr>
                        <th className="py-3 px-4">User Identity</th>
                        <th className="py-3 px-4">Assigned Branch(es)</th>
                        <th className="py-3 px-4">Active Roles</th>
                        <th className="py-3 px-4 text-right">Branch Role Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/80 font-mono">
                      {filteredUsers.map((u) => {
                        const targetLoc = selectedLocationId !== 'all' ? selectedLocationId : undefined;
                        const hasAdmin = u.roles?.includes('admin');

                        const hasManager = targetLoc
                          ? u.branch_roles?.some(
                              (br) => br.role === 'barbershop_manager' && br.location_id === targetLoc
                            )
                          : u.branch_roles?.some((br) => br.role === 'barbershop_manager');

                        const hasBarber = targetLoc
                          ? u.branch_roles?.some(
                              (br) => br.role === 'barber' && br.location_id === targetLoc
                            )
                          : u.branch_roles?.some((br) => br.role === 'barber');

                        const hasStaff = targetLoc
                          ? u.branch_roles?.some(
                              (br) => br.role === 'staff' && br.location_id === targetLoc
                            )
                          : u.branch_roles?.some((br) => br.role === 'staff');

                        return (
                          <tr key={u.id} className="hover:bg-stone-800/20 font-sans">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">
                                {u.full_name || 'Anonymous Customer'}
                              </div>
                              <div className="text-[11px] text-stone-400 font-mono">{u.email}</div>
                              {u.phone && <div className="text-[10px] text-stone-500">{u.phone}</div>}
                            </td>

                            <td className="py-3 px-4">
                              {u.branch_roles && u.branch_roles.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {Array.from(
                                    new Set(
                                      u.branch_roles
                                        .map((br) => br.location_name)
                                        .filter(Boolean)
                                    )
                                  ).map((locName) => (
                                    <span
                                      key={locName as string}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-stone-800 text-stone-300 border border-stone-700"
                                    >
                                      <Building2 className="mr-1 h-3 w-3 text-amber-500" />
                                      {locName}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-stone-500 italic">No specific branch</span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {u.roles?.map((r) => {
                                  if (r === 'admin') {
                                    return (
                                      <span
                                        key={r}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono"
                                      >
                                        admin (global)
                                      </span>
                                    );
                                  }
                                  return null;
                                })}

                                {u.branch_roles?.map((br, idx) => (
                                  <span
                                    key={`${br.role}-${br.location_id}-${idx}`}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border font-mono ${
                                      br.role === 'barbershop_manager'
                                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                        : br.role === 'barber'
                                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                        : br.role === 'staff'
                                        ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                                        : 'bg-stone-800 text-stone-300 border-stone-700'
                                    }`}
                                  >
                                    {br.role} {br.location_name ? `@ ${br.location_name.replace('Dissafyt Studio - ', '').replace('Ace of Fyt - ', '')}` : ''}
                                  </span>
                                ))}

                                {(!u.branch_roles || u.branch_roles.length === 0) &&
                                  (!u.roles || !u.roles.includes('admin')) && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-800/80 text-stone-400 border border-stone-700 font-mono">
                                      customer
                                    </span>
                                  )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center space-x-1.5 flex-wrap justify-end gap-y-1">
                                {/* Toggle Manager Role */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={Boolean(updatingRole)}
                                  onClick={() =>
                                    handleToggleRole(
                                      u.id,
                                      'barbershop_manager',
                                      Boolean(hasManager),
                                      targetLoc || u.assigned_location_id || locations[0]?.id
                                    )
                                  }
                                  className={`text-[10px] h-7 px-2 border ${
                                    hasManager
                                      ? 'border-purple-500/40 text-purple-300 hover:bg-purple-950/40'
                                      : 'border-stone-700 text-stone-400 hover:text-white hover:bg-stone-800'
                                  }`}
                                >
                                  {hasManager ? 'Revoke Manager' : '+ Manager'}
                                </Button>

                                {/* Toggle Barber Role */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={Boolean(updatingRole)}
                                  onClick={() =>
                                    handleToggleRole(
                                      u.id,
                                      'barber',
                                      Boolean(hasBarber),
                                      targetLoc || u.assigned_location_id || locations[0]?.id
                                    )
                                  }
                                  className={`text-[10px] h-7 px-2 border ${
                                    hasBarber
                                      ? 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40'
                                      : 'border-stone-700 text-stone-400 hover:text-white hover:bg-stone-800'
                                  }`}
                                >
                                  {hasBarber ? 'Revoke Barber' : '+ Barber'}
                                </Button>

                                {/* Toggle Staff Role */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={Boolean(updatingRole)}
                                  onClick={() =>
                                    handleToggleRole(
                                      u.id,
                                      'staff',
                                      Boolean(hasStaff),
                                      targetLoc || u.assigned_location_id || locations[0]?.id
                                    )
                                  }
                                  className={`text-[10px] h-7 px-2 border ${
                                    hasStaff
                                      ? 'border-sky-500/40 text-sky-300 hover:bg-sky-950/40'
                                      : 'border-stone-700 text-stone-400 hover:text-white hover:bg-stone-800'
                                  }`}
                                >
                                  {hasStaff ? 'Revoke Staff' : '+ Staff'}
                                </Button>

                                {/* Toggle Admin Role (Only for Global Platform Admins) */}
                                {isPlatformAdmin && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={Boolean(updatingRole)}
                                    onClick={() => handleToggleRole(u.id, 'admin', Boolean(hasAdmin), null)}
                                    className={`text-[10px] h-7 px-2 border ${
                                      hasAdmin
                                        ? 'border-amber-500/40 text-amber-300 hover:bg-amber-950/40'
                                        : 'border-stone-700 text-stone-400 hover:text-white hover:bg-stone-800'
                                    }`}
                                  >
                                    {hasAdmin ? 'Revoke Admin' : '+ Admin'}
                                  </Button>
                                )}
                              </div>
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
      )}

      {/* ======================================================== */}
      {/* TAB 2: Configured Gateways & APIs                         */}
      {/* ======================================================== */}
      {activeTab === 'gateways' && (
        <div className="space-y-6">
          {/* Card: Branch Payment Processing & Gateways */}
          <Card className="border-amber-500/40 bg-stone-900/80 shadow-lg shadow-amber-500/5">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-white flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-amber-500" />
                  Branch Payment Processing & Gateways
                </CardTitle>
                <CardDescription>
                  Configure branch-specific PayFast credentials and banking payout details. When enabled, payments for appointments at this branch route directly into this branch&apos;s account.
                </CardDescription>
              </div>

              {/* Branch Selector */}
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-stone-400 shrink-0" />
                <Label className="text-xs text-stone-300 shrink-0">Studio Branch:</Label>
                <select
                  value={gatewayLocationId}
                  onChange={(e) => setGatewayLocationId(e.target.value)}
                  disabled={isBranchManager}
                  className="h-9 px-3 rounded-md bg-stone-950 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500 disabled:opacity-70 font-semibold"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.is_flagship ? '(Flagship)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSaveGateway} className="space-y-6">
                {/* Custom PayFast Toggle */}
                <div className="flex items-start justify-between p-4 rounded-lg border border-stone-800 bg-stone-950/60">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-white flex items-center">
                      <CreditCard className="mr-2 h-4 w-4 text-amber-500" />
                      Use Custom PayFast Account for this Branch
                    </Label>
                    <p className="text-xs text-stone-400">
                      When active, customer booking payments at this branch route directly to this branch&apos;s PayFast merchant credentials. When disabled, the central platform fallback merchant account is utilized.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={gatewayForm.use_custom_payfast}
                    onChange={(e) =>
                      setGatewayForm({ ...gatewayForm, use_custom_payfast: e.target.checked })
                    }
                    className="h-5 w-5 rounded border-stone-700 text-amber-500 focus:ring-amber-500 bg-stone-900 mt-1 cursor-pointer"
                  />
                </div>

                {/* Gateway Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-stone-300">PayFast Merchant ID</Label>
                    <Input
                      type="text"
                      value={gatewayForm.payfast_merchant_id}
                      onChange={(e) =>
                        setGatewayForm({ ...gatewayForm, payfast_merchant_id: e.target.value })
                      }
                      placeholder="e.g. 17675995 or 10000100"
                      className="bg-stone-950 border-stone-700 font-mono text-sm"
                    />
                    <p className="text-[11px] text-stone-500">Provided by PayFast dashboard</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-stone-300">POS Terminal ID (Optional)</Label>
                    <Input
                      type="text"
                      value={gatewayForm.pos_terminal_id}
                      onChange={(e) =>
                        setGatewayForm({ ...gatewayForm, pos_terminal_id: e.target.value })
                      }
                      placeholder="e.g. POS-CPT-01"
                      className="bg-stone-950 border-stone-700 font-mono text-sm"
                    />
                    <p className="text-[11px] text-stone-500">In-chair physical speedpoint identifier</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-stone-300">PayFast Merchant Key</Label>
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="text-[11px] text-stone-400 hover:text-white flex items-center space-x-1"
                      >
                        {showKey ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                        <span>{showKey ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={gatewayForm.payfast_merchant_key}
                      onChange={(e) =>
                        setGatewayForm({ ...gatewayForm, payfast_merchant_key: e.target.value })
                      }
                      placeholder="PayFast merchant security key"
                      className="bg-stone-950 border-stone-700 font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-stone-300">PayFast Passphrase (Salt)</Label>
                      <button
                        type="button"
                        onClick={() => setShowPassphrase(!showPassphrase)}
                        className="text-[11px] text-stone-400 hover:text-white flex items-center space-x-1"
                      >
                        {showPassphrase ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                        <span>{showPassphrase ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <Input
                      type={showPassphrase ? 'text' : 'password'}
                      value={gatewayForm.payfast_passphrase}
                      onChange={(e) =>
                        setGatewayForm({ ...gatewayForm, payfast_passphrase: e.target.value })
                      }
                      placeholder="Configured PayFast passphrase salt"
                      className="bg-stone-950 border-stone-700 font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs text-stone-300">Platform Admin / Split Fee (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={gatewayForm.admin_fee_pct}
                        onChange={(e) =>
                          setGatewayForm({
                            ...gatewayForm,
                            admin_fee_pct: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="bg-stone-950 border-stone-700 font-mono text-sm pr-10"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-stone-400">%</span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Standard platform admin percentage split (default: 5.00%). Displayed clearly during customer booking checkout.
                    </p>
                  </div>
                </div>

                {/* Sub-section: Branch Payout Banking Details */}
                <div className="border-t border-stone-800 pt-5 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Landmark className="h-5 w-5 text-amber-500" />
                    <div>
                      <h3 className="text-sm font-semibold text-white">Branch Payout Banking Details</h3>
                      <p className="text-xs text-stone-400">
                        Designated business bank account for weekly barber payouts and platform fee distributions.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-stone-300">Bank Name</Label>
                      <Input
                        type="text"
                        value={gatewayForm.payout_bank_name}
                        onChange={(e) =>
                          setGatewayForm({ ...gatewayForm, payout_bank_name: e.target.value })
                        }
                        placeholder="e.g. FNB / Standard Bank / Capitec"
                        className="bg-stone-950 border-stone-700 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-stone-300">Account Number</Label>
                      <Input
                        type="text"
                        value={gatewayForm.payout_account_number}
                        onChange={(e) =>
                          setGatewayForm({ ...gatewayForm, payout_account_number: e.target.value })
                        }
                        placeholder="e.g. 62812345678"
                        className="bg-stone-950 border-stone-700 font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-stone-300">Branch Code</Label>
                      <Input
                        type="text"
                        value={gatewayForm.payout_branch_code}
                        onChange={(e) =>
                          setGatewayForm({ ...gatewayForm, payout_branch_code: e.target.value })
                        }
                        placeholder="e.g. 250655"
                        className="bg-stone-950 border-stone-700 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-800">
                  <div className="text-xs text-stone-400">
                    Modifying gateway settings for: <strong className="text-white">{selectedLocObj?.name || gatewayLocationId}</strong>
                  </div>
                  <Button
                    type="submit"
                    disabled={savingGateway}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  >
                    {savingGateway ? 'Saving Credentials...' : 'Save Branch Gateway Settings'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Card: Global Platform APIs & Infrastructure */}
          <Card className="border-stone-800 bg-stone-900/50">
            <CardHeader>
              <CardTitle className="text-lg text-white">Global Platform APIs & Infrastructure</CardTitle>
              <CardDescription>
                Central infrastructure status, cloud databases, notifications, and fulfillment integration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-stone-800">
                <div>
                  <div className="font-medium text-stone-200">Dissafyt Cloud Database & Auth Engine</div>
                  <div className="text-xs text-stone-500 font-mono">https://ddetxmhghairsapcqmto.supabase.co &bull; PostgreSQL 17</div>
                </div>
                <span className="flex items-center text-xs text-emerald-400 font-mono">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> ONLINE
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-stone-800">
                <div>
                  <div className="font-medium text-stone-200">Platform PayFast Fallback Gateway</div>
                  <div className="text-xs text-stone-500 font-mono">
                    Merchant ID: 17675995 &bull; Key: Configured &bull; Passphrase: Set &bull; Production Active
                  </div>
                </div>
                <span className="flex items-center text-xs text-emerald-400 font-mono">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> ACTIVE (LIVE)
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-stone-800">
                <div>
                  <div className="font-medium text-stone-200">The Courier Guy / Shiplogic</div>
                  <div className="text-xs text-stone-500 font-mono">
                    Awaiting Live API Key &bull; Door-to-Door Delivery &bull; Separate Customer Payment Link Workflow
                  </div>
                </div>
                <span className="flex items-center text-xs text-amber-400 font-mono">
                  <Clock className="mr-1 h-3.5 w-3.5" /> PENDING SETUP
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-stone-200">Email Notifications (Resend)</div>
                  <div className="text-xs text-stone-500 font-mono">API Key: Configured (re_RAbGwm...) &bull; Receipts & Reminders</div>
                </div>
                <span className="flex items-center text-xs text-emerald-400 font-mono">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> ACTIVE
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: Database Audit Trail & Compliance                 */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <Card className="border-stone-800 bg-stone-900/50">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-white flex items-center">
                <History className="mr-2 h-5 w-5 text-amber-500" />
                Database Audit Trail & Compliance ({logs.length})
              </CardTitle>
              <CardDescription>
                Immutable background ledger recording all administrative mutations, role updates, and catalog changes.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              disabled={loadingLogs}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              Refresh Trail
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search and Action Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Sliders className="h-4 w-4 text-stone-400 shrink-0" />
                <span className="text-xs text-stone-400 font-medium shrink-0">Filter Event:</span>
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="h-9 px-3 rounded-md bg-stone-950 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Audit Events</option>
                  <option value="roles">Role Assignments & Access</option>
                  <option value="locations">Location & Studio Updates</option>
                  <option value="services">Service Catalog Mutations</option>
                  <option value="products">Merchandise & Inventory</option>
                  <option value="staff">Staff Profile Updates</option>
                </select>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                <Input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Filter by operator, action, entity..."
                  className="pl-9 h-9 text-xs bg-stone-950 border-stone-700"
                />
              </div>
            </div>

            {loadingLogs ? (
              <div className="py-12 text-center text-stone-500 text-sm">Loading audit events...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-stone-500 text-sm">
                <FileText className="mx-auto h-8 w-8 text-stone-600 mb-2" />
                No administrative mutations recorded matching the selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto border border-stone-800 rounded-md">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="border-b border-stone-800 bg-stone-950/80 text-[10px] uppercase text-stone-500">
                    <tr>
                      <th className="py-3 px-4">Timestamp (SAST)</th>
                      <th className="py-3 px-4">Operator</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target Entity</th>
                      <th className="py-3 px-4">Details / Diff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/80 font-mono">
                    {filteredLogs.map((log) => {
                      const formattedDate = new Intl.DateTimeFormat('en-ZA', {
                        timeZone: 'Africa/Johannesburg',
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      }).format(new Date(log.created_at));

                      const isDanger =
                        log.action.includes('delete') || log.action.includes('revoke');
                      const isSuccess =
                        log.action.includes('create') || log.action.includes('assign');

                      return (
                        <tr key={log.id} className="hover:bg-stone-800/30">
                          <td className="py-2.5 px-4 text-stone-400 whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="py-2.5 px-4 text-white whitespace-nowrap">
                            {log.actor_email}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.actor_role === 'admin'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              }`}
                            >
                              {log.actor_role}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isDanger
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : isSuccess
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-stone-800 text-stone-300'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-stone-300 font-sans">
                            <div className="font-semibold text-white">
                              {log.entity_name || log.entity_id}
                            </div>
                            <div className="text-[10px] text-stone-500 uppercase">{log.entity_type}</div>
                          </td>
                          <td className="py-2.5 px-4 text-stone-400 max-w-xs truncate text-[11px]">
                            {log.changes ? JSON.stringify(log.changes) : '-'}
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
      )}
    </div>
  );
}
