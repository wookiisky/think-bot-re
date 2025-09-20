import type { ReactNode } from "react"

interface SidebarContainerProps {
  children: ReactNode
}

export const SidebarContainer = ({ children }: SidebarContainerProps) => {
  return <div className="bg-white shadow-lg min-h-full">{children}</div>
}
