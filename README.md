# 🧠 Smart Assistant for Research Summarization
DEMO live at: https://www.navarya.com

An AI-powered document-aware assistant that allows users to upload structured research papers, legal docs, or reports in PDF/TXT format and interact with them via two powerful modes:

- 💬 **Ask Anything** – Ask any question based on the uploaded document.
- 🧠 **Challenge Me** – Get logic-based questions generated from the document, attempt answers, and receive feedback with explanations.

Each answer is context-aware, backed by document references, and provides proper justification.

---

## 🚀 Features

- 📄 **Document Upload (PDF/TXT)**
- 🧾 **Auto Summary (≤150 words)**
- 💬 **Ask Anything Mode** with contextual QA
- 🧠 **Challenge Me Mode** with evaluation & feedback
- 📌 **Justified Answers** with references from source
- ✨ **Answer Highlighting**
- 🔐 **User Auth via Firebase**

---

## 🧱 Tech Stack

| Layer        | Tech Used             |
|--------------|-----------------------|
| 🖼 Frontend   | Next.js, Tailwind CSS |
| 🔐 Auth       | Firebase              |
| ⚙️ Backend    | FastAPI (Python)      |
| 🤖 AI Model   | DeepSeek API          |
| 📦 Parsing    | PyMuPDF, pdfminer, etc. |
| 💡 NLP Logic | chunk based processing  |
| 🧪 Env Mgmt   | Python venv           |

---

## 🛠️ Local Setup Instructions

### 1. 📦 Clone the Repository

```
git clone https://github.com/worldofaryavart/navarya.git
cd frontend
cd backend
```

##  🧪 Backend Setup (FastAPI)
a. Create and activate a virtual environment

```python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```
b. Install dependencies
```
pip install -r requirements.txt
```

c. Set environment variables
Create a .env file in the backend/ folder with:

DEEPSEEK_API_KEY=your_deepseek_api_key

d. Run the FastAPI server
```
uvicorn main:app --reload
```
3. 🎨 Frontend Setup (Next.js)
```
cd frontend
npm install
```
a. Set Firebase environment
Create a .env.local in frontend/ with your Firebase keys:

env

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

b. Start the frontend

npm run dev

