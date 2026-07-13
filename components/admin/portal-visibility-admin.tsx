"use client";

import { useMemo, useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import { ArrowDown, ArrowUp, Eye, EyeOff, RotateCcw, Save, Search } from "lucide-react";
import type {
  PortalConfigurationAdminData,
  PortalVisibilityValue,
  UserPortalVisibilityValue,
  UserWidgetVisibilityValue,
  WidgetVisibilityValue
} from "@/lib/portal-configuration";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { label } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Section = "roles" | "modules" | "widgets" | "users";

type Props = {
  data: PortalConfigurationAdminData;
  section: Section;
};

const sectionTitles: Record<Section, { title: string; description: string }> = {
  roles: {
    title: "Role Presets",
    description: "Configure the complete default portal experience for each existing role."
  },
  modules: {
    title: "Modules & Navigation",
    description: "Enable, hide, and order role navigation from data-driven visibility settings."
  },
  widgets: {
    title: "Dashboard Widgets",
    description: "Choose role dashboard widgets, order them, size them, and preview the result."
  },
  users: {
    title: "User Overrides",
    description: "Personalize a user portal while showing inherited, overridden, and hidden settings."
  }
};

export function PortalVisibilityAdmin({ data, section }: Props) {
  const [selectedRole, setSelectedRole] = useState<Role>((data.roles[0]?.value ?? "SYSTEM_ADMIN") as Role);
  const [selectedUserEmail, setSelectedUserEmail] = useState(data.users[0]?.email ?? "");
  const [roleModules, setRoleModules] = useState(structuredClone(data.roleModules));
  const [roleWidgets, setRoleWidgets] = useState(structuredClone(data.roleWidgets));
  const [userModules, setUserModules] = useState(structuredClone(data.userModules));
  const [userWidgets, setUserWidgets] = useState(structuredClone(data.userWidgets));
  const [userSearch, setUserSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const heading = sectionTitles[section];
  const selectedUser = data.users.find((user) => user.email === selectedUserEmail);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return data.users;
    return data.users.filter((user) =>
      [user.name, user.email, user.role, user.department ?? ""].some((value) => value.toLowerCase().includes(query))
    );
  }, [data.users, userSearch]);

  const roleModuleValues = completeRoleModules(data, roleModules[selectedRole] ?? {});
  const roleWidgetValues = completeRoleWidgets(data, roleWidgets[selectedRole] ?? {});
  const selectedUserModuleValues = selectedUser ? userModules[selectedUser.email] ?? {} : {};
  const selectedUserWidgetValues = selectedUser ? userWidgets[selectedUser.email] ?? {} : {};

  const saveRole = () => {
    if (!window.confirm("Save this role preset? This changes navigation and dashboard defaults for every user with this role.")) return;
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/portal-configuration/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          modules: roleModuleValues,
          widgets: roleWidgetValues
        })
      });
      setMessage(await responseMessage(response, "Role portal preset saved."));
      if (response.ok) setDirty(false);
    });
  };

  const resetRole = () => {
    if (!window.confirm("Reset this role to system defaults?")) return;
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/portal-configuration/role/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole })
      });
      setMessage(await responseMessage(response, "Role preset reset to system defaults. Refresh to see the restored values."));
      if (response.ok) setDirty(false);
    });
  };

  const saveUser = () => {
    if (!selectedUser) return;
    if (!window.confirm("Save user-specific portal overrides?")) return;
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/portal-configuration/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: selectedUser.email,
          modules: selectedUserModuleValues,
          widgets: selectedUserWidgetValues
        })
      });
      setMessage(await responseMessage(response, "User portal overrides saved."));
      if (response.ok) setDirty(false);
    });
  };

  const resetUser = () => {
    if (!selectedUser) return;
    if (!window.confirm("Reset this user to role defaults?")) return;
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/portal-configuration/user/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: selectedUser.email })
      });
      if (response.ok) {
        setUserModules((current) => clearOwner(current, selectedUser.email));
        setUserWidgets((current) => clearOwner(current, selectedUser.email));
        setDirty(false);
      }
      setMessage(await responseMessage(response, "User reset to role defaults."));
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{heading.title}</CardTitle>
              <CardDescription>{heading.description}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="Select role"
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value as Role)}
                className="h-10 rounded-md border bg-white px-3 text-sm font-semibold"
              >
                {data.roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {section !== "users" ? (
                <>
                  <Button onClick={resetRole} disabled={isPending} variant="outline">
                    <RotateCcw className="h-4 w-4" />
                    Reset role
                  </Button>
                  <Button onClick={saveRole} disabled={isPending}>
                    <Save className="h-4 w-4" />
                    Save role
                  </Button>
                </>
              ) : null}
            </div>
          </div>
          {dirty ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
              Unsaved changes
            </div>
          ) : null}
          {message ? (
            <div
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-semibold",
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-800"
              )}
              role="status"
            >
              {message.text}
            </div>
          ) : null}
        </CardHeader>
      </Card>

      {section === "roles" || section === "modules" ? (
        <ModuleEditor
          modules={data.modules}
          values={roleModuleValues}
          onChange={(key, value) => {
            setRoleModules((current) => setOwnerValue(current, selectedRole, key, value));
            setDirty(true);
          }}
        />
      ) : null}

      {section === "roles" || section === "widgets" ? (
        <>
          <WidgetEditor
            widgets={data.widgets}
            values={roleWidgetValues}
            onChange={(key, value) => {
              setRoleWidgets((current) => setOwnerValue(current, selectedRole, key, value));
              setDirty(true);
            }}
          />
          <RolePreview modules={data.modules} widgets={data.widgets} moduleValues={roleModuleValues} widgetValues={roleWidgetValues} />
        </>
      ) : null}

      {section === "users" ? (
        <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>User Search</CardTitle>
              <CardDescription>Select a user to override modules, navigation, and widgets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users" className="pl-9" />
              </div>
              <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => {
                      setSelectedUserEmail(user.email);
                      setSelectedRole(user.role as Role);
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
                ))}
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
                  <Button onClick={resetUser} disabled={!selectedUser || isPending} variant="outline">
                    <RotateCcw className="h-4 w-4" />
                    Reset to Role Default
                  </Button>
                  <Button onClick={saveUser} disabled={!selectedUser || isPending}>
                    <Save className="h-4 w-4" />
                    Save user
                  </Button>
                </div>
              </div>
            </CardHeader>
            {selectedUser ? (
              <CardContent className="space-y-5">
                <UserModuleEditor
                  modules={data.modules}
                  roleValues={completeRoleModules(data, roleModules[selectedUser.role] ?? {})}
                  values={selectedUserModuleValues}
                  onChange={(key, value) => {
                    setUserModules((current) => setOwnerValue(current, selectedUser.email, key, value));
                    setDirty(true);
                  }}
                />
                <UserWidgetEditor
                  widgets={data.widgets}
                  roleValues={completeRoleWidgets(data, roleWidgets[selectedUser.role] ?? {})}
                  values={selectedUserWidgetValues}
                  onChange={(key, value) => {
                    setUserWidgets((current) => setOwnerValue(current, selectedUser.email, key, value));
                    setDirty(true);
                  }}
                />
              </CardContent>
            ) : null}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function ModuleEditor({
  modules,
  values,
  onChange
}: {
  modules: PortalConfigurationAdminData["modules"];
  values: Record<string, PortalVisibilityValue>;
  onChange: (key: string, value: PortalVisibilityValue) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visible Modules and Navigation</CardTitle>
        <CardDescription>Hidden modules are removed from navigation but direct routes remain protected by server checks.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <VisibilityRow
            key={module.key}
            title={module.name}
            subtitle={module.route}
            visible={values[module.key]?.isVisible ?? false}
            sortOrder={values[module.key]?.sortOrder ?? module.sortOrder}
            onVisibleChange={(isVisible) => onChange(module.key, { ...values[module.key], isVisible, sortOrder: values[module.key]?.sortOrder ?? module.sortOrder })}
            onSortChange={(sortOrder) => onChange(module.key, { ...values[module.key], isVisible: values[module.key]?.isVisible ?? false, sortOrder })}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function WidgetEditor({
  widgets,
  values,
  onChange
}: {
  widgets: PortalConfigurationAdminData["widgets"];
  values: Record<string, WidgetVisibilityValue>;
  onChange: (key: string, value: WidgetVisibilityValue) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Widgets</CardTitle>
        <CardDescription>Enable widgets by role, choose order, and select a supported size.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {widgets.map((widget) => {
          const value = values[widget.key] ?? { isVisible: false, sortOrder: widget.sortOrder, size: widget.defaultSize };
          return (
            <div key={widget.key} className="rounded-md border bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-bcb-ink">{widget.name}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{widget.description}</p>
                </div>
                <ToggleButton visible={value.isVisible} onClick={() => onChange(widget.key, { ...value, isVisible: !value.isVisible })} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_150px]">
                <OrderControl value={value.sortOrder} onChange={(sortOrder) => onChange(widget.key, { ...value, sortOrder })} />
                <select
                  value={value.size}
                  onChange={(event) => onChange(widget.key, { ...value, size: event.target.value as WidgetVisibilityValue["size"] })}
                  className="h-10 rounded-md border bg-white px-3 text-sm"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function UserModuleEditor({
  modules,
  roleValues,
  values,
  onChange
}: {
  modules: PortalConfigurationAdminData["modules"];
  roleValues: Record<string, PortalVisibilityValue>;
  values: Record<string, UserPortalVisibilityValue>;
  onChange: (key: string, value: UserPortalVisibilityValue) => void;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Module Overrides</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {modules.map((module) => {
          const override = values[module.key];
          const inherited = roleValues[module.key];
          const state = override?.isVisible === null || override === undefined ? "inherited" : override.isVisible ? "overridden" : "hidden";
          return (
            <div key={module.key} className="rounded-md border bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-bcb-ink">{module.name}</p>
                  <StateBadge state={state} />
                  <p className="mt-1 text-xs text-slate-500">Role default: {inherited?.isVisible ? "Visible" : "Hidden"}</p>
                </div>
                <select
                  value={override?.isVisible === undefined || override?.isVisible === null ? "inherit" : override.isVisible ? "show" : "hide"}
                  onChange={(event) =>
                    onChange(module.key, {
                      isVisible: event.target.value === "inherit" ? null : event.target.value === "show",
                      sortOrder: override?.sortOrder ?? inherited?.sortOrder ?? module.sortOrder
                    })
                  }
                  className="h-10 rounded-md border bg-white px-2 text-sm"
                >
                  <option value="inherit">Inherit</option>
                  <option value="show">Show</option>
                  <option value="hide">Hide</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UserWidgetEditor({
  widgets,
  roleValues,
  values,
  onChange
}: {
  widgets: PortalConfigurationAdminData["widgets"];
  roleValues: Record<string, WidgetVisibilityValue>;
  values: Record<string, UserWidgetVisibilityValue>;
  onChange: (key: string, value: UserWidgetVisibilityValue) => void;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Widget Overrides</h3>
      <div className="grid gap-3 lg:grid-cols-2">
        {widgets.map((widget) => {
          const override = values[widget.key];
          const inherited = roleValues[widget.key];
          const state = override?.isVisible === null || override === undefined ? "inherited" : override.isVisible ? "overridden" : "hidden";
          return (
            <div key={widget.key} className="rounded-md border bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-bcb-ink">{widget.name}</p>
                  <StateBadge state={state} />
                  <p className="mt-1 text-xs text-slate-500">
                    Role default: {inherited?.isVisible ? "Visible" : "Hidden"} · {inherited?.size ?? widget.defaultSize}
                  </p>
                </div>
                <select
                  value={override?.isVisible === undefined || override?.isVisible === null ? "inherit" : override.isVisible ? "show" : "hide"}
                  onChange={(event) =>
                    onChange(widget.key, {
                      isVisible: event.target.value === "inherit" ? null : event.target.value === "show",
                      sortOrder: override?.sortOrder ?? inherited?.sortOrder ?? widget.sortOrder,
                      size: override?.size ?? inherited?.size ?? widget.defaultSize
                    })
                  }
                  className="h-10 rounded-md border bg-white px-2 text-sm"
                >
                  <option value="inherit">Inherit</option>
                  <option value="show">Show</option>
                  <option value="hide">Hide</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RolePreview({
  modules,
  widgets,
  moduleValues,
  widgetValues
}: {
  modules: PortalConfigurationAdminData["modules"];
  widgets: PortalConfigurationAdminData["widgets"];
  moduleValues: Record<string, PortalVisibilityValue>;
  widgetValues: Record<string, WidgetVisibilityValue>;
}) {
  const visibleModules = modules.filter((module) => moduleValues[module.key]?.isVisible).sort((a, b) => moduleValues[a.key].sortOrder - moduleValues[b.key].sortOrder);
  const visibleWidgets = widgets.filter((widget) => widgetValues[widget.key]?.isVisible).sort((a, b) => widgetValues[a.key].sortOrder - widgetValues[b.key].sortOrder);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Dashboard Preview</CardTitle>
        <CardDescription>Desktop, tablet, and mobile use the same ordered configuration with responsive wrapping.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-md border bg-slate-950 p-3 text-white">
          {visibleModules.map((module) => (
            <div key={module.key} className="rounded px-3 py-2 text-sm font-semibold text-white/80">
              {module.name}
            </div>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleWidgets.map((widget) => (
            <div
              key={widget.key}
              className={cn(
                "rounded-md border bg-white p-3",
                widgetValues[widget.key]?.size === "large" && "md:col-span-2",
                widgetValues[widget.key]?.size === "small" && "min-h-24"
              )}
            >
              <p className="font-semibold text-bcb-ink">{widget.name}</p>
              <p className="mt-1 text-xs text-slate-500">{widgetValues[widget.key]?.size ?? widget.defaultSize}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function VisibilityRow({
  title,
  subtitle,
  visible,
  sortOrder,
  onVisibleChange,
  onSortChange
}: {
  title: string;
  subtitle: string;
  visible: boolean;
  sortOrder: number;
  onVisibleChange: (visible: boolean) => void;
  onSortChange: (sortOrder: number) => void;
}) {
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-bcb-ink">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <ToggleButton visible={visible} onClick={() => onVisibleChange(!visible)} />
      </div>
      <OrderControl value={sortOrder} onChange={onSortChange} className="mt-3" />
    </div>
  );
}

function ToggleButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-bold",
        visible ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      {visible ? "Visible" : "Hidden"}
    </button>
  );
}

function OrderControl({ value, onChange, className }: { value: number; onChange: (value: number) => void; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button type="button" size="sm" variant="outline" onClick={() => onChange(Math.max(0, value - 10))}>
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        min={0}
        max={9999}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-9 w-24"
        aria-label="Sort order"
      />
      <Button type="button" size="sm" variant="outline" onClick={() => onChange(value + 10)}>
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  );
}

function StateBadge({ state }: { state: "inherited" | "overridden" | "hidden" }) {
  return (
    <span
      className={cn(
        "mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-bold",
        state === "inherited" && "bg-slate-200 text-slate-700",
        state === "overridden" && "bg-emerald-100 text-emerald-800",
        state === "hidden" && "bg-red-100 text-red-800"
      )}
    >
      {state === "inherited" ? "Inherited from role" : state === "overridden" ? "Overridden for user" : "Explicitly hidden"}
    </span>
  );
}

function completeRoleModules(data: PortalConfigurationAdminData, values: Record<string, PortalVisibilityValue>) {
  return Object.fromEntries(
    data.modules.map((module) => [
      module.key,
      values[module.key] ?? {
        isVisible: false,
        sortOrder: module.sortOrder
      }
    ])
  ) as Record<string, PortalVisibilityValue>;
}

function completeRoleWidgets(data: PortalConfigurationAdminData, values: Record<string, WidgetVisibilityValue>) {
  return Object.fromEntries(
    data.widgets.map((widget) => [
      widget.key,
      values[widget.key] ?? {
        isVisible: false,
        sortOrder: widget.sortOrder,
        size: widget.defaultSize
      }
    ])
  ) as Record<string, WidgetVisibilityValue>;
}

function setOwnerValue<T extends Record<string, Record<string, unknown>>, V>(current: T, owner: string, key: string, value: V) {
  return {
    ...current,
    [owner]: {
      ...(current[owner] ?? {}),
      [key]: value
    }
  };
}

function clearOwner<T extends Record<string, unknown>>(current: T, owner: string) {
  const next = { ...current };
  delete next[owner];
  return next;
}

async function responseMessage(response: Response, success: string) {
  if (response.ok) return { type: "success" as const, text: success };
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return { type: "error" as const, text: body?.error ?? "Unable to save the portal configuration." };
}
