import re

# 1. Modify app/services/threat_analyzer.py
path_analyzer = "app/services/threat_analyzer.py"
with open(path_analyzer, "r", encoding="utf-8") as f:
    content = f.read()

# Replace analyze_finding definition
old_fn1 = """def analyze_finding(finding): 
 
     finding_type = finding["finding"] 
 
     return THREAT_KNOWLEDGE_BASE.get( 
         finding_type, 
         { 
             "risk": "Unknown", 
             "impact": "Unknown", 
             "recommendation": 
             "Manual review required." 
         } 
     )"""

# Let's use clean regex to find analyze_finding and replace it
content = re.sub(
    r"def analyze_finding\(finding\):.*?\n {5}\)",
    """def analyze_finding(finding): 
 
     finding_type = finding.get("finding") or finding.get("type") or "Unknown"
 
     return THREAT_KNOWLEDGE_BASE.get( 
         finding_type, 
         { 
             "risk": "Unknown", 
             "impact": "Unknown", 
             "recommendation": 
             "Manual review required." 
         } 
     )""",
    content,
    flags=re.DOTALL
)

# Replace analyze_file_finding definition
content = re.sub(
    r"def analyze_file_finding\(.*?\n {5}\}",
    """def analyze_file_finding( 
      finding 
  ): 
 
     finding_type = finding.get("finding") or finding.get("type") or "Unknown"
     threat = THREAT_KNOWLEDGE_BASE.get( 
         finding_type, 
         { 
             "risk": "Unknown", 
             "impact": "Unknown", 
             "recommendation": 
             "Manual review required." 
         } 
     ) 
 
     return { 
 
         "file": 
         finding.get("file") or "Unknown", 
 
         "line": 
         finding.get("line") or 0, 
 
         "finding": 
         finding_type, 
 
         "risk": 
         threat["risk"], 
 
         "impact": 
         threat["impact"], 
 
         "recommendation": 
         threat["recommendation"] 
     }""",
    content,
    flags=re.DOTALL
)

# Replace generate_file_report definition
content = re.sub(
    r"def generate_file_report\(.*?\n {5}return report",
    """def generate_file_report( 
      findings 
  ): 
 
     grouped = {} 
 
     for finding in findings: 
         # Group by file path and finding type
         key = (finding.get("file") or "Unknown", finding.get("finding") or finding.get("type") or "Unknown")
         
         if key not in grouped:
             analysis = analyze_file_finding(finding)
             grouped[key] = {
                 **analysis,
                 "lines": [finding.get("line") or 0],
                 "count": 1
             }
             # Remove single line reference since we now use a list
             if "line" in grouped[key]:
                 del grouped[key]["line"]
         else:
             grouped[key]["lines"].append(finding.get("line") or 0)
             grouped[key]["count"] += 1
 
     # Format the results
     report = []
     for item in grouped.values():
         # Keep lines unique and sorted
         item["lines"] = sorted(list(set(item["lines"])))
         item["count"] = len(item["lines"])
         report.append(item)
 
     return report""",
    content,
    flags=re.DOTALL
)

with open(path_analyzer, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated threat_analyzer.py successfully")


# 2. Modify app/routes/github_routes.py (replace return block in scan_repository)
path_routes = "app/routes/github_routes.py"
with open(path_routes, "r", encoding="utf-8") as f:
    routes_content = f.read()

# Replace return block inside scan_repository
routes_content = re.sub(
    r"        return \{\s+\n\s*\"findings\": findings,\s+\n\s*\"risk_score\": risk_score,\s+\n\s*\"ai_report\": ai_report\s+\n\s*\}\s*.*?except BadCredentialsException:",
    """        return { 
             "repository_info": repo_info,
             "scan_summary": report,
             "findings": findings, 
             "file_report": file_results, 
             "ai_report": ai_report 
         }

    except HTTPException:
        raise
    except BadCredentialsException:""",
    routes_content,
    flags=re.DOTALL
)

# And make sure traceback traceback.print_exc() is clean
routes_content = routes_content.replace(
    "    except Exception as e:\n        traceback.print_exc()\n",
    "    except Exception as e:\n        import traceback\n        traceback.print_exc()\n"
)

with open(path_routes, "w", encoding="utf-8") as f:
    f.write(routes_content)
print("Updated github_routes.py successfully")
