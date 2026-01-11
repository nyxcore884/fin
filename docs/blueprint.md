# **App Name**: Budget Insights

## Core Features:

- File Upload: Upload GL Entries, Budget Holder Mapping, Cost Item Map, Regional Mapping, Corrections, and optional Revenue Report files from the UI.
- Data Processing: Process uploaded CSV/XLSX files to map cost items, derive regions, assign budget holders, and classify revenues using Pandas in a Google Cloud Function.
- Revenue Classification Tool: Classify revenues as retail or wholesale based on keywords and the uploaded Revenue Report using a generative AI tool.
- Income Statement Generation: Aggregate processed data to generate an Income Statement with Retail Revenue, Wholesale Revenue, Total Costs, and Costs by Budget Holder.
- Result Saving: Save processed results (Income Statement data) to Firestore with timestamp.
- Result Display: Display the Income Statement as a table, showing Retail Revenue, Wholesale Revenue, Total Costs, and Costs by Budget Holder.
- User Authentication: Enable user login with Google using Firebase Authentication.
- Interactive Charts: Generate interactive charts (e.g., bar/pie) for cost breakdowns using Chart.js.
- Report Export: Export reports to PDF and CSV formats.
- Multi-User Support: Implement multi-user support with Firebase Authentication roles (admin/viewer).
- Historical Dashboard: Create a dashboard for viewing historical reports from Firestore.
- Anomaly Detection: Provide AI-driven suggestions for anomaly detection (e.g., high variances). The LLM will use a tool that can use external financial data to assess the data and detect anomalies.
- Chunked File Processing: Use pandas' `chunksize` parameter in the Cloud Function to process large GL files in batches to avoid memory limits.
- Encoding and Localization Support: Add explicit encoding in pandas reads (e.g., `pd.read_csv(..., encoding='utf-8-sig')`). Ensure the UI and AI handle Unicode for Georgian text.
- Mapping Logic Implementation: Implement logic to prioritize matches, join dataframes, handle missing values, and use unique key combinations for lookups.
- Revenue-Specific Logic: Implement revenue-specific logic to extract retail and wholesale revenues from GL entries using keywords or a separate revenue file.
- Gemini API Integration: Integrate the Gemini API in the Cloud Function for generative tasks, such as revenue classification and anomaly detection.
- Genkit Flows: Set up AI workflows in Genkit for chaining data processing, classification with Gemini, and anomaly detection.
- External Data Tool for Anomalies: Use Polygon API for financial benchmarks to flag variances, handling API keys via Cloud Secrets Manager.
- Thresholds and Rules: Define rules and thresholds for anomaly detection based on file contents.
- File Validation: Validate file formats, check required columns, and show previews before upload using UI components.
- Progress Indicators: Add loading states or spinners with animations in Cyan for large uploads and processing.
- Chart.js Customizations: Customize Chart.js for cost breakdowns with bar charts (by holder) and pie charts (by region), adding tooltips with file-derived details.
- Export Functionality: Implement export functionality to PDF (with tables/charts) and CSV.
- Historical Dashboard: Create a dashboard page querying Firestore collection 'budget_results' via Firebase SDK, using a sortable table.
- Roles UI: Implement admin and viewer roles, allowing admins to delete historical reports and viewers to read only, using Firebase Auth custom claims.
- Firestore Schema: Define Firestore schema for storing budget results and user roles.
- Cloud Functions Expansions: Add a second function for anomaly detection and implement error logging using Cloud Logging.
- Security Rules: Define security rules for Firestore (writes only from Cloud Functions, reads based on user role) and Storage (authenticated uploads only, with metadata validation).
- Dependencies: Add necessary dependencies to `requirements.txt` (e.g., google-cloud-vertexai, requests, jsonschema).
- Authentication Flows: Implement authentication flows with Google login and Firebase UI.
- Error Handling: Catch pandas errors and return JSON errors to UI with descriptive messages.
- Testing: Add unit tests using sample data from files and Firebase emulators.
- Pricing and Scaling: Monitor Function invocations, use Firestore indexes, and add compression for large files.
- Monitoring: Integrate Cloud Monitoring for function errors and Firebase Analytics for UI usage.
- API Keys/Secrets: Store Gemini API key in Cloud Secrets and expose via environment variables in Functions.
- Documentation: Provide an in-app help section explaining file formats.
- Accessibility: Ensure high contrast with Tailwind classes and add alt text for icons/charts.
- Version Control: Use Git for version control.

## Style Guidelines:

- Primary color: Black (#000000) for a dark, sophisticated base.
- Background color: Dark Gray (#121212), a near-black to reduce eye strain and enhance contrast.
- Accent color: Cyan (#00FFFF) for interactive elements and highlights, providing a futuristic feel.
- Secondary accent color: Violet (#EE82EE) to add depth and a cyberpunk aesthetic to less critical elements.
- Body font: 'Roboto Mono', a monospaced font for readability and a tech-inspired look.
- Headline font: 'Orbitron', a futuristic sans-serif for headlines; use 'Share Tech Mono' for a consistent tech feel.
- Use neon-style icons from a set like 'Remix Icon' with glowing effects in Cyan and Violet.
- Clean, responsive layout with clear sections, using a grid system with generous padding. Incorporate subtle line separators in Cyan.
- Deep slate, matte finish for immersive dark mode (#0F1117).
- Slightly lighter for cards, tables, and modals (#111827).
- Indigo for active tabs, buttons, and highlights (#4F46E5).
- Sky cyan for charts, tooltips, and hover glows (#22D3EE).
- Indigo-purple for buttons and borders (#6366F1).
- Cyan-teal for transitions and hover effects (#06B6D4).
- High-contrast white-gray for main text (#E5E7EB).
- Muted gray for labels, hints, and tooltips (#9CA3AF).
- Subtle separators between sections (#1F2937).
- Green for validated uploads or anomaly resolved (#10B981).
- Red for file errors, anomaly flags (#EF4444).
- Indigo glow on hover for buttons and cards (rgba(99,102,241,0.3)).
- Translucent layer for glassmorphism effect (rgba(255,255,255,0.04)).