import { cn } from "../support/cn"

interface RichTextViewerProps {
  content: string
  className?: string
  dense?: boolean
  onLinkClick?: (href: string) => void
}

// Simple markdown renderer without external dependencies
const parseMarkdown = (content: string): string => {
  return content
    .replace(/^# (.*$)/gm, '<h1 class="mb-3 text-xl font-semibold uppercase tracking-[0.08em]" style="color: var(--ui-text)">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="mb-2 mt-4 text-lg font-semibold uppercase tracking-[0.08em]" style="color: var(--ui-text)">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="mb-2 mt-3 text-base font-semibold uppercase tracking-[0.06em]" style="color: var(--ui-text)">$1</h3>')
    .replace(/^> (.*$)/gm, '<blockquote class="mb-4 border-l-2 pl-3 text-sm" style="border-color: var(--ui-border-strong); color: var(--ui-text-muted)">$1</blockquote>')
    .replace(/^\- (.*$)/gm, '<li class="mb-1" style="color: var(--ui-text)">$1</li>')
    .replace(/`([^`]+)`/g, '<code class="rounded-none border px-1 text-xs" style="background-color: rgba(12,17,29,0.04); border-color: var(--ui-border); font-family: var(--ui-font-mono); color: var(--ui-text)">$1</code>')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="mb-3 overflow-auto border p-3 text-xs" style="background-color: rgba(12,17,29,0.06); border-color: var(--ui-border); font-family: var(--ui-font-mono); color: var(--ui-text)"><code>$2</code></pre>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="underline decoration-[rgba(11,99,255,0.4)] decoration-2 underline-offset-2" style="color: #0b63ff" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\n\n/g, '</p><p class="mb-2 leading-relaxed text-sm last:mb-0" style="color: var(--ui-text)">')
    .replace(/\n/g, '<br>')
}

// Temporary placeholder - we'll restore react-markdown later
const components_unused = {
  h1: ({ children }) => (
    <h1 className="mb-3 text-xl font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ui-text)" }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-lg font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ui-text)" }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-base font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ui-text)" }}>{children}</h3>
  ),
  p: ({ children }) => <p className="mb-2 leading-relaxed text-sm last:mb-0" style={{ color: "var(--ui-text)" }}>{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc pl-5 text-sm leading-relaxed" style={{ color: "var(--ui-text)" }}>{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 text-sm leading-relaxed" style={{ color: "var(--ui-text)" }}>{children}</ol>,
  li: ({ children }) => <li className="mb-1" style={{ color: "var(--ui-text)" }}>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote
      className="mb-4 border-l-2 pl-3 text-sm"
      style={{
        borderColor: "var(--ui-border-strong)",
        color: "var(--ui-text-muted)"
      }}
    >
      {children}
    </blockquote>
  ),
  code: ({ inline, children }) => {
    if (inline) {
      return (
        <code
          className="rounded-none border px-1 text-xs"
          style={{
            backgroundColor: "rgba(12,17,29,0.04)",
            borderColor: "var(--ui-border)",
            fontFamily: "var(--ui-font-mono)",
            color: "var(--ui-text)"
          }}
        >
          {children}
        </code>
      )
    }

    return (
      <pre
        className="mb-3 overflow-auto border p-3 text-xs"
        style={{
          backgroundColor: "rgba(12,17,29,0.06)",
          borderColor: "var(--ui-border)",
          fontFamily: "var(--ui-font-mono)",
          color: "var(--ui-text)"
        }}
      >
        <code>{children}</code>
      </pre>
    )
  },
  a: ({ children, href }) => (
    <a
      href={href}
      className="underline decoration-[rgba(11,99,255,0.4)] decoration-2 underline-offset-2"
      style={{ color: "#0b63ff" }}
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  )
}

export const RichTextViewer = ({
  content,
  className,
  dense = false,
  onLinkClick
}: RichTextViewerProps) => {
  const processedContent = parseMarkdown(content)
  
  return (
    <div
      className={cn("rich-text", dense ? "space-y-2" : "space-y-3", className)}
      style={{
        color: "var(--ui-text)",
        fontFamily: "var(--ui-font-base)"
      }}
      onClick={(event) => {
        const target = event.target as HTMLAnchorElement
        if (target.tagName === "A" && target.href) {
          onLinkClick?.(target.href)
        }
      }}
      dangerouslySetInnerHTML={{ 
        __html: `<p class="mb-2 leading-relaxed text-sm last:mb-0" style="color: var(--ui-text)">${processedContent}</p>` 
      }}
    />
  )
}
