# XRL – Crunchbase Data Automation

# Overview

XRL is a decision-support platform that analyzes real-world innovation data from Crunchbase through BigQuery and n8n.
The system dynamically updates a live Google Sheets table based on the user’s selected domains and parameters from the front-end.
Live demo: x-r-l.netlify.app￼

⸻

# How It Works
	1.	The user selects up to five domains on the front-end.
	2.	The platform sends a JSON payload to an n8n webhook.
	3.	n8n prepares regex filters and runs BigQuery queries per domain.
	4.	Results are written automatically into Google Sheets, under the relevant domain columns.

⸻

# Main Metrics
	•	IPOs in the past 5 years
	•	Acquisitions and mergers
	•	Active and new companies
	•	Pre-Seed, Seed, Series A–C funding rounds
	•	Series A / Seed ratio
	•	Average company age

⸻

# Tech Stack
	•	n8n – workflow automation
	•	Google BigQuery – live data queries
	•	Google Sheets API – result visualization
	•	Netlify – front-end hosting
	•	JavaScript / SQL – data logic
