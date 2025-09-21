import { StrictMode, useMemo, useState } from "react"
import type { MouseEvent, ReactNode } from "react"
import { createRoot } from "react-dom/client"

// Import components one by one to isolate the problem
import { AppShell } from "../components/ui/layout/AppShell"
import { Surface, Panel } from "../components/ui/layout/Surface"
import { Stack, InlineStack } from "../components/ui/layout/Stack"
import { Typography } from "../components/ui/display/Typography"
import { Button } from "../components/ui/input/Button"
import { ToastProvider, useToast } from "../components/ui/feedback/Toast"
import { createUiLogger } from "../components/ui/support/logger"
import type { ThemeOverride } from "../components/ui/support/ThemeProvider"

// Temporarily import remaining components from index
import {
  SplitPane,
  ScrollableArea,
  ResponsiveGrid,
  Toolbar,
  Tabs,
  ListNavigator,
  RichTextViewer,
  Card,
  Badge,
  MediaPreview,
  Icon,
  IconButton,
  TextField,
  FloatingLabelTextField,
  Textarea,
  AutoResizeTextarea,
  FloatingLabelTextarea,
  Select,
  MultiSelect,
  FloatingLabelSelect,
  FloatingLabelMultiSelect,
  Switch,
  ButtonSelect,
  ButtonSwitch,
  SearchInput,
  Spinner,
  ProgressIndicator,
  StatusBadge,
  InlineAlert,
  Modal,
  MiniConfirmModal,
  Tooltip
} from "../components/ui"
import { TranslationProvider } from "../lib/i18n"

// Debug: Check createUiLogger
console.log("createUiLogger check:", typeof createUiLogger, createUiLogger)
const log = createUiLogger("[ui-demo]")

// Debug: Check all imported components for undefined
const imports = {
  AppShell, Surface, Panel, SplitPane, ScrollableArea, Stack, InlineStack,
  ResponsiveGrid, Toolbar, Tabs, ListNavigator, Typography, RichTextViewer,
  Card, Badge, MediaPreview, Icon, Button, TextField, FloatingLabelTextField,
  Textarea, AutoResizeTextarea, FloatingLabelTextarea, Select, MultiSelect,
  FloatingLabelSelect, FloatingLabelMultiSelect, Switch, ButtonSelect,
  ButtonSwitch, SearchInput, Spinner, ProgressIndicator, StatusBadge,
  InlineAlert, ToastProvider, useToast, Modal, MiniConfirmModal, Tooltip,
  createUiLogger
}

const undefinedComponents = Object.entries(imports).filter(([name, component]) => component === undefined)
if (undefinedComponents.length > 0) {
  console.error("❌ Undefined components:", undefinedComponents.map(([name]) => name))
  log.error("component/undefined", undefinedComponents.map(([name]) => name).join(", "))
} else {
  console.log("✅ All components properly imported")
}

const iconSource = new URL("../assets/icon.png", import.meta.url).href

interface SectionProps {
  id: string
  title: string
  description?: string
  children: ReactNode
}

const Section = ({ id, title, description, children }: SectionProps) => {
  return (
    <div id={id} className="scroll-mt-20">
      <Surface title={title} padding="lg">
        <Stack gap="md">
          {description ? <Typography variant="muted">{description}</Typography> : null}
          {children}
        </Stack>
      </Surface>
    </div>
  )
}

const DemoContent = () => {
  const { showToast } = useToast()

  const [activeSection, setActiveSection] = useState("layout")
  const [activeTab, setActiveTab] = useState("chat")
  const [verticalTab, setVerticalTab] = useState("overview")
  const [switchOn, setSwitchOn] = useState(true)
  const [buttonSwitchOn, setButtonSwitchOn] = useState(false)
  const [buttonOption, setButtonOption] = useState("readability")
  const [selectValue, setSelectValue] = useState("gemini")
  const [multiValues, setMultiValues] = useState<string[]>(["claude"])
  const [searchValue, setSearchValue] = useState("sync")
  const [urlValue, setUrlValue] = useState("https://example.com")
  const [promptValue, setPromptValue] = useState("")
  const [note, setNote] = useState("Start typing to see the textarea grow.")
  const [progress, setProgress] = useState(35)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmAnchor, setConfirmAnchor] = useState<DOMRect | undefined>(undefined)
  const [useAltTheme, setUseAltTheme] = useState(false)

  const theme = useMemo<ThemeOverride | undefined>(() => {
    if (!useAltTheme) {
      return undefined
    }

    return {
      name: "twilight",
      colors: {
        background: "#0c111d",
        surface: "#111827",
        surfaceStrong: "#1f2937",
        border: "#1f2a3d",
        borderStrong: "#2d3b53",
        text: "#f9fafb",
        textMuted: "#93a4c3",
        primary: "#60a5fa",
        primaryText: "#0c111d",
        secondary: "#f97316",
        secondaryText: "#0c111d",
        success: "#34d399",
        warning: "#f59e0b",
        danger: "#f87171",
        info: "#38bdf8"
      }
    }
  }, [useAltTheme])
  const sections = useMemo(
    () => [
      {
        id: "layout",
        title: "Layout",
        description: "Foundational containers for structuring Think Bot interfaces."
      },
      {
        id: "navigation",
        title: "Navigation",
        description: "Organize actions and routes across the extension."
      },
      {
        id: "display",
        title: "Display",
        description: "Consistent typography and content surfaces."
      },
      {
        id: "inputs",
        title: "Inputs",
        description: "Form controls and selectors for runtime configuration."
      },
      {
        id: "feedback",
        title: "Feedback",
        description: "System responses, alerts, and overlays."
      }
    ],
    []
  )

  const listNavigatorItems = useMemo(
    () =>
      sections.map((section, index) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        meta: `Section ${index + 1}`,
        statusLabel: index === 0 ? "Ready" : index === 2 ? "WIP" : undefined,
        statusTone: index === 2 ? "warning" : "success"
      })),
    [sections]
  )

  const horizontalTabs = useMemo(
    () => [
      { id: "chat", label: "Chat", state: "hasData", icon: <Icon name="forum" ariaHidden /> },
      { id: "summaries", label: "Summaries", state: "idle", icon: <Icon name="article" ariaHidden /> },
      { id: "actions", label: "Actions", state: "loading", icon: <Icon name="bolt" ariaHidden /> }
    ],
    []
  )

  const verticalTabs = useMemo(
    () => [
      { id: "overview", label: "Overview", icon: <Icon name="dashboard" ariaHidden /> },
      { id: "history", label: "History", icon: <Icon name="history" ariaHidden /> },
      { id: "settings", label: "Settings", icon: <Icon name="settings" ariaHidden /> }
    ],
    []
  )

  const navigatorSamples = useMemo(
    () => [
      {
        id: "convo-1",
        title: "Pricing breakdown",
        description: "LLM assisted explanation",
        meta: "Updated 2h ago",
        badgeLabel: "LLM",
        statusLabel: "Synced",
        statusTone: "success"
      },
      {
        id: "convo-2",
        title: "Product highlights",
        description: "Quick summary",
        meta: "Updated yesterday",
        badgeLabel: "Draft",
        statusLabel: "Pending",
        statusTone: "warning"
      },
      {
        id: "convo-3",
        title: "API migration",
        description: "Action items",
        meta: "Updated 4d ago",
        statusLabel: "Offline",
        statusTone: "danger"
      }
    ],
    []
  )

  const richContent = useMemo(
    () => `# Think Bot Rendering\n\n> Inline markdown rendering with code support.\n\n## Key Points\n- Low latency on-device actions\n- Unified search shortcuts\n- Consistent UI tokens\n\n### Sample Code\n\n\`\`\`ts\nconst message = "Hello Think Bot"\nconsole.log(message)\n\`\`\`\n\nVisit [docs](https://example.com) for details.`,
    []
  )

  const scrollItems = useMemo(() => Array.from({ length: 14 }, (_, index) => `Message ${index + 1}`), [])

  const cardItems = useMemo(
    () => [
      {
        id: "card-1",
        title: "Inline translation",
        description: "Translate current selection with one click."
      },
      {
        id: "card-2",
        title: "Conversation sync",
        description: "Sync threads across devices automatically."
      },
      {
        id: "card-3",
        title: "Custom prompts",
        description: "Craft reusable prompt templates for your team."
      },
      {
        id: "card-4",
        title: "Annotation mode",
        description: "Highlight extracted sections with keyboard shortcuts."
      }
    ],
    []
  )

  const providerOptions = useMemo(
    () => [
      { id: "readability", label: "Readability", icon: "article" },
      { id: "jina", label: "Jina", icon: "language" },
      { id: "hybrid", label: "Hybrid", icon: "hub" }
    ],
    []
  )

  const selectOptions = useMemo(
    () => [
      { value: "gemini", label: "Google Gemini" },
      { value: "claude", label: "Anthropic Claude" },
      { value: "gpt4o", label: "OpenAI GPT-4o" },
      { value: "bedrock", label: "AWS Bedrock" }
    ],
    []
  )
  const handleSectionSelect = (id: string) => {
    setActiveSection(id)
    log.info("section/select", id)
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 0)
  }

  const handleThemeToggle = () => {
    setUseAltTheme((previous) => {
      const next = !previous
      log.info("theme/toggle", { next })
      return next
    })
  }

  const handleShowToast = () => {
    log.info("toast/show")
    showToast({
      title: "Settings saved",
      description: "Conversation sync triggered.",
      tone: "success",
      duration: 3200
    })
  }

  const handleTabSelect = (id: string) => {
    setActiveTab(id)
    log.info("tabs/horizontal", id)
  }

  const handleVerticalSelect = (id: string) => {
    setVerticalTab(id)
    log.info("tabs/vertical", id)
  }

  const handleMiniOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setConfirmAnchor(event.currentTarget.getBoundingClientRect())
    setIsConfirmOpen(true)
    log.info("confirm/open")
  }

  const handleConfirm = () => {
    setIsConfirmOpen(false)
    log.info("confirm/accept")
    showToast({ title: "Action confirmed", tone: "info", duration: 2400 })
  }

  const handleCancel = () => {
    setIsConfirmOpen(false)
    log.info("confirm/cancel")
  }

  const handleProgressAdvance = () => {
    setProgress((value) => {
      const next = value >= 100 ? 0 : value + 15
      log.info("progress/update", next)
      return next
    })
  }

  const handleSplitResize = (nextSize: number) => {
    log.info("split/resize", nextSize)
  }
  return (
    <AppShell
      theme={theme}
      header={
        <div className="flex items-center justify-between">
          <span style={{ color: "var(--ui-text)" }}>Think Bot UI Component Showcase</span>
          <InlineStack gap="sm">
            <Button variant="outline" tone="neutral" size="sm" onClick={handleThemeToggle}>
              {useAltTheme ? "Light Theme" : "Dark Theme"}
            </Button>
            <Button size="sm" onClick={handleShowToast}>
              Trigger Toast
            </Button>
          </InlineStack>
        </div>
      }
      sidebar={
        <ListNavigator
          items={listNavigatorItems}
          activeId={activeSection}
          onSelect={handleSectionSelect}
          searchable={false}
          footer={<Typography variant="caption">Jump between sections</Typography>}
        />
      }
      footer={<Typography variant="caption">Think Bot RE · UI toolkit demo</Typography>}
    >
      <Stack gap="lg">
        <Section id="layout" title="Layout" description="Foundational primitives for arranging extension views.">
          <Stack gap="md">
            <InlineStack gap="md" align="stretch">
              <Panel title="Surface" subdued>
                <Typography variant="body">
                  Standard content container with consistent spacing and straight edges.
                </Typography>
              </Panel>
              <Panel title="Raised" elevation="raised">
                <Typography variant="body">
                  Raised surfaces add subtle depth for focus areas without breaking the flat language.
                </Typography>
              </Panel>
            </InlineStack>
            <SplitPane
              primary={
                <Stack gap="sm">
                  <Typography variant="subtitle">Reading Pane</Typography>
                  <Typography variant="body">
                    Drag the handle to adjust the preview and detail panes. Resize logs the new width.
                  </Typography>
                </Stack>
              }
              secondary={
                <Stack gap="sm">
                  <Typography variant="subtitle">Inspector</Typography>
                  <Typography variant="body">
                    Detail view for selected excerpt or conversation metadata.
                  </Typography>
                </Stack>
              }
              onResize={handleSplitResize}
              minPrimarySize={220}
              minSecondarySize={220}
            />
            <ScrollableArea
              height={220}
              stickyHeader="Activity log"
              stickyFooter="Scroll to review older events"
              onReachTop={() => log.info("scroll/top")}
              onReachBottom={() => log.info("scroll/bottom")}
            >
              {scrollItems.map((item) => (
                <Typography key={item} variant="body">
                  {item}
                </Typography>
              ))}
            </ScrollableArea>
            <ResponsiveGrid>
              {cardItems.map((card) => (
                <Card key={card.id} title={card.title} description={card.description}>
                  <InlineStack gap="sm">
                    <Badge tone="primary" size="sm">
                      Feature
                    </Badge>
                    <Badge tone="info" size="sm">
                      Stable
                    </Badge>
                  </InlineStack>
                </Card>
              ))}
            </ResponsiveGrid>
          </Stack>
        </Section>
        <Section id="navigation" title="Navigation" description="Switch between tasks and organize deep links.">
          <Stack gap="md">
            <Toolbar
              title="Content Controls"
              description="Page-level actions"
              trailing={
                <InlineStack gap="sm">
                  <IconButton
                    label="Refresh content"
                    icon={<Icon name="refresh" ariaHidden />}
                    onClick={() => log.info("toolbar/refresh")}
                  />
                  <IconButton
                    label="Open settings"
                    icon={<Icon name="settings" ariaHidden />}
                    onClick={() => log.info("toolbar/settings")}
                  />
                </InlineStack>
              }
            />
            <Tabs items={horizontalTabs} activeId={activeTab} onSelect={handleTabSelect} />
            <InlineStack gap="md" align="start">
              <div className="w-60">
                <Tabs orientation="vertical" items={verticalTabs} activeId={verticalTab} onSelect={handleVerticalSelect} />
              </div>
              <div className="flex-1">
                <ListNavigator
                  items={navigatorSamples}
                  activeId="convo-1"
                  onSelect={(id) => log.info("navigator/select", id)}
                  searchPlaceholder="Filter conversations"
                />
              </div>
            </InlineStack>
          </Stack>
        </Section>
        <Section id="display" title="Display" description="Typography, cards, and helpful badges.">
          <Stack gap="md">
            <Stack gap="xs">
              <Typography variant="display">Think Bot</Typography>
              <Typography variant="heading">Content Summaries</Typography>
              <Typography variant="title">Guided Insights</Typography>
              <Typography variant="subtitle">Secondary descriptor</Typography>
              <Typography variant="body">
                Provide consistent type hierarchy across side panel, options, and conversations pages.
              </Typography>
              <Typography variant="muted">Muted text for supplementary hints.</Typography>
              <Typography variant="caption">Caption label</Typography>
            </Stack>
            <RichTextViewer content={richContent} />
            <InlineStack gap="md" align="start">
              <Card title="Use Cards">
                <Typography variant="body">
                  Cards are ideal for option groups, provider summaries, or offline states.
                </Typography>
              </Card>
              <Panel title="Badges">
                <InlineStack gap="sm">
                  <Badge tone="primary">Primary</Badge>
                  <Badge tone="info">Info</Badge>
                  <Badge tone="success">Success</Badge>
                  <Badge tone="warning">Warning</Badge>
                  <Badge tone="danger">Danger</Badge>
                </InlineStack>
              </Panel>
            </InlineStack>
            <InlineStack gap="md" align="center">
              <MediaPreview src={iconSource} alt="Think Bot logo" overlay="Extension icon" onRemove={() => log.info("media/remove")} />
              <InlineStack gap="sm" align="center">
                <Icon name="bolt" size="lg" ariaHidden />
                <Icon name="insights" size="lg" ariaHidden />
                <Icon name="bookmark" size="lg" ariaHidden />
              </InlineStack>
            </InlineStack>
          </Stack>
        </Section>
        <Section id="inputs" title="Inputs" description="Forms, selectors, and quick actions.">
          <Stack gap="lg">
            <InlineStack gap="md" align="start">
              <Stack gap="sm">
                <TextField
                  label="Target URL"
                  value={urlValue}
                  onChange={(event) => setUrlValue(event.target.value)}
                  helperText="Used when pushing page context to LLMs"
                  prefix="https://"
                />
                <FloatingLabelTextField
                  floatingLabel="Prompt name"
                  value={promptValue}
                  onChange={(event) => setPromptValue(event.target.value)}
                  helperText="Displayed in quick actions"
                />
              </Stack>
              <Stack gap="sm">
                <Textarea
                  label="Description"
                  helperText="Explain the automation"
                  showCounter
                  maxLength={200}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <AutoResizeTextarea
                  label="Notes"
                  helperText="Try typing multiple lines"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <FloatingLabelTextarea
                  label="Inline instruction"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </Stack>
            </InlineStack>
            <InlineStack gap="md" align="start">
              <Select
                label="Primary model"
                options={selectOptions}
                value={selectValue}
                onValueChange={setSelectValue}
              />
              <FloatingLabelSelect
                label="Model (floating)"
                options={selectOptions}
                value={selectValue}
                onChange={(event) => setSelectValue(event.target.value)}
              />
              <MultiSelect
                label="Fallback models"
                options={selectOptions}
                values={multiValues}
                onValuesChange={setMultiValues}
              />
              <FloatingLabelMultiSelect
                label="Fallback (floating)"
                options={selectOptions}
                value={multiValues}
                onChange={(event) => {
                  const selected = Array.from(event.target.selectedOptions).map((option) => option.value)
                  setMultiValues(selected)
                }}
              />
            </InlineStack>
            <InlineStack gap="md" align="center">
              <Switch
                label="Include page context"
                description="Attach extracted content to next LLM call"
                checked={switchOn}
                onCheckedChange={setSwitchOn}
              />
              <ButtonSwitch
                checked={buttonSwitchOn}
                onToggle={setButtonSwitchOn}
                label="Auto retry"
                tooltipOn="Disable auto retry"
                tooltipOff="Enable auto retry"
              />
              <ButtonSelect options={providerOptions} selectedId={buttonOption} onSelect={setButtonOption} />
              <SearchInput
                label="Search prompts"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onClear={() => setSearchValue("")}
                helperText="Supports keyboard shortcut"
                shortcutHint="Ctrl K"
              />
            </InlineStack>
            <InlineStack gap="sm" align="center">
              <Button onClick={() => log.info("button/primary")}>Primary</Button>
              <Button variant="outline" tone="secondary" onClick={() => log.info("button/secondary")}>Secondary</Button>
              <Button tone="danger" onClick={() => log.info("button/danger")}>Danger</Button>
              <Button variant="ghost" tone="neutral" size="sm" onClick={() => log.info("icon-button/copy")}>Copy</Button>
              <IconButton
                variant="ghost"
                tone="neutral"
                size="sm"
                label="Copy"
                icon={<Icon name="content_copy" ariaHidden />}
                onClick={() => log.info("icon-button/copy")}
              />
            </InlineStack>
          </Stack>
        </Section>
        <Section id="feedback" title="Feedback" description="Communicate system status and guide the user.">
          <Stack gap="md">
            <InlineStack gap="md" align="center">
              <Spinner label="Loading" />
              <Spinner tone="secondary" size="lg" />
              <Spinner tone="danger" size="sm" />
              <ProgressIndicator value={progress} label="Sync progress" />
              <ProgressIndicator indeterminate tone="secondary" label="Background job" />
              <Button variant="outline" tone="neutral" size="sm" onClick={handleProgressAdvance}>
                Advance
              </Button>
            </InlineStack>
            <InlineStack gap="sm" align="center">
              <StatusBadge tone="success" label="Saved" />
              <StatusBadge tone="info" label="Synced" />
              <StatusBadge tone="warning" label="Pending" />
              <StatusBadge tone="danger" label="Error" />
            </InlineStack>
            <Stack gap="sm">
              <InlineAlert
                title="Extraction paused"
                description="Automatic extraction is temporarily paused until the page stabilizes."
                tone="info"
                action={<Button variant="ghost" tone="neutral" size="sm" onClick={() => log.info("alert/resume")}>Resume</Button>}
              />
              <InlineAlert
                title="API key missing"
                description="Add a valid provider key in the options page before continuing."
                tone="danger"
              />
            </Stack>
            <InlineStack gap="md" align="center">
              <Tooltip content="Copies the current conversation" placement="top">
                <Button variant="ghost" tone="neutral" size="sm" onClick={() => log.info("tooltip/copy")}>Copy</Button>
              </Tooltip>
              <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
              <Button variant="outline" tone="neutral" onClick={handleMiniOpen}>
                Quick Confirm
              </Button>
            </InlineStack>
          </Stack>
        </Section>
      </Stack>
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modal example"
        description="Use modals sparingly for blocking confirmations."
        footer={
          <InlineStack gap="sm" justify="end">
            <Button variant="ghost" tone="neutral" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsModalOpen(false)
                showToast({ title: "Modal saved", tone: "success", duration: 2000 })
              }}
            >
              Save
            </Button>
          </InlineStack>
        }
      >
        <Typography variant="body">
          This overlay locks focus and supports keyboard dismissal. It relies on straight edges and neutral shadows to stay on brand.
        </Typography>
      </Modal>
      <MiniConfirmModal
        open={isConfirmOpen}
        anchorRect={confirmAnchor}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        message="Remove this pinned prompt?"
        confirmLabel="Remove"
        cancelLabel="Keep"
      />
    </AppShell>
  )
}

const UIDemo = () => {
  return (
    <ToastProvider>
      <DemoContent />
    </ToastProvider>
  )
}

const mountTab = () => {
  log.info("mount")
  const rootElement = document.createElement("div")
  document.body.appendChild(rootElement)
  const root = createRoot(rootElement)

  root.render(
    <StrictMode>
      <TranslationProvider language="en">
        <UIDemo />
      </TranslationProvider>
    </StrictMode>
  )
}

mountTab()
