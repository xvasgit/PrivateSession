import { requireAdmin } from "@/lib/auth/session.server";
import { getPrisma } from "@/lib/prisma";
import { AccountForm } from "@/components/auth/account-form";
import { PageHeading } from "@/components/ui/page-heading";
export default async function AccountsPage() {
  await requireAdmin();
  const users = await getPrisma().user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
  return (
    <>
      <PageHeading
        eyebrow="Administration"
        title="Manage accounts"
        description="Create members and control account access. Members’ private meetings are not available here."
      />
      <h2 className="mt-8 text-xl font-bold">Create member</h2>
      <AccountForm operation="createMember" />
      <h2 className="mt-8 text-xl font-bold">Accounts</h2>
      <ul className="mt-4 space-y-4">
        {users.map((user) => (
          <li
            key={user.id}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <h3 className="break-words font-semibold">{user.name}</h3>
            <p className="break-words">
              {user.email} · {user.role} · {user.status}
            </p>
            {user.role === "MEMBER" && (
              <AccountForm
                operation="status"
                userId={user.id}
                status={user.status}
              />
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
