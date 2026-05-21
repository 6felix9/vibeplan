import { Sidebar } from "@/components/Sidebar"
import { MobileNav } from "@/components/MobileNav"
import { HomeDiscover } from "@/components/HomeDiscover"
import { getDeals } from "@/lib/deals"

export default async function Home() {
  const initialActivities = await getDeals();
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <HomeDiscover initialActivities={initialActivities} />
      </div>
    </div>
  )
}
