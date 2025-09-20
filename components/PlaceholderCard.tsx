import type { ReactNode } from "react"

interface PlaceholderCardProps {
  title: string
  children: ReactNode
}

export const PlaceholderCard = ({ title, children }: PlaceholderCardProps) => {
  return (
    <section className="border rounded-md p-4 mb-4">
      <h2 className="font-semibold mb-2">{title}</h2>
      <div>{children}</div>
    </section>
  )
}
