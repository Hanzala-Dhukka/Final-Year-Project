"""
Framework mapping helpers for the Compliance Center (Module 6.3).

Given the raw data loaded from GitHub scans, threat reports, checklists and the
OWASP simulator, this module normalises the findings and maps every issue to the
four compliance frameworks (OWASP, CWE, MITRE ATT&CK, NIST CSF). The compliance
engine then turns the mapped coverage into per-framework scores and gap analysis.
"""
from typing import Dict, List, Set

from app.data.owasp_mapping import (
    OWASP_MAPPING,
    OWASP_CATEGORIES,
    OWASP_NAMES,
)
from app.data.cwe_mapping import (
    CWE_MAPPING,
    CWE_LIST,
    CWE_NAMES,
)
from app.data.mitre_mapping import (
    MITRE_MAPPING,
    MITRE_LIST,
    MITRE_NAMES,
)
from app.data.nist_mapping import (
    NIST_MAPPING,
    NIST_LIST,
    NIST_NAMES,
)


def normalise_label(label: str) -> str:
    """Best-effort normalisation of a raw finding label."""
    if not label:
        return ""
    return str(label).strip().lower()


def map_frameworks(findings: List[str]) -> Dict[str, Set[str]]:
    """
    Map a list of raw finding labels to the controls satisfied per framework.

    Args:
        findings: Raw issue labels from scans / reports / simulator / checklist.

    Returns:
        Dict with keys owasp/cwe/mitre/nist each holding the set of
        framework control ids that the findings *satisfy* (i.e. the controls
        the project has demonstrably implemented / exercised).
    """
    findings_lower = [normalise_label(f) for f in findings if f]

    # Build lookup maps keyed by normalised label.
    label_maps = [
        OWASP_MAPPING,
        CWE_MAPPING,
        MITRE_MAPPING,
        NIST_MAPPING,
    ]
    # Index each mapping by lowercased key for fast lookup.
    indexed = []
    for m in label_maps:
        indexed.append({normalise_label(k): v for k, v in m.items()})

    owasp_hit: Set[str] = set()
    cwe_hit: Set[str] = set()
    mitre_hit: Set[str] = set()
    nist_hit: Set[str] = set()

    for fl in findings_lower:
        # Direct label match.
        if fl in indexed[0]:
            owasp_hit.add(indexed[0][fl])
        if fl in indexed[1]:
            cwe_hit.add(indexed[1][fl])
        if fl in indexed[2]:
            mitre_hit.add(indexed[2][fl])
        if fl in indexed[3]:
            nist_hit.add(indexed[3][fl])

        # Keyword fallback so partial labels still map.
        for kw, val in OWASP_MAPPING.items():
            if kw.lower() in fl or fl in kw.lower():
                owasp_hit.add(val)
        for kw, val in CWE_MAPPING.items():
            if kw.lower() in fl or fl in kw.lower():
                cwe_hit.add(val)
        for kw, val in MITRE_MAPPING.items():
            if kw.lower() in fl or fl in kw.lower():
                mitre_hit.add(val)
        for kw, val in NIST_MAPPING.items():
            if kw.lower() in fl or fl in kw.lower():
                nist_hit.add(val)

    return {
        "owasp": owasp_hit,
        "cwe": cwe_hit,
        "mitre": mitre_hit,
        "nist": nist_hit,
    }


def framework_names(framework: str, control_id: str) -> str:
    """Return a human-readable name for a control id within a framework."""
    table = {
        "owasp": OWASP_NAMES,
        "cwe": CWE_NAMES,
        "mitre": MITRE_NAMES,
        "nist": NIST_NAMES,
    }
    return table.get(framework, {}).get(control_id, control_id)


def framework_total(framework: str) -> int:
    """Return the total number of controls in a framework."""
    totals = {
        "owasp": len(OWASP_CATEGORIES),
        "cwe": len(CWE_LIST),
        "mitre": len(MITRE_LIST),
        "nist": len(NIST_LIST),
    }
    return totals.get(framework, 0)


def framework_all(framework: str) -> List[str]:
    """Return the full list of control ids for a framework."""
    alls = {
        "owasp": OWASP_CATEGORIES,
        "cwe": CWE_LIST,
        "mitre": MITRE_LIST,
        "nist": NIST_LIST,
    }
    return alls.get(framework, [])
