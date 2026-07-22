import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Inbox } from "lucide-react";
import Skeleton from "../Skeleton";
import EmptyState from "../EmptyState";
import "./Table.css";

/**
 * CyberShield Table
 * columns: [{ key, header, sortable?, render?(row), align? }]
 * rows: array of objects. Supports client-side sorting, sticky header,
 * loading skeleton, and empty state.
 */
export default function Table({
  columns = [],
  rows = [],
  loading = false,
  emptyProps,
  stickyHeader = true,
  onRowClick,
  className = "",
}) {
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortable) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sort.dir === "asc" ? av - bv : bv - av;
      }
      return sort.dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [rows, sort, columns]);

  const toggleSort = (col) => {
    if (!col.sortable) return;
    setSort((s) =>
      s.key === col.key
        ? { key: col.key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key: col.key, dir: "asc" }
    );
  };

  if (loading) {
    return (
      <div className={`cs-table-wrap ${className}`}>
        <div className="cs-table">
          <div className="cs-table__skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={44} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className={`cs-table-wrap ${className}`}>
        <EmptyState
          icon={<Inbox size={28} />}
          title={emptyProps?.title || "No data"}
          description={emptyProps?.description || "There is nothing to show here yet."}
          action={emptyProps?.action}
        />
      </div>
    );
  }

  return (
    <div className={`cs-table-wrap ${className}`}>
      <table className="cs-table">
        <thead className={stickyHeader ? "cs-table__head--sticky" : ""}>
          <tr>
            {columns.map((col) => {
              const isSorted = sort.key === col.key;
              return (
                <th
                  key={col.key}
                  className={`cs-table__th cs-table__th--${col.align || "left"}`}
                  onClick={() => toggleSort(col)}
                  style={col.sortable ? { cursor: "pointer" } : undefined}
                  aria-sort={isSorted ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                >
                  <span className="cs-table__th-inner">
                    {col.header}
                    {col.sortable &&
                      (isSorted ? (
                        sort.dir === "asc" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )
                      ) : (
                        <ChevronsUpDown size={14} className="cs-table__sort-idle" />
                      ))}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={row.id ?? i}
              className={onRowClick ? "cs-table__row--clickable" : ""}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className={`cs-table__td cs-table__td--${col.align || "left"}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
