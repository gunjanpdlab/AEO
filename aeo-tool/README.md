# 🌿 AEO Audit Tool

### AI Engine Optimization - Multi-Platform AI Response Auditing

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=for-the-badge&logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=for-the-badge&logo=vercel)

**Audit how AI platforms answer your questions across different geographies.**

</div>

---

## 🎯 What is AEO?

**AI Engine Optimization (AEO)** is the practice of understanding and optimizing how AI platforms (ChatGPT, Gemini, Perplexity, Google AI Overviews) answer questions about your brand, products, or industry.

This tool lets you:
- 📝 **Input questions** you want to audit (type manually or upload CSV/Excel)
- 🌍 **Select a target geography** (45+ countries supported)
- 🤖 **Query 4 AI platforms** simultaneously
- 📊 **Compare responses** side-by-side
- 📥 **Download reports** as Excel spreadsheets
- 🔑 **Validate API keys** directly from the settings page

---

## 🔑 Default Login Accounts

The app comes with two pre-configured accounts:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| 🔶 **Admin** | `admin@aeo.com` | `admin123` | Full access: API settings, user management, queries |
| 🔷 **User** | `user@aeo.com` | `user123` | Standard access: API settings, queries |

> **First-time setup:** After deploying, call `POST /api/seed` once to create these default accounts.
>
> ```bash
> curl -X POST https://your-app.vercel.app/api/seed
> ```

### Admin vs User

| Feature | Admin | User |
|---------|:-----:|:----:|
| Create & run queries | ✅ | ✅ |
| Configure API keys | ✅ | ✅ |
| Download Excel reports | ✅ | ✅ |
| Manage users (create/edit/delete) | ✅ | ❌ |
| Change user roles | ✅ | ❌ |

---

## 🖥️ Supported AI Platforms

| Platform | API Used | What It Returns |
|----------|----------|-----------------|
| 🟢 **ChatGPT** | OpenAI API (GPT-4o) | Full conversational answers |
| 🔵 **Gemini** | Google AI (Gemini 2.0 Flash) | Detailed responses with references |
| 🟣 **Perplexity** | Perplexity API (Sonar Pro) | Cited answers with source links |
| 🟠 **Google AI Overview** | SerpAPI | Google's AI Overview snippets from search |

---

## 🌍 Geography Support

Query AI platforms from the perspective of **45+ countries**, including:

🇺🇸 United States &bull; 🇬🇧 United Kingdom &bull; 🇨🇦 Canada &bull; 🇦🇺 Australia &bull; 🇩🇪 Germany &bull; 🇫🇷 France &bull; 🇮🇳 India &bull; 🇯🇵 Japan &bull; 🇧🇷 Brazil &bull; 🇲🇽 Mexico &bull; 🇦🇪 UAE &bull; 🇸🇦 Saudi Arabia &bull; 🇸🇬 Singapore &bull; 🇿🇦 South Africa &bull; and many more...

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- API keys for the platforms you want to use

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

Edit `.env.local` with your MongoDB connection string:

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

Open your browser or run:

```bash
curl -X POST http://localhost:3000/api/seed
```

This creates the default **admin** and **user** accounts. Then log in at [http://localhost:3000](http://localhost:3000).

---

## ⚙️ API Keys Setup

After logging in, go to **API Settings** in the sidebar to configure your API keys:

| Platform | Where to Get the Key |
|----------|---------------------|
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Perplexity** | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) |
| **SerpAPI** | [serpapi.com/manage-api-key](https://serpapi.com/manage-api-key) |

API keys are stored per-user in MongoDB. You only need keys for the platforms you want to use.

---

## 📋 How to Use

1. **Log in** with admin or user credentials
2. **Configure API keys** in Settings (sidebar)
3. **Validate API keys** - Click "Validate Keys" in Settings to test each key is working
4. **Create a New Query** - Title, target country, questions (one per line or upload CSV/Excel)
5. **Select Platforms** - Choose which AI platforms to query
6. **Run Query** - Click "Run Query" and wait for responses
7. **View Results** - Expand each question to see responses from all platforms
8. **Download** - Export as Excel spreadsheet

---

## 📤 Bulk Question Upload

You can upload questions in bulk using CSV or Excel files instead of typing them manually:

- **Supported formats**: `.csv`, `.xlsx`, `.xls`
- **Format**: Questions should be in the **first column** of the file
- **Header row**: Automatically skipped if detected (e.g., "Question", "Query", "Text")
- **Duplicates**: Automatically removed during import
- **Append mode**: Uploaded questions are added to any existing questions in the text area

### Example CSV format:
```csv
Question
What is the best laptop for programming?
How do I learn Python?
What are the top AI tools for business?
```

---

## 🔑 API Key Validation

Each user can validate their API keys directly from the **API Settings** page:

- Click **"Validate Keys"** to test all configured keys at once
- Each provider shows a **Working** (green) or **Failed** (red) badge
- Hover over a failed badge to see the error details
- Keys are tested against each provider's actual API endpoint
- Validates: OpenAI, Gemini, Perplexity, and SerpAPI keys

---

## 👤 User Management (Admin Only)

Admins can manage users from the **Users** page in the sidebar:

- **Create new users** with name, email, password, and role
- **Edit users** - change name, email, password, or role
- **Delete users** - remove user accounts
- **Assign roles** - promote users to admin or demote to regular user

> Registration is disabled for public access. Only admins can create new user accounts.

---

## 🏗️ Project Structure

```
aeo-tool/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login page
│   │   ├── (dashboard)/      # Dashboard, Settings, Query, Admin pages
│   │   └── api/
│   │       ├── auth/         # NextAuth endpoints
│   │       ├── seed/         # Seed default accounts
│   │       ├── admin/users/  # Admin user management CRUD
│   │       ├── settings/     # API key management
│   │       └── queries/      # Query CRUD + run + download
│   ├── components/           # Sidebar & shared components
│   ├── lib/                  # MongoDB, Auth, Countries list
│   ├── models/               # Mongoose schemas (User, Query)
│   ├── providers/            # AI platform API integrations
│   └── types/                # TypeScript type augmentations
├── .env.example
├── next.config.ts
└── package.json
```

---

## ☁️ Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Set the **Root Directory** to `aeo-tool`
4. Add environment variables:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `NEXTAUTH_SECRET` - A random secret string
   - `NEXTAUTH_URL` - Your Vercel deployment URL
5. Deploy!
6. **After first deploy**, seed default accounts:
   ```bash
   curl -X POST https://your-app.vercel.app/api/seed
   ```

---

## 🔒 Security

- Passwords are hashed with **bcrypt** (12 rounds)
- API keys are stored per-user in MongoDB
- Session management via **NextAuth.js** with JWT strategy
- All API routes require authentication
- Admin routes verify admin role server-side
- Registration is disabled - only admins can create users
- `robots.txt` blocks all search engine crawlers

---

## 📄 License

MIT

---

<div align="center">

**Built by [PDLAB](https://github.com/gunjanpdlab)**

</div>
