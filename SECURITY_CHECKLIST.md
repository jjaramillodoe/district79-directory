# Security Checklist - Before Committing to GitHub

## ✅ Files Protected (Already in .gitignore)

- ✅ `.env.local` - Environment variables with secrets
- ✅ `.env`, `.env.production`, `.env.development` - Environment files
- ✅ `.DS_Store` - macOS system files
- ✅ `*.log` - Log files
- ✅ `*.pem`, `*.key`, `*.crt` - Certificates and keys
- ✅ IDE files (`.vscode/`, `.idea/`)
- ✅ Build and cache directories

## 🔒 Sensitive Information to NEVER Commit

### Environment Variables (Required in .env.local):
- `MONGODB_URI` - MongoDB connection string (may contain credentials)
- `MAPBOX_ACCESS_TOKEN` - Mapbox API token
- `ADMIN_PASSWORD` - Admin password hash (bcrypt)
- `JWT_SECRET` - JWT signing secret

### Files to Review:

1. **CSV Files** (Currently NOT ignored)
   - `District 79 Site List - 25-26 SY(Adult Ed).csv`
   - `District 79 Site List - 25-26 SY(Youth Programs).csv`
   - ⚠️ **Contains PII**: Email addresses, phone numbers, names
   - **Decision needed**: Should these be public or private?
   - **If private**: Uncomment `# *.csv` in `.gitignore`

2. **Scripts**
   - `scripts/transfer-to-production.js` - ✅ Safe (only uses environment variables)
   - `scripts/hash-password.js` - ✅ Safe (no secrets)

## 🛡️ Security Audit Results

### ✅ Good Practices Found:
- ✅ All secrets loaded from `process.env` - no hardcoded credentials
- ✅ `.env.local` properly ignored
- ✅ No hardcoded API keys or tokens in code
- ✅ MongoDB URIs only in environment variables
- ✅ JWT secrets only in environment variables
- ✅ Scripts use environment variables, not hardcoded values

### ⚠️ Items to Consider:

1. **CSV Files with PII**
   - If this is a public repo, consider if CSV files with email addresses and phone numbers should be committed
   - If private repo, still consider GDPR/privacy implications
   - **Recommendation**: Review if CSV files should be in `.gitignore`

2. **Environment Variables Documentation**
   - Consider creating a `.env.example` file with placeholder values
   - Document required environment variables in README

## 📋 Pre-Commit Checklist

Before pushing to GitHub:

- [ ] No `.env.local` file is tracked
- [ ] No hardcoded credentials in code
- [ ] CSV files decision made (include or ignore?)
- [ ] All API keys/tokens are in environment variables only
- [ ] No console.log statements with sensitive data
- [ ] No credentials in commit messages

## 🔍 How to Verify

```bash
# Check what files will be committed
git status

# Search for potential secrets (before committing)
git diff --cached | grep -i "password\|secret\|key\|token"

# Verify .env.local is ignored
git check-ignore .env.local
```

## 💡 Recommendations

1. **Create `.env.example`** file:
   ```
   MONGODB_URI=mongodb://localhost:27017
   MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
   ADMIN_PASSWORD=your_bcrypt_hash_here
   JWT_SECRET=your_jwt_secret_here
   ```

2. **Consider CSV files**: If they contain sensitive PII, add `*.csv` to `.gitignore`

3. **Use GitHub Secrets**: For production deployments, use environment variables in Vercel/GitHub Actions

4. **Review commit history**: If you've already committed sensitive data, use `git filter-branch` or BFG Repo-Cleaner to remove it

