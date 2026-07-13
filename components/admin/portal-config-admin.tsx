"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, RotateCcw, Save, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import type { AdminPortalConfig, EffectValue, NullableEffectValue, WatermarkSettings } from "@/lib/admin-portal-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { label } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Props = {
  config: AdminPortalConfig;
};

type TabKey = "permissions" | "modules" | "widgets" | "documents" | "watermarks" | "users";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "permissions", label: "Permissions" },
  { key: "modules", label: "Modules" },
  { key: "widgets", label: "Widgets" },
  { key: "documents", label: "Document categories" },
  { key: "watermarks", label: "Watermarks" },
  { key: "users", label: "User overrides" }
];

const defaultWatermark: WatermarkSettings = {
  enabled: true,
  includeName: true,
  includeRole: true,
  includeTimestamp: true,
  includeIpAddress: true,
  includeDeviceId: true,
  opacity: 28,
  density: 18
};

export function PortalConfigAdmin({ config }: Props) {
  const [selectedRole, setSelectedRole] = useState<string>(config.roles[0]?.value ?? "SYSTEM_ADMIN");
  const [selectedUserEmail, setSelectedUserEmail] = useState(config.users[0]?.email ?? "");
  const [tab, setTab] = useState<TabKey>("permissions");
  const [rolePermissions, setRolePermissions] = useState(structuredClone(config.rolePermissions));
  const [roleModules, setRoleModules] = useState(structuredClone(config.roleModules));
  const [roleWidgets, setRoleWidgets] = useState(structuredClone(config.roleWidgets));
  const [roleCategories, setRoleCategories] = useState(structuredClone(config.roleDocumentCategories));
  const [roleWatermarks, setRoleWatermarks] = useState(structuredClone(config.roleWatermarks));
  const [userPermissions, setUserPermissions] = useState(structuredClone(config.userPermissionOverrides));
  const [userModules, setUserModules] = useState(structuredClone(config.userModules));
  const [userWidgets, setUserWidgets] = useState(structuredClone(config.userWidgets));
  const [userCategories, setUserCategories] = useState(structuredClone(config.userDocumentCategories));
  const [userWatermarks, setUserWatermarks] = useState(structuredClone(config.userWatermarks));
  const [userSearch, setUserSearch] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedUser = config.users.find((user) => user.email === selectedUserEmail);
  const filteredUsers = useMemo(() => {
    const query = userSearch.toLowerCase().trim();
    if (!query) return config.users;
    return config.users.filter((user) =>
      [user.name, user.email, user.department ?? "", user.role].some((value) => value.toLowerCase().includes(query))
    );
  }, [config.users, userSearch]);

  const saveRole = () => {
    if (!window.confirm("Confirm role configuration update. This can change access for every user assigned to the selected role.")) return;
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/portal-config/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          permissions: rolePermissions[selectedRole] ?? {},
          modules: roleModules[selectedRole] ?? {},
          widgets: roleWidgets[selectedRole] ?? {},
          categories: roleCategories[selectedRole] ?? {},
          watermarks: roleWatermarks[selectedRole] ?? {}
        })
      });
      setMessage(await responseMessage(response, "Role configuration saved."));
    });
  };

  const saveUser = () => {
    if (!selectedUserEmail) return;
    if (!window.confirm("Confirm user-specific override update. Explicit denies will take precedence over role access.")) return;
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/portal-config/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: selectedUserEmail,
          permissions: userPermissions[selectedUserEmail] ?? {},
          modules: userModules[selectedUserEmail] ?? {},
          widgets: userWidgets[selectedUserEmail] ?? {},
          categories: userCategories[selectedUserEmail] ?? {},
          watermarks: userWatermarks[selectedUserEmail] ?? {}
        })
      });
      setMessage(await responseMessage(response, "User overrides saved."));
    });
  };

  const resetUser = () => {
    if (!selectedUserEmail) return;
    if (!window.confirm("Reset this user to role defaults? All user-specific overrides for portal configuration will be removed.")) return;
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/portal-config/user/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: selectedUserEmail })
      });
      if (response.ok) {
        setUserPermissions((current) => clearUserMap(current, selectedUserEmail));
        setUserModules((current) => clearUserMap(current, selectedUserEmail));
        setUserWidgets((current) => clearUserMap(current, selectedUserEmail));
        setUserCategories((current) => clearUserMap(current, selectedUserEmail));
        setUserWatermarks((current) => clearUserMap(current, selectedUserEmail));
      }
      setMessage(await responseMessage(response, "User reset to role defaults."));
    });
  };

  return (
    <div className="space-y-5">
      <Card className="border-slate-800 bg-slate-950 text-white shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <ShieldCheck className="h-5 w-5 text-bcb-gold" />
                Portal Configuration
              </CardTitle>
              <CardDescription className="text-slate-300">
                Configure role defaults and user-level overrides through the production permission engine.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                aria-label="Select role"
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
                className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-bcb-gold"
              >
                {config.roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <Button onClick={saveRole} disabled={isPending} variant="gold">
                <Save className="h-4 w-4" />
                Save role
              </Button>
            </div>
          </div>
          {message ? (
            <div
              className={cn(
                "mt-3 rounded-md border px-3 py-2 text-sm",
                message.type === "success"
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-100"
                  : "border-red-500/50 bg-red-500/15 text-red-100"
              )}
              role="status"
            >
              {message.text}
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Portal configuration sections">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-bcb-gold",
                  tab === item.key ? "bg-white text-slate-950" : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {tab === "permissions" ? (
        <EffectMatrix
          title="Role Action Permissions"
          description="Explicit deny overrides allow when both role and user rules match."
          items={config.permissionDefinitions.map((permission) => ({
            key: `${permission.resource}:${permission.action}`,
            label: `${label(permission.resource)} / ${label(permission.action)}`,
            description: permission.description,
            sensitive: permission.sensitive
          }))}
          values={rolePermissions[selectedRole] ?? {}}
          onChange={(key, effect) => setNestedEffect(setRolePermissions, selectedRole, key, effect)}
        />
      ) : null}

      {tab === "modules" ? (
        <ToggleGrid
          title="Module Visibility"
          description="Controls navigation visibility and server-side module access."
          items={config.moduleKeys.map((key) => ({ key, label: label(key) }))}
          values={roleModules[selectedRole] ?? {}}
          onChange={(key, effect) => setNestedEffect(setRoleModules, selectedRole, key, effect)}
        />
      ) : null}

      {tab === "widgets" ? (
        <ToggleGrid
          title="Dashboard Widget Visibility"
          description="Dashboard components render only when their widget key is visible."
          items={config.dashboardWidgetKeys.map((key) => ({ key, label: label(key) }))}
          values={roleWidgets[selectedRole] ?? {}}
          onChange={(key, effect) => setNestedEffect(setRoleWidgets, selectedRole, key, effect)}
        />
      ) : null}

      {tab === "documents" ? (
        <CategoryMatrix
          title="Document Category Access"
          description="Category-specific access is evaluated with wildcard defaults and explicit deny precedence."
          categories={config.documentCategories}
          actions={config.documentCategoryActions}
          values={roleCategories[selectedRole] ?? {}}
          onChange={(key, effect) => setNestedEffect(setRoleCategories, selectedRole, key, effect)}
        />
      ) : null}

      {tab === "watermarks" ? (
        <WatermarkEditor
          title="Role Watermark Policies"
          description="Secure viewer policies apply by category and can be overridden per user."
          categories={config.documentCategories}
          values={roleWatermarks[selectedRole] ?? {}}
          onChange={(category, policy) => setNestedValue(setRoleWatermarks, selectedRole, category, policy)}
        />
      ) : null}

      {tab === "users" ? (
        <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>User Search</CardTitle>
              <CardDescription>Select a user to view inherited values and apply overrides.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Search users"
                  className="pl-9"
                />
              </div>
              <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                {filteredUsers.length ? (
                  filteredUsers.map((user) => (
                    <button
                      key={user.email}
                      type="button"
                      onClick={() => {
                        setSelectedUserEmail(user.email);
                        setSelectedRole(user.role);
                      }}
                      className={cn(
                        "w-full rounded-md border p-3 text-left outline-none transition focus:ring-2 focus:ring-bcb-green",
                        selectedUserEmail === user.email ? "border-bcb-green bg-emerald-50" : "bg-white hover:bg-slate-50"
                      )}
                    >
                      <p className="font-semibold text-bcb-ink">{user.name}</p>
                      <p className="break-all text-xs text-slate-500">{user.email}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">{label(user.role)}</p>
                    </button>
                  ))
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-sm text-slate-500">No users match this search.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>{selectedUser?.name ?? "No user selected"}</CardTitle>
                  <CardDescription>
                    {selectedUser ? `${selectedUser.email} · inherited role: ${label(selectedUser.role)}` : "Search for a user first."}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={resetUser} disabled={!selectedUserEmail || isPending} variant="outline">
                    <RotateCcw className="h-4 w-4" />
                    Reset user
                  </Button>
                  <Button onClick={saveUser} disabled={!selectedUserEmail || isPending}>
                    <Save className="h-4 w-4" />
                    Save user
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {selectedUser ? (
                <>
                  <InheritedMatrix
                    title="User Permission Overrides"
                    items={config.permissionDefinitions.slice(0, 18).map((permission) => ({
                      key: `${permission.resource}:${permission.action}`,
                      label: `${label(permission.resource)} / ${label(permission.action)}`,
                      sensitive: permission.sensitive
                    }))}
                    roleValues={rolePermissions[selectedUser.role] ?? {}}
                    userValues={userPermissions[selectedUser.email] ?? {}}
                    onChange={(key, effect) => setNestedEffect(setUserPermissions, selectedUser.email, key, effect)}
                  />
                  <InheritedMatrix
                    title="Module Overrides"
                    items={config.moduleKeys.map((key) => ({ key, label: label(key) }))}
                    roleValues={roleModules[selectedUser.role] ?? {}}
                    userValues={userModules[selectedUser.email] ?? {}}
                    onChange={(key, effect) => setNestedEffect(setUserModules, selectedUser.email, key, effect)}
                  />
                  <InheritedMatrix
                    title="Widget Overrides"
                    items={config.dashboardWidgetKeys.map((key) => ({ key, label: label(key) }))}
                    roleValues={roleWidgets[selectedUser.role] ?? {}}
                    userValues={userWidgets[selectedUser.email] ?? {}}
                    onChange={(key, effect) => setNestedEffect(setUserWidgets, selectedUser.email, key, effect)}
                  />
                  <CategoryMatrix
                    title="User Document Category Overrides"
                    description="Inherit keeps the selected user's role decision."
                    categories={config.documentCategories}
                    actions={config.documentCategoryActions}
                    values={userCategories[selectedUser.email] ?? {}}
                    roleValues={roleCategories[selectedUser.role] ?? {}}
                    nullable
                    onChange={(key, effect) => setNestedEffect(setUserCategories, selectedUser.email, key, effect)}
                  />
                  <WatermarkEditor
                    title="User Watermark Overrides"
                    description="Set category policies only when this user needs a different secure-viewer watermark."
                    categories={config.documentCategories}
                    values={userWatermarks[selectedUser.email] ?? {}}
                    roleValues={roleWatermarks[selectedUser.role] ?? {}}
                    nullable
                    onChange={(category, policy) => setNestedValue(setUserWatermarks, selectedUser.email, category, policy)}
                  />
                </>
              ) : (
                <div className="rounded-md border border-dashed p-6 text-sm text-slate-500">No user selected.</div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function EffectMatrix({
  title,
  description,
  items,
  values,
  onChange
}: {
  title: string;
  description: string;
  items: Array<{ key: string; label: string; description?: string; sensitive?: boolean }>;
  values: Record<string, EffectValue>;
  onChange: (key: string, effect: EffectValue) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <div key={item.key} className="rounded-md border bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-bcb-ink">{item.label}</p>
                {item.description ? <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p> : null}
              </div>
              {item.sensitive ? <SensitiveBadge /> : null}
            </div>
            <EffectControl value={values[item.key] ?? "DENY"} onChange={(effect) => onChange(item.key, effect)} className="mt-3" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ToggleGrid({
  title,
  description,
  items,
  values,
  onChange
}: {
  title: string;
  description: string;
  items: Array<{ key: string; label: string }>;
  values: Record<string, EffectValue>;
  onChange: (key: string, effect: EffectValue) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 rounded-md border bg-white p-3">
            <span className="text-sm font-semibold text-bcb-ink">{item.label}</span>
            <EffectControl compact value={values[item.key] ?? "DENY"} onChange={(effect) => onChange(item.key, effect)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function InheritedMatrix({
  title,
  items,
  roleValues,
  userValues,
  onChange
}: {
  title: string;
  items: Array<{ key: string; label: string; sensitive?: boolean }>;
  roleValues: Record<string, EffectValue>;
  userValues: Record<string, NullableEffectValue>;
  onChange: (key: string, effect: NullableEffectValue) => void;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">{title}</h3>
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => {
          const override = userValues[item.key];
          const inherited = roleValues[item.key] ?? "DENY";
          return (
            <div key={item.key} className="rounded-md border bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-bcb-ink">{item.label}</p>
                  <p className="text-xs text-slate-500">
                    {override ? `User override: ${override}` : `Inherited from role: ${inherited}`}
                  </p>
                </div>
                {item.sensitive ? <SensitiveBadge /> : null}
              </div>
              <NullableEffectControl value={override ?? null} onChange={(effect) => onChange(item.key, effect)} className="mt-3" />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CategoryMatrix({
  title,
  description,
  categories,
  actions,
  values,
  roleValues,
  nullable = false,
  onChange
}: {
  title: string;
  description: string;
  categories: readonly string[];
  actions: readonly string[];
  values: Record<string, EffectValue | NullableEffectValue>;
  roleValues?: Record<string, EffectValue>;
  nullable?: boolean;
  onChange: (key: string, effect: EffectValue | NullableEffectValue) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((category) => (
          <div key={category} className="rounded-md border bg-white p-3">
            <p className="mb-3 font-semibold text-bcb-ink">{category === "*" ? "All categories" : category}</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {actions.map((action) => {
                const key = `${category}::${action}`;
                const inherited = roleValues?.[key];
                return (
                  <div key={key} className="rounded-md bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-700">{label(action)}</p>
                    {nullable ? <p className="mb-2 text-xs text-slate-500">Role: {inherited ?? "DENY"}</p> : null}
                    {nullable ? (
                      <NullableEffectControl value={(values[key] as NullableEffectValue) ?? null} onChange={(effect) => onChange(key, effect)} />
                    ) : (
                      <EffectControl value={(values[key] as EffectValue) ?? "DENY"} onChange={(effect) => onChange(key, effect)} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WatermarkEditor({
  title,
  description,
  categories,
  values,
  roleValues,
  nullable = false,
  onChange
}: {
  title: string;
  description: string;
  categories: readonly string[];
  values: Record<string, WatermarkSettings | null>;
  roleValues?: Record<string, WatermarkSettings>;
  nullable?: boolean;
  onChange: (category: string, policy: WatermarkSettings | null) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => {
          const inherited = roleValues?.[category] ?? defaultWatermark;
          const policy = values[category] ?? (nullable ? null : inherited);
          const visiblePolicy = policy ?? inherited;
          return (
            <div key={category} className="rounded-md border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-bcb-ink">{category === "*" ? "All categories" : category}</p>
                  <p className="text-xs text-slate-500">{nullable && !policy ? "Inherited from role" : "Explicit policy"}</p>
                </div>
                {nullable ? (
                  <Button size="sm" variant="outline" onClick={() => onChange(category, policy ? null : { ...inherited })}>
                    <SlidersHorizontal className="h-4 w-4" />
                    {policy ? "Inherit" : "Override"}
                  </Button>
                ) : null}
              </div>
              <fieldset disabled={nullable && !policy} className="mt-4 space-y-3 disabled:opacity-50">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={visiblePolicy.enabled}
                    onChange={(event) => onChange(category, { ...visiblePolicy, enabled: event.target.checked })}
                  />
                  Enabled
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["includeName", "includeRole", "includeTimestamp", "includeIpAddress", "includeDeviceId"] as const).map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={visiblePolicy[key]}
                        onChange={(event) => onChange(category, { ...visiblePolicy, [key]: event.target.checked })}
                      />
                      {label(key)}
                    </label>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField
                    label="Opacity"
                    min={10}
                    max={80}
                    value={visiblePolicy.opacity}
                    onChange={(value) => onChange(category, { ...visiblePolicy, opacity: value })}
                  />
                  <NumberField
                    label="Density"
                    min={8}
                    max={48}
                    value={visiblePolicy.density}
                    onChange={(value) => onChange(category, { ...visiblePolicy, density: value })}
                  />
                </div>
              </fieldset>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function EffectControl({
  value,
  onChange,
  compact = false,
  className
}: {
  value: EffectValue;
  onChange: (effect: EffectValue) => void;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-1 rounded-md bg-slate-100 p-1", compact ? "w-[132px]" : "w-full", className)}>
      {(["ALLOW", "DENY"] as const).map((effect) => (
        <button
          key={effect}
          type="button"
          onClick={() => onChange(effect)}
          className={cn(
            "rounded px-2 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-bcb-green",
            value === effect
              ? effect === "ALLOW"
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
              : "text-slate-600 hover:bg-white"
          )}
        >
          {effect}
        </button>
      ))}
    </div>
  );
}

function NullableEffectControl({
  value,
  onChange,
  className
}: {
  value: NullableEffectValue;
  onChange: (effect: NullableEffectValue) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1", className)}>
      {[
        ["INHERIT", null],
        ["ALLOW", "ALLOW"],
        ["DENY", "DENY"]
      ].map(([labelText, effect]) => (
        <button
          key={labelText}
          type="button"
          onClick={() => onChange(effect as NullableEffectValue)}
          className={cn(
            "rounded px-2 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-bcb-green",
            value === effect
              ? effect === "ALLOW"
                ? "bg-emerald-600 text-white"
                : effect === "DENY"
                  ? "bg-red-600 text-white"
                  : "bg-slate-700 text-white"
              : "text-slate-600 hover:bg-white"
          )}
        >
          {labelText}
        </button>
      ))}
    </div>
  );
}

function SensitiveBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
      <AlertTriangle className="h-3 w-3" />
      Sensitive
    </span>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-1 text-xs font-semibold text-slate-600">
      <span>{label}</span>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function setNestedEffect<T extends Record<string, Record<string, unknown>>>(
  setter: React.Dispatch<React.SetStateAction<T>>,
  owner: string,
  key: string,
  effect: unknown
) {
  setter((current) => ({
    ...current,
    [owner]: {
      ...(current[owner] ?? {}),
      [key]: effect
    }
  }));
}

function setNestedValue<T extends Record<string, Record<string, unknown>>>(
  setter: React.Dispatch<React.SetStateAction<T>>,
  owner: string,
  key: string,
  value: unknown
) {
  setter((current) => ({
    ...current,
    [owner]: {
      ...(current[owner] ?? {}),
      [key]: value
    }
  }));
}

function clearUserMap<T extends Record<string, unknown>>(current: T, email: string) {
  const next = { ...current };
  delete next[email];
  return next;
}

async function responseMessage(response: Response, success: string) {
  if (response.ok) return { type: "success" as const, text: success };
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return { type: "error" as const, text: body?.error ?? "The change could not be saved." };
}
