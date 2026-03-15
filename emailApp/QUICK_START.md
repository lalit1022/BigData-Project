# ⚡ Quick Start Guide

**Get the Email Classification System running in 5 minutes!**

---

## 🚀 Frontend Only (No Backend)

Want to see the UI immediately? Here's how:

```bash
# 1. Clone/Download the project
cd email-classification-frontend

# 2. Install dependencies
npm install
# or
pnpm install

# 3. Start development server
npm run dev

# 4. Open browser
# http://localhost:5173
```

✅ **Done!** You'll see the inbox with 22 sample emails.

**Features you can test:**
- ✅ Browse emails
- ✅ Filter by category
- ✅ Toggle dark/light mode
- ✅ Click email to view details
- ✅ View model stats
- ⚠️ Classification requires backend

---

## 🔌 With Backend (Full Functionality)

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB running

### Step 1: Start MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# MongoDB runs as service automatically

# Verify
mongosh
# Should connect successfully
```

### Step 2: Set Up Backend

Create `backend/app.py`:

```python
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/emails')
def get_emails():
    return jsonify([])  # Empty for now

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

Install dependencies:

```bash
pip install Flask Flask-CORS pymongo
```

Run backend:

```bash
python app.py
# Server running on http://localhost:5000
```

### Step 3: Start Frontend

```bash
# In frontend directory
npm run dev
```

### Step 4: Test Integration

1. Open http://localhost:5173
2. Click "Classify one"
3. Fill form and submit
4. Email appears in list ✅

---

## 📝 Quick Test with cURL

Test if backend is working:

```bash
# Test email endpoint
curl http://localhost:5000/api/emails

# Should return: []
```

---

## 🎯 File to Edit for Backend URL

If your backend is NOT on `localhost:5000`, edit:

**File:** `/src/app/api.js`

```javascript
// Line 2
const API_BASE_URL = 'http://YOUR_BACKEND_URL';
// Example: 'https://api.example.com'
```

Then rebuild:

```bash
npm run build
```

---

## 📚 Need More Help?

| Question | Document |
|----------|----------|
| "How do I set up everything?" | **SETUP_GUIDE.md** |
| "What are the API endpoints?" | **API_DOCUMENTATION.md** |
| "How does it work?" | **ARCHITECTURE.md** |
| "What features exist?" | **README.md** |
| "What changed?" | **CHANGELOG.md** |

---

## 🐛 Common Issues

### Issue: "Port 5173 already in use"

**Solution:**
```bash
# Kill process using port
lsof -ti:5173 | xargs kill -9

# Or specify different port
npm run dev -- --port 3000
```

### Issue: "Cannot connect to backend"

**Solution:**
1. Verify Flask is running: `curl http://localhost:5000/api/emails`
2. Check CORS is enabled in Flask
3. Verify `API_BASE_URL` in `/src/app/api.js`

### Issue: "MongoDB connection failed"

**Solution:**
```bash
# Check if MongoDB is running
mongosh

# If not, start it
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

---

## 🎨 Quick Customization

### Change Category Colors

**File:** `/src/app/components/EmailRow.jsx`

```javascript
const categoryConfig = {
  Primary: {
    color: '#YOUR_COLOR',     // Change this
    bgColor: '#YOUR_BG',      // And this
    textColor: '#YOUR_TEXT'   // And this
  }
};
```

### Change App Title

**File:** `/index.html`

```html
<title>Your App Name</title>
```

### Add Logo

**File:** `/public/logo.png`

Then update `/src/app/App.jsx`:

```javascript
<img src="/logo.png" alt="Logo" />
```

---

## 🚢 Quick Deploy

### Vercel (Fastest)

```bash
npm install -g vercel
vercel --prod
```

### Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
```

### GitHub Pages

```bash
# Add to package.json:
"homepage": "https://username.github.io/repo-name",

npm run build
# Deploy dist/ folder
```

---

## ✅ Verify Everything Works

| Feature | Test |
|---------|------|
| Email list | ✅ See 22 sample emails |
| Dark mode | ✅ Click sun/moon icon |
| Categories | ✅ Click tabs and sidebar |
| Email detail | ✅ Click any email |
| Model stats | ✅ Click "Model Stats" in sidebar |
| Classification | ⚠️ Requires backend |
| CSV upload | ⚠️ Requires backend |

---

**That's it! You're ready to go! 🎉**

For full details, see **README.md** or **SETUP_GUIDE.md**.
