import { Sidebar } from "@/components/Sidebar"
import { MobileNav } from "@/components/MobileNav"
import { HomeDiscover } from "@/components/HomeDiscover"

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <HomeDiscover />
      </div>
    </div>
  )
}
