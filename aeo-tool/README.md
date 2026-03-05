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
- 📝 **Input questions** you want to audit
- 🌍 **Select a target geography** (45+ countries supported)
- 🤖 **Query 4 AI platforms** simultaneously
- 📊 **Compare responses** side-by-side
- 📥 **Download reports** as Excel spreadsheets

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

Open [http://localhost:3000](http://localhost:3000) and register your account.

---

## ⚙️ API Keys Setup

After logging in, go to **Settings** to configure your API keys:

| Platform | Where to Get the Key |
|----------|---------------------|
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Perplexity** | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) |
| **SerpAPI** | [serpapi.com/manage-api-key](https://serpapi.com/manage-api-key) |

API keys are stored per-user in MongoDB. You only need keys for the platforms you want to use.

---

## 📋 How to Use

1. **Create a New Query** - Give it a title, select target country, enter questions (one per line)
2. **Select Platforms** - Choose which AI platforms to query
3. **Run Query** - Click "Run Query" and wait for responses
4. **View Results** - Expand each question to see responses from all platforms
5. **Download** - Export as Excel spreadsheet

---

## 🏗️ Project Structure

```
aeo-tool/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login & Register pages
│   │   ├── (dashboard)/      # Dashboard, Settings, Query pages
│   │   └── api/              # API routes
│   │       ├── auth/         # NextAuth endpoints
│   │       ├── register/     # User registration
│   │       ├── settings/     # API key management
│   │       └── queries/      # Query CRUD + run + download
│   ├── components/           # Sidebar & shared components
│   ├── lib/                  # MongoDB connection, Auth config, Countries
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

---

## 🔒 Security

- Passwords are hashed with **bcrypt** (12 rounds)
- API keys are stored encrypted per-user in MongoDB
- Session management via **NextAuth.js** with JWT strategy
- All API routes require authentication

---

## 📄 License

MIT

---

<div align="center">

**Built by [PDLAB](https://github.com/gunjanpdlab)**

</div>
