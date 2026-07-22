import { useState } from "react";
import {
  Shield, Search, Inbox, User, Settings as SettingsIcon, Bell, Trash2,
} from "lucide-react";
import {
  Button, Input, PasswordInput, SearchInput, Textarea, Select, Checkbox, Radio,
  Switch, Card, Badge, Alert, Modal, Drawer, Tooltip, Dropdown, Avatar,
  LinearProgress, CircularProgress, StepProgress, Spinner, Skeleton, EmptyState,
  Pagination, Table, Tabs, Breadcrumb, Accordion,
} from "@/components/ui";
import { useModal } from "@/components/ui";
import ThemeToggle from "@/components/Common/ThemeToggle";
import "./ComponentLibrary.css";

const Section = ({ title, children, desc }) => (
  <section className="cl-section">
    <div className="cl-section__head">
      <h2>{title}</h2>
      {desc && <p>{desc}</p>}
    </div>
    <div className="cl-section__body">{children}</div>
  </section>
);

const fields = [
  { value: "critical", label: "Critical", group: "Severity" },
  { value: "high", label: "High", group: "Severity" },
  { value: "github", label: "GitHub Scanner", icon: <Shield size={14} />, group: "Tools" },
  { value: "quiz", label: "Quiz", icon: <Bell size={14} />, group: "Tools" },
];

const tableCols = [
  { key: "name", header: "Name", sortable: true },
  { key: "role", header: "Role", sortable: true },
  { key: "score", header: "Score", sortable: true, align: "right" },
];
const tableRows = [
  { id: 1, name: "Alice", role: "Admin", score: 92 },
  { id: 2, name: "Bob", role: "User", score: 78 },
  { id: 3, name: "Carol", role: "Analyst", score: 85 },
  { id: 4, name: "Dave", role: "User", score: 64 },
];

export default function ComponentLibrary() {
  const [pw, setPw] = useState("Abcd123!");
  const [sel, setSel] = useState("");
  const [dd, setDd] = useState("");
  const [tab, setTab] = useState("overview");
  const [page, setPage] = useState(1);
  const modal = useModal();

  return (
    <div className="cl-page">
      <header className="cl-header">
        <div>
          <h1>CyberShield UI Library</h1>
          <p>Internal design reference — every reusable component lives here.</p>
        </div>
        <ThemeToggle />
      </header>

      <Section title="Buttons" desc="8 variants × 3 sizes, loading / disabled / icon-only.">
        <div className="cl-row">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="cl-row">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button iconOnly variant="danger" aria-label="Delete"><Trash2 size={16} /></Button>
          <Button leftIcon={<Shield size={16} />}>With Icon</Button>
        </div>
      </Section>

      <Section title="Forms" desc="Inputs, password, search, textarea, select, checkbox, radio, switch.">
        <div className="cl-grid">
          <Input label="Email" placeholder="you@cybershield.io" required />
          <Input label="With error" error="Invalid email format" defaultValue="nope" />
          <PasswordInput label="Password" value={pw} onChange={(e) => setPw(e.target.value)} showStrength />
          <SearchInput placeholder="Search scans..." ctrlK />
          <Textarea label="Notes" placeholder="Add context..." />
          <Select label="Severity" placeholder="Choose..." options={fields} value={sel} onChange={(e) => setSel(e.target.value)} />
        </div>
        <div className="cl-row" style={{ marginTop: 16 }}>
          <Checkbox label="Remember me" defaultChecked />
          <Radio label="Option A" name="r" defaultChecked />
          <Radio label="Option B" name="r" />
          <Switch label="Notifications" defaultChecked />
        </div>
      </Section>

      <Section title="Cards" desc="Compound Card with Header / Content / Footer + variants.">
        <div className="cl-cards">
          <Card variant="default">
            <Card.Header title="Default Card" subtitle="Standard surface" icon={<Shield size={18} />} />
            <Card.Content>Body content goes here. Hover to lift.</Card.Content>
          </Card>
          <Card variant="glass">
            <Card.Header title="Glass" />
            <Card.Content>Blurred surface for floating panels.</Card.Content>
          </Card>
          <Card variant="gradient">
            <Card.Header title="Gradient" />
            <Card.Content>Accent gradient for hero CTAs.</Card.Content>
          </Card>
          <Card variant="outlined">
            <Card.Header title="Outlined" />
            <Card.Content>Transparent with a strong border.</Card.Content>
          </Card>
        </div>
      </Section>

      <Section title="Badges & Alerts">
        <div className="cl-row">
          <Badge variant="success" dot>Resolved</Badge>
          <Badge variant="danger" dot>Critical</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
        </div>
        <div className="cl-stack">
          <Alert type="success" title="Scan complete">No critical vulnerabilities found.</Alert>
          <Alert type="error" title="Failed" dismissible>Could not reach the repository.</Alert>
          <Alert type="warning" title="Caution">3 dependencies are outdated.</Alert>
          <Alert type="info" title="Heads up">A new quiz is available.</Alert>
        </div>
      </Section>

      <Section title="Modal & Drawer" desc="ESC + overlay-click to close; animated.">
        <div className="cl-row">
          <Button onClick={modal.open}>Open Modal</Button>
          <DrawerButton />
        </div>
        <Modal open={modal.isOpen} onClose={modal.close} title="Delete Report" footer={
          <>
            <Button variant="ghost" onClick={modal.close}>Cancel</Button>
            <Button variant="danger" onClick={modal.close}>Delete</Button>
          </>
        }>
          <p>Are you sure you want to permanently delete this security report? This action cannot be undone.</p>
        </Modal>
      </Section>

      <Section title="Dropdown & Tooltip">
        <div className="cl-row">
          <div style={{ width: 240 }}>
            <Dropdown options={fields} value={dd} onChange={setDd} placeholder="Pick a tool" searchable />
          </div>
          <Tooltip content="Helpful hint" placement="top">
            <Button variant="outline">Hover me</Button>
          </Tooltip>
        </div>
      </Section>

      <Section title="Avatar">
        <div className="cl-row">
          <Avatar name="Alice Doe" status="online" />
          <Avatar name="Bob Smith" status="busy" badge="3" />
          <Avatar src="https://i.pravatar.cc/100?img=12" status="offline" />
          <Avatar name="Cy Shield" size="xl" />
        </div>
      </Section>

      <Section title="Progress">
        <div className="cl-progress">
          <LinearProgress value={72} showLabel label="Scan progress" />
          <LinearProgress value={40} variant="warning" />
          <LinearProgress value={90} variant="success" />
          <CircularProgress value={68} size={90} />
          <CircularProgress value={100} variant="success" size={90}><Shield size={20} /></CircularProgress>
        </div>
        <StepProgress steps={["Connect", "Scan", "Report", "Done"]} current={2} />
      </Section>

      <Section title="Spinner & Skeleton">
        <div className="cl-row">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <Skeleton variant="circle" width={48} height={48} />
          <Skeleton width={180} height={16} />
        </div>
        <div className="cl-cards">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </Section>

      <Section title="Empty State & Pagination">
        <EmptyState
          icon={<Inbox size={28} />}
          title="No GitHub scans yet"
          description="Run your first scan to start tracking vulnerabilities."
          action={<Button>Start Scan</Button>}
        />
        <div style={{ marginTop: 24 }}>
          <Pagination page={page} totalPages={12} onChange={setPage} />
        </div>
      </Section>

      <Section title="Table" desc="Sortable columns, sticky header, clickable rows.">
        <Table columns={tableCols} rows={tableRows} onRowClick={() => {}} />
      </Section>

      <Section title="Tabs, Breadcrumb, Accordion">
        <Tabs
          tabs={[
            { value: "overview", label: "Overview", icon: <Shield size={14} /> },
            { value: "activity", label: "Activity", badge: 3 },
            { value: "settings", label: "Settings", icon: <SettingsIcon size={14} /> },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div style={{ marginTop: 16 }}>
          <Breadcrumb items={[{ label: "Dashboard", to: "/" }, { label: "Scanner" }, { label: "Scan Details" }]} />
        </div>
        <div style={{ marginTop: 16 }}>
          <Accordion
            items={[
              { title: "What is OWASP?", content: "OWASP is a nonprofit focused on software security." },
              { title: "How does scanning work?", content: "We analyse dependencies and code patterns for known risks." },
              { title: "Is my data private?", content: "Scans run in your workspace and are never shared." },
            ]}
            defaultOpen={0}
          />
        </div>
      </Section>
    </div>
  );
}

function DrawerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Drawer</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Filters" footer={<Button onClick={() => setOpen(false)}>Apply</Button>}>
        <p>Filter content goes here.</p>
      </Drawer>
    </>
  );
}
