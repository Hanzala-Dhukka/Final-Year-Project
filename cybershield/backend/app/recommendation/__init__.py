"""
Scanner → Checklist Recommendation Service (Module SC3).

Reads scan findings from MongoDB, maps them through the Rule Mapping
Engine (SC2), and creates user_checklist entries (SC1 schema) so the
Security Checklist UI automatically shows scanner-recommended tasks.
"""
