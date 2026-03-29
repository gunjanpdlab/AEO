# AEO Audit Tool

### Answer Engine Optimization - Multi-Platform AI Response Auditing

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=for-the-badge&logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=for-the-badge&logo=vercel)

**Audit how AI platforms answer questions about your brand across different geographies.**

</div>

---

## What is AEO?

**Answer Engine Optimization (AEO)** is the practice of understanding and optimizing how AI platforms (ChatGPT, Gemini, Perplexity, Google AI Overviews) answer questions about your brand, products, or industry. Think of it as **SEO for AI** - it tracks whether AI assistants mention, recommend, or cite your brand.

This tool lets you:
- **Input questions** you want to audit (type manually or upload CSV/Excel)
- **Select a target geography** (45 countries supported)
- **Query up to 4 AI platforms** simultaneously
- **Configure brand tracking** (client brands vs competitor brands)
- **Compare responses** side-by-side
- **Analyze brand visibility** with 12 charts, KPI metrics, and competitive gap analysis
- **Download reports** as Raw Excel, Analysis Excel (11 sheets), or PDF Audit Report
- **Validate API keys** directly from the settings page

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **Frontend** | React + TypeScript | React 19.2.4, TS 5.9.3 |
| **Styling** | Tailwind CSS | 4.2.1 |
| **Icons** | Lucide React | 0.577.0 |
| **Database** | MongoDB Atlas (Mongoose) | Mongoose 9.2.4 |
| **Authentication** | NextAuth.js (JWT) | 5.0.0-beta.30 |
| **Password Hashing** | bcryptjs | 3.0.3 |
| **Excel Generation** | ExcelJS | 4.4.0 |
| **PDF Generation** | jsPDF + jspdf-autotable | 4.2.0 / 5.0.7 |
| **Chart Rendering** | Chart.js + chartjs-node-canvas | 4.5.1 / 5.0.0 |
| **AI: OpenAI** | openai SDK (GPT-4o) | 6.25.0 |
| **AI: Google** | @google/generative-ai (Gemini 2.0 Flash) | 0.24.1 |
| **AI: Perplexity** | OpenAI-compatible SDK (Sonar Pro) | via openai SDK |
| **AI: Google AIO** | SerpAPI (Google Search) | REST API |

---

## Supported AI Platforms

| Platform | API Used | Model | What It Returns |
|----------|----------|-------|-----------------|
| **ChatGPT** | OpenAI API | GPT-4o | Full conversational answers |
| **Gemini** | Google Generative AI | Gemini 2.0 Flash | Detailed responses with references |
| **Perplexity** | Perplexity API | Sonar Pro | Cited answers with source links |
| **Google AI Overview** | SerpAPI | Google Search | AI Overview snippets from Google Search |

---

## Default Login Accounts

The app comes with two pre-configured accounts:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | `admin@aeo.com` | `admin123` | Full access: API settings, user management, queries |
| **User** | `user@aeo.com` | `user123` | Standard access: API settings, queries |

> **First-time setup:** After deploying, call `POST /api/seed` once to create these default accounts.
>
> ```bash
> curl -X POST https://your-app.vercel.app/api/seed
> ```

### Admin vs User Permissions

| Feature | Admin | User |
|---------|:-----:|:----:|
| Create & run reports | Yes | Yes |
| View analysis dashboard | Yes | Yes |
| Download Raw Excel | Yes | Yes |
| Download Analysis Excel & PDF | Yes | Yes |
| Configure platform API keys | Yes | No |
| Manage users (create/edit/delete) | Yes | No |
| Change user roles | Yes | No |

---

## Geography Support

Query AI platforms from the perspective of **45 countries**. No VPN is needed - the country selection works server-side:

- **ChatGPT / Gemini / Perplexity** - the country is included in the prompt, so the AI tailors its response to that region
- **SerpAPI (Google AI Overview)** - the country code is sent as a `gl` parameter to Google's API, returning localized results

Your physical location or IP address does not matter.

Supported countries include: United States, United Kingdom, Canada, Australia, Germany, France, India, Japan, Brazil, Mexico, UAE, Saudi Arabia, Singapore, South Africa, and 31 more.

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- API keys for AI platforms (configured by admin, not by end users)

### 1. Clone & Install

```bash
git clone https://github.com/gunjanpdlab/AEO.git
cd AEO/aeo-tool
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aeo-tool
NEXTAUTH_SECRET=generate-a-random-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Run

```bash
npm run dev
```

### 4. Seed Default Accounts

```bash
curl -X POST http://localhost:3000/api/seed
```

This creates the default **admin** and **user** accounts. Then log in at [http://localhost:3000](http://localhost:3000).

---

## API Keys Setup (Admin Only)

API keys are managed by platform admins — **end users do not need to configure any API keys**. Users simply create reports and run queries using the platform-provided keys.

### How It Works

- **Admins** configure API keys via the **API Settings** page in the sidebar
- All users automatically use the admin-configured keys when running queries
- Only platforms with configured keys are shown to users in the platform selector
- A **credit-based usage system** will be added in a future release to manage and track usage per user

### Where to Get API Keys (for admins)

| Platform | Where to Get the Key |
|----------|---------------------|
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Perplexity** | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) |
| **SerpAPI** | [serpapi.com/manage-api-key](https://serpapi.com/manage-api-key) |

- Click **"Validate Keys"** to test all configured keys against each provider's API

---

## How to Use

### Step-by-Step Workflow

1. **Log in** with your credentials
2. **Create a New Report** - set title, target country, configure brands, add questions, and select platforms
3. **Click "Create & Run Report"** - the report is created and AI platforms are queried automatically in one step
4. **View Results** - expand each question to see side-by-side responses from all platforms (auto-refreshes while running)
5. **Download Raw Data** - click "Excel" to export raw responses as a spreadsheet
6. **Analyze** - click "Analyze" to open the AEO analysis dashboard (requires both client and competitor brands)
7. **Download Reports** - from the analysis dashboard, export Analysis Excel (11 sheets) or PDF Audit Report

### Example Test Query

To quickly test the tool:
- **Client Name**: `Semrush`
- **Client Brands**: `Semrush`
- **Competitor Brands**: `Ahrefs, Moz, SE Ranking`
- **Country**: United States
- **Question**: `What are the best SEO tools for small businesses?`

---

## Bulk Question Upload

Upload questions in bulk using CSV or Excel files:

- **Supported formats**: `.csv`, `.xlsx`, `.xls`
- **Format**: Questions should be in the **first column**
- **Header row**: Automatically skipped if detected (e.g., "Question", "Query", "Text")
- **Duplicates**: Automatically removed during import
- **Append mode**: Uploaded questions are added to existing questions

### Example CSV format:
```csv
Question
What is the best laptop for programming?
How do I learn Python?
What are the top AI tools for business?
```

---

## AEO Analysis & Reporting

The analysis module provides deep AEO auditing for brand visibility, competitive positioning, and content optimization opportunities.

### Brand Configuration

When creating a query, configure:
- **Client Name** - the parent company (e.g., "PeopleConnect")
- **Client Brands** - comma-separated brands to track (e.g., "TruthFinder, Instant Checkmate, Intelius")
- **Competitor Brands** - comma-separated competitors (e.g., "Whitepages, BeenVerified, Spokeo")

### Analysis Dashboard

After running a query, click **"Analyze"** on the query detail page. The dashboard includes:

**KPI Cards:**
- Client Presence (% of queries where any client brand appears)
- Client Share of Voice (% of total mentions)
- Top Recommendation Wins (times ranked #1)
- URL Citations (direct links in responses)
- Critical Gaps (competitor-only queries)
- Average Composite Score (0-100)

**12 Charts:**
1. Brand Presence in AI Responses
2. Total Mention Volume
3. URL Citation Count by Brand
4. Top Recommendation Distribution (doughnut)
5. Brand Presence by Question Category (grouped bar)
6. Brand Visibility Across Buyer Journey (grouped bar)
7. Sentiment Distribution by Brand (stacked horizontal bar)
8. Brand AEO Scorecard (radar)
9. Client vs. Competitor Mention Volume Share (doughnut)
10. Competitive Gap Analysis Summary
11. Mention-to-Citation Conversion Rate
12. Average First-Mention Rank Position

**Data Tables:**
- Brand Comparison (sortable by composite score)
- Category Breakdown (collapsible)
- Funnel Stage Breakdown (collapsible)
- Critical Gap Queries (collapsible)

### Analysis Metrics

Per-brand metrics computed by the analysis engine:

| Metric | Description |
|--------|-------------|
| Presence % | Percentage of queries where the brand is mentioned |
| Mentions | Total mention count across all queries |
| Avg Depth | Average mentions per query when present |
| Share of Voice | Brand's proportion of total mentions |
| Top Recs | Number of times listed as #1 recommendation |
| URL Citations | Number of times a direct URL was linked |
| Citation Rate | URL citations / total queries |
| Mention-to-Cite | URL citations / queries where mentioned |
| Avg Rank | Average first-mention position |
| Sentiment Score | Net sentiment (-1 to +1) based on surrounding language |
| Composite Score | Weighted score (0-100) across six dimensions |

**Composite Score Weights:**
- Presence: 25%
- Citation Rate: 15%
- Sentiment: 15%
- Top Recommendations: 15%
- Mention Depth: 15%
- First-Mention Rate: 15%

### Question Categorization

Questions are automatically categorized into:
- **Best/Discovery** - "best", "top", "recommend"
- **How-to/Informational** - "how to", "find", "look up"
- **Trust/Legitimacy** - "legit", "scam", "reviews"
- **Head-to-Head Comparison** - "vs", "compared", "difference"
- **Pricing/Billing** - "price", "cost", "cancel"
- **Privacy/Opt-out** - "remove", "opt out", "privacy"
- **AI vs. People Search** - "chatgpt", "ai", "perplexity"
- **Compliance/Legal** - "fcra", "employer", "hiring"

Categories are mapped to buyer journey stages: Awareness, Consideration, Decision, Post-Purchase.

### Competitive Gap Analysis

Queries are classified into gap types:
- **CRITICAL** - Competitors appear, zero client brands (immediate opportunity)
- **PARTIAL** - At least one client brand missing
- **ALL PRESENT** - Both client and competitor brands appear
- **CLIENT ONLY** - Client brands appear, no competitors
- **NO BRANDS** - No tracked brands in the response

### Downloadable Reports

Reports are generated on-the-fly from stored responses. They do **not** re-call any AI APIs, so downloading is free and can be done unlimited times.

**Raw Excel:**
- One sheet with all questions and responses per platform
- Available from the query detail page

**Analysis Excel (11 sheets):**
1. Executive Summary with KPIs and brand comparison
2. Share of Voice
3. Citation Analysis
4. Rank & Recommendations
5. Sentiment Analysis
6. Category Breakdown
7. Funnel Analysis
8. Competitive Gaps with critical query list
9. Brand Scorecard (six dimensions)
10. Raw Data (per-question, per-brand breakdown)
11. Charts (embedded PNG images)

**PDF Audit Report (~10 pages):**
- Cover page with client/competitor branding
- Table of Contents
- Executive Summary with KPI boxes and brand comparison table
- Brand Presence and Share of Voice (chart + table)
- Citation and URL Attribution (chart + table)
- Top Recommendations and Rank (chart + table)
- Sentiment Analysis (chart + table)
- Buyer Journey Funnel (chart + table)
- Competitive Gap Analysis (chart + table + critical query list)
- Brand AEO Scorecard (radar chart + table)
- Recommendations and Next Steps (auto-generated from data)

---

## API Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth.js handlers (login/logout/session) |
| POST | `/api/register` | User registration (disabled for public) |
| POST | `/api/seed` | Create default admin and user accounts |

### Queries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queries` | List all queries for the logged-in user |
| POST | `/api/queries` | Create a new query |
| DELETE | `/api/queries` | Delete a query |
| GET | `/api/queries/[id]` | Get a single query with all responses |
| PUT | `/api/queries/[id]` | Update a query |
| POST | `/api/queries/[id]/run` | Execute query against selected AI platforms |
| GET | `/api/queries/[id]/download` | Download raw Excel report |
| POST | `/api/queries/upload` | Upload CSV/Excel file with questions |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queries/[id]/analysis` | Get analysis data as JSON (metrics, charts) |
| GET | `/api/queries/[id]/analysis/excel` | Download Analysis Excel (11 sheets) |
| GET | `/api/queries/[id]/analysis/pdf` | Download PDF Audit Report |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get user's API keys (masked) |
| POST | `/api/settings` | Save/update API keys |
| POST | `/api/settings/validate` | Validate all configured API keys |

### Admin (requires admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create a new user |
| PUT | `/api/admin/users` | Edit a user |
| DELETE | `/api/admin/users` | Delete a user |
| POST | `/api/admin/apikeys/validate` | Validate admin API keys |

---

## Database Schema

### User Collection

```
{
  name: String
  email: String (unique)
  password: String (bcrypt hashed, 12 rounds)
  role: "admin" | "user"
  apiKeys: {
    openai?: String
    gemini?: String
    perplexity?: String
    serpapi?: String
  }
  createdAt: Date
}
```

### Query Collection

```
{
  userId: String (indexed)
  title: String
  country: String
  countryCode: String
  clientName: String
  clientBrands: [String]
  competitorBrands: [String]
  questions: [
    {
      text: String
      responses: [
        {
          provider: String ("openai" | "gemini" | "perplexity" | "serpapi")
          text: String
          status: "pending" | "running" | "completed" | "error"
          error?: String
        }
      ]
    }
  ]
  status: "draft" | "running" | "completed"
  createdAt: Date
}
```

---

## Data Flow

1. **User Login** - JWT session via NextAuth
2. **Create & Run Report** - user fills in title, country, brands, questions, selects platforms, and clicks "Create & Run Report"
3. **Query AI Platforms** - concurrent API calls to all selected platforms using admin-configured keys
4. **Store Responses** - each platform's response saved to MongoDB
5. **Parse Analysis** - extract brand mentions, sentiment, citations, rankings
6. **Calculate Metrics** - brand metrics, gap analysis, category/funnel breakdowns
7. **Generate Charts** - 12 chart images rendered server-side via Chart.js
8. **Export Reports** - Analysis Excel (11 sheets) or PDF Audit Report (~10 pages)

API costs are incurred **only in step 3** (Query AI Platforms). All subsequent analysis, chart generation, and report downloads use the stored responses and are free. A credit-based system will be added to track and manage per-user usage.

---

## Project Structure

```
aeo-tool/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Login page
│   │   ├── (dashboard)/               # Dashboard, Settings, Query, Admin pages
│   │   │   ├── page.tsx               # Dashboard (query list)
│   │   │   ├── admin/page.tsx         # User management (admin only)
│   │   │   ├── settings/page.tsx      # API key configuration
│   │   │   └── query/
│   │   │       ├── new/page.tsx       # Create new query
│   │   │       └── [id]/
│   │   │           ├── page.tsx       # Query detail & run
│   │   │           └── analysis/page.tsx  # AEO Analysis Dashboard
│   │   └── api/
│   │       ├── auth/                  # NextAuth endpoints
│   │       ├── seed/                  # Seed default accounts
│   │       ├── register/              # User registration
│   │       ├── admin/
│   │       │   ├── users/             # User management CRUD
│   │       │   └── apikeys/validate/  # Admin key validation
│   │       ├── settings/              # API key management + validation
│   │       └── queries/               # Query CRUD + run + download + upload
│   │           └── [id]/analysis/     # Analysis JSON, Excel, PDF endpoints
│   ├── components/
│   │   └── Sidebar.tsx                # Navigation sidebar
│   ├── lib/
│   │   ├── aeo/                       # AEO Analysis Engine
│   │   │   ├── types.ts              # TypeScript interfaces
│   │   │   ├── constants.ts          # Categories, sentiment words, scoring weights
│   │   │   ├── parser.ts            # Response parsing (mentions, citations, sentiment)
│   │   │   ├── metrics.ts           # Aggregated metrics and gap analysis
│   │   │   ├── charts.ts            # Server-side chart generation (12 charts)
│   │   │   ├── excel-report.ts      # Analysis Excel builder (11 sheets)
│   │   │   └── pdf-report.ts        # PDF Audit Report builder
│   │   ├── mongodb.ts                # MongoDB connection manager
│   │   ├── auth.ts                   # NextAuth configuration
│   │   └── countries.ts              # 45 supported countries
│   ├── models/
│   │   ├── User.ts                   # User schema (with API keys)
│   │   └── Query.ts                  # Query schema (questions + responses)
│   ├── providers/
│   │   └── index.ts                  # AI platform API integrations
│   └── types/
│       └── next-auth.d.ts            # NextAuth type augmentations
├── public/
├── .env.example
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── package.json
```

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Set the **Root Directory** to `aeo-tool`
4. Add environment variables:
   - `MONGODB_URI` - your MongoDB Atlas connection string
   - `NEXTAUTH_SECRET` - a random secret string
   - `NEXTAUTH_URL` - your Vercel deployment URL
5. Deploy
6. **After first deploy**, seed default accounts:
   ```bash
   curl -X POST https://your-app.vercel.app/api/seed
   ```

---

## Security

- Passwords hashed with **bcrypt** (12 rounds)
- API keys stored per-user in MongoDB
- Session management via **NextAuth.js** with JWT strategy
- All API routes require authentication
- Admin routes verify admin role server-side
- Public registration is disabled - only admins can create users
- `robots.txt` blocks all search engine crawlers

---

## FAQ

**Do I need to set up API keys as a user?**
No. API keys are configured by platform admins. Users simply create reports and the platform handles all AI API calls using admin-configured keys.

**Will there be usage limits?**
A credit-based usage system is planned for a future release to track and manage per-user usage.

**Do I need a VPN for different country queries?**
No. The country is passed to AI platforms via the API (in the prompt or as a parameter). Your physical location doesn't matter.

**Do report downloads re-call AI APIs? Will it cost me?**
No. AI APIs are only called once when you click "Create & Run Report". All reports (Raw Excel, Analysis Excel, PDF) are generated from the stored responses and cost nothing to download.

**Can I download reports later?**
Yes. As long as the report exists in the database, all 3 report types can be downloaded anytime. Reports are generated on-the-fly from stored data.

**Which platforms are available to me?**
Only platforms with admin-configured API keys are shown in the platform selector. If you don't see a platform, ask your admin to configure the key.

**Do I need both client and competitor brands for analysis?**
Yes. The "Analyze" button and analysis reports require both client brands and competitor brands to be configured on the report.

**Can I add brands to an existing query?**
Yes. Edit the query and add client/competitor brands, then click "Analyze". For queries created before the brand feature, update via MongoDB:
```javascript
db.queries.updateOne(
  { _id: ObjectId("your-query-id") },
  { $set: {
    clientName: "YourCompany",
    clientBrands: ["Brand1", "Brand2"],
    competitorBrands: ["Comp1", "Comp2"]
  }}
);
```

---

## License

MIT

---

<div align="center">

**Built by [PDLAB](https://github.com/gunjanpdlab)**

</div>
