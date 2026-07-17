import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Stack,
} from "@mui/material";
import { severityColor, severityBg } from "./severity";

// Interactive Attack Surface Diagram (Module 4.4 — Step 6).
// Implemented with MUI + SVG (React Flow is optional). Clicking a node
// reveals its risk, description and recommendations.
const NODE_W = 150;
const NODE_H = 56;
const GAP_Y = 78;

export default function AttackSurfaceDiagram({ nodes = [] }) {
  const [selected, setSelected] = useState(null);

  if (!nodes.length) {
    return (
      <Card>
        <CardHeader title="Attack Surface" />
        <CardContent>
          <Typography color="text.secondary">No attack surface data.</Typography>
        </CardContent>
      </Card>
    );
  }

  const height = nodes.length * GAP_Y + 40;
  const centerX = 110;

  return (
    <Card>
      <CardHeader
        title="Attack Surface"
        subheader="Click a node to inspect risks"
      />
      <CardContent>
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <svg
            width={centerX + NODE_W + 20}
            height={height}
            style={{ flexShrink: 0 }}
          >
            {nodes.map((n, i) => {
              const y = 20 + i * GAP_Y;
              const nextY = 20 + (i + 1) * GAP_Y;
              return (
                <g key={n.id}>
                  {i < nodes.length - 1 && (
                    <line
                      x1={centerX + NODE_W / 2}
                      y1={y + NODE_H}
                      x2={centerX + NODE_W / 2}
                      y2={nextY}
                      stroke="rgba(148,163,184,0.5)"
                      strokeWidth="2"
                    />
                  )}
                  <motion.g
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelected(n)}
                    style={{ cursor: "pointer" }}
                  >
                    <rect
                      x={centerX}
                      y={y}
                      width={NODE_W}
                      height={NODE_H}
                      rx={10}
                      fill={
                        selected && selected.id === n.id
                          ? severityBg(n.risk)
                          : "rgba(30,41,59,0.6)"
                      }
                      stroke={severityColor(n.risk)}
                      strokeWidth="2"
                    />
                    <text
                      x={centerX + NODE_W / 2}
                      y={y + 22}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="13"
                      fontWeight="600"
                    >
                      {n.label}
                    </text>
                    <text
                      x={centerX + NODE_W / 2}
                      y={y + 42}
                      textAnchor="middle"
                      fill={severityColor(n.risk)}
                      fontSize="11"
                    >
                      {n.risk}
                    </text>
                  </motion.g>
                </g>
              );
            })}
          </svg>

          <Box sx={{ flex: 1 }}>
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Typography variant="h6">{selected.label}</Typography>
                  <Stack direction="row" spacing={1} sx={{ my: 1 }}>
                    <Chip label={selected.type} size="small" variant="outlined" />
                    <Chip
                      label={selected.risk}
                      size="small"
                      sx={{
                        bgcolor: severityBg(selected.risk),
                        color: severityColor(selected.risk),
                        fontWeight: 700,
                      }}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {selected.description}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    Recommendations
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {(selected.recommendations || []).map((r, i) => (
                      <li key={i}>
                        <Typography variant="body2">{r}</Typography>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : (
                <Typography color="text.secondary">
                  Select a node to view its risk profile and remediation steps.
                </Typography>
              )}
            </AnimatePresence>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
