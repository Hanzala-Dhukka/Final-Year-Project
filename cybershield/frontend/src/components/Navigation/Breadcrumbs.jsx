import { useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { navIndex } from "./navConfig";
import Breadcrumb from "../ui/Breadcrumb";

/**
 * Auto-generated breadcrumbs from the current route.
 * Top-level pages show "Home", nested paths append a "Details" segment.
 */
export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const base = navIndex[pathname];

  if (base) {
    return <Breadcrumb items={[{ label: "Home", to: "/dashboard" }, { label: base.breadcrumb }]} />;
  }

  // Nested route (e.g. /projects/:id). Derive the parent section.
  const parentPath = "/" + pathname.split("/").filter(Boolean)[0];
  const parent = navIndex[parentPath];

  if (parent) {
    return (
      <Breadcrumb
        items={[
          { label: "Home", to: "/dashboard" },
          { label: parent.breadcrumb, to: parentPath },
          { label: "Details" },
        ]}
      />
    );
  }

  return (
    <Breadcrumb
      items={[{ label: "Home", to: "/dashboard" }, { label: pathname.split("/").filter(Boolean)[0] || "Page" }]}
    />
  );
}
