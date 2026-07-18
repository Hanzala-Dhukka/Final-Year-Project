import {
  Card, CardContent, CardHeader, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TableSortLabel, Chip,
} from "@mui/material";
import { useState } from "react";

const RISK_COLORS = {
  Critical: "#DC2626", High: "#F97316", Medium: "#F59E0B", Low: "#059669", Unknown: "#64748B",
};

// Sortable project comparison table (Module 6.4 Step 10).
export default function ProjectComparison({ rows = [] }) {
  const [orderBy, setOrderBy] = useState("security_score");
  const handleSort = (col) => setOrderBy(col);

  const sorted = [...rows].sort((a, b) => {
    if (orderBy === "risk_level") {
      const rank = { Critical: 0, High: 1, Medium: 2, Low: 3, Unknown: 4 };
      return rank[a.risk_level] - rank[b.risk_level];
    }
    const av = a[orderBy] ?? -1;
    const bv = b[orderBy] ?? -1;
    return bv - av;
  });

  const columns = [
    { id: "name", label: "Project", numeric: false },
    { id: "security_score", label: "Security", numeric: true },
    { id: "compliance_score", label: "Compliance", numeric: true },
    { id: "risk_level", label: "Risk", numeric: false },
    { id: "open_vulnerabilities", label: "Open Vulns", numeric: true },
    { id: "last_scan", label: "Last Scan", numeric: false },
  ];

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="Project Comparison" subheader="Sortable comparison across projects" />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((c) => (
                  <TableCell key={c.id}>
                    <TableSortLabel
                      active={orderBy === c.id}
                      direction="desc"
                      onClick={() => handleSort(c.id)}
                    >
                      {c.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                    No projects found.
                  </TableCell>
                </TableRow>
              )}
              {sorted.map((r) => (
                <TableRow key={r.project_id} hover>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.security_score}%</TableCell>
                  <TableCell>{r.compliance_score}%</TableCell>
                  <TableCell>
                    <Chip
                      label={r.risk_level}
                      size="small"
                      sx={{ backgroundColor: RISK_COLORS[r.risk_level], color: "#fff" }}
                    />
                  </TableCell>
                  <TableCell>{r.open_vulnerabilities}</TableCell>
                  <TableCell>{r.last_scan || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
