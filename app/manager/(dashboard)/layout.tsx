import { auth } from "@/auth"
import { redirect } from "next/navigation"
import BaseView from "@/components/BaseView"

export default async function ManagerProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Intercept unauthorized access
  if (!session) {
    redirect("/manager")
  }

  return (
    <BaseView userEmail={session.user?.email}>
      {children}
    </BaseView>
  )
}