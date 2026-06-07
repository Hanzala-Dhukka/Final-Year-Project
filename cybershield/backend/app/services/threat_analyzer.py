THREAT_KNOWLEDGE_BASE = { 
 
     "AWS Access Key": { 
         "risk": "Critical", 
         "impact": 
         "Attackers may gain access to AWS resources.", 
         "recommendation": 
         "Rotate AWS credentials immediately." 
     }, 
 
     "Password Variable": { 
         "risk": "High", 
         "impact": 
         "Credentials may be exposed.", 
         "recommendation": 
         "Move passwords to environment variables." 
     }, 
 
     "Hardcoded Token": { 
         "risk": "Critical", 
         "impact": 
         "Attackers may gain unauthorized API access.", 
         "recommendation": 
         "Rotate the token immediately." 
     }, 
 
     "MongoDB URI": { 
         "risk": "Critical", 
         "impact": 
         "Database compromise possible.", 
         "recommendation": 
         "Use environment variables." 
     }, 
 
     "Python eval()": { 
         "risk": "Critical", 
         "impact": 
         "Arbitrary code execution possible.", 
         "recommendation": 
         "Avoid eval() usage." 
     }, 
 
     "Python exec()": { 
         "risk": "Critical", 
         "impact": 
         "Attacker-controlled code may execute.", 
         "recommendation": 
         "Remove exec() usage." 
     }, 
 
     "JavaScript eval()": { 
         "risk": "High", 
         "impact": 
         "May enable XSS and code injection.", 
         "recommendation": 
         "Replace eval() with safer alternatives." 
     },
     "Google API Key": {
         "risk": "Critical",
         "impact": "Potential unauthorized use of Google Cloud services and billing.",
         "recommendation": "Restrict the API key or rotate it if compromised."
     },
     "JWT Secret": {
         "risk": "High",
         "impact": "Attackers can forge authentication tokens and impersonate users.",
         "recommendation": "Use a strong, unique secret and store it in environment variables."
     },
     "Private Key": {
         "risk": "Critical",
         "impact": "Exposure of private keys can lead to complete system compromise.",
         "recommendation": "Remove private keys from version control and rotate them immediately."
     },
     "Shell Execution": {
         "risk": "Critical",
         "impact": "Potential for command injection and arbitrary system command execution.",
         "recommendation": "Avoid using os.system() and use safer alternatives like subprocess."
     },
     "Subprocess Execution": {
         "risk": "Medium",
         "impact": "Improper use of subprocess can lead to command injection.",
         "recommendation": "Always use shell=False and pass arguments as a list."
     } 
 }

def analyze_finding(finding): 
 
     finding_type = finding["finding"] 
 
     return THREAT_KNOWLEDGE_BASE.get( 
         finding_type, 
         { 
             "risk": "Unknown", 
             "impact": "Unknown", 
             "recommendation": 
             "Manual review required." 
         } 
     )

def analyze_file_finding( 
     finding 
 ): 
 
     threat = THREAT_KNOWLEDGE_BASE.get( 
         finding["finding"], 
         { 
             "risk": "Unknown", 
             "impact": "Unknown", 
             "recommendation": 
             "Manual review required." 
         } 
     ) 
 
     return { 
 
         "file": 
         finding["file"], 
 
         "line": 
         finding["line"], 
 
         "finding": 
         finding["finding"], 
 
         "risk": 
         threat["risk"], 
 
         "impact": 
         threat["impact"], 
 
         "recommendation": 
         threat["recommendation"] 
     } 

def generate_file_report( 
     findings 
 ): 
 
     grouped = {} 
 
     for finding in findings: 
         # Group by file path and finding type
         key = (finding["file"], finding["finding"])
         
         if key not in grouped:
             analysis = analyze_file_finding(finding)
             grouped[key] = {
                 **analysis,
                 "lines": [finding["line"]],
                 "count": 1
             }
             # Remove single line reference since we now use a list
             if "line" in grouped[key]:
                 del grouped[key]["line"]
         else:
             grouped[key]["lines"].append(finding["line"])
             grouped[key]["count"] += 1
 
     # Format the results
     report = []
     for item in grouped.values():
         # Keep lines unique and sorted
         item["lines"] = sorted(list(set(item["lines"])))
         item["count"] = len(item["lines"])
         report.append(item)
 
     return report

def generate_summary( 
     findings, 
     files_scanned 
 ): 
 
     return ( 
 
         f"Scan completed. " 
 
         f"Found {len(findings)} " 
 
         f"security issues across " 
 
         f"{files_scanned} files." 
     )

def risk_level_from_score( 
     score 
 ): 
 
     if score >= 90: 
         return "Low" 
 
     elif score >= 70: 
         return "Medium" 
 
     elif score >= 50: 
         return "High" 
 
     return "Critical"

def generate_business_impact( 
     findings 
 ): 
 
     impacts = set() 
 
     for finding in findings: 
 
         analysis = analyze_finding( 
             finding 
         ) 
 
         impacts.add( 
             analysis["impact"] 
         ) 
 
     return list(impacts)

def generate_recommendations( 
     findings 
 ): 
 
     recommendations = set() 
 
     for finding in findings: 
 
         analysis = analyze_finding( 
             finding 
         ) 
 
         recommendations.add( 
             analysis["recommendation"] 
         ) 
 
     return list( 
         recommendations 
     )

def generate_ai_report( 
     findings, 
     files_scanned, 
     risk_score 
 ): 
 
     return { 
 
         "risk_level": 
         risk_level_from_score( 
             risk_score 
         ), 
 
         "summary": 
         generate_summary( 
             findings, 
             files_scanned 
         ), 
 
         "business_impact": 
         generate_business_impact( 
             findings 
         ), 
 
         "recommendations": 
         generate_recommendations( 
             findings 
         ) 
     }

def calculate_risk_level(findings): 
 
     critical = 0 
     high = 0 
 
     for finding in findings: 
 
         analysis = analyze_finding( 
             finding 
         ) 
 
         if analysis["risk"] == "Critical": 
             critical += 1 
 
         elif analysis["risk"] == "High": 
             high += 1 
 
     if critical > 0: 
         return "Critical" 
 
     if high > 0: 
         return "High" 
 
     return "Low"
