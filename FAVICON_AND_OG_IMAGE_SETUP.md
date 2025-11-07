# Favicon and Open Graph Image Setup Guide

This guide explains how to properly set up your favicon and social media preview images (Open Graph) for the District 79 Directory website.

## ✅ What's Already Done

- ✅ Favicon exists at `app/favicon.ico`
- ✅ Open Graph metadata added to `app/layout.tsx`
- ✅ District 79 logo available at `public/images/d79logo.png`

## 📋 What You Need to Create

### 1. Open Graph Image (Required for Social Media Previews)

When someone shares your website on Facebook, Twitter, LinkedIn, Slack, etc., this image will appear.

**File:** `public/images/og-image.png`  
**Size:** 1200 x 630 pixels  
**Format:** PNG or JPG

#### Design Recommendations:
- Use your District 79 logo prominently
- Add text: "District 79 Directory"
- Subtitle: "Adult Education & Youth Programs"
- Background: NYC DOE blue or white
- Keep important content in the center (avoid edges)

#### Quick Options to Create OG Image:

**Option 1: Use Canva (Recommended - Free)**
1. Go to [canva.com](https://www.canva.com)
2. Create new design → Custom size: 1200 x 630px
3. Use template or create from scratch
4. Add your logo from `public/images/d79logo.png`
5. Add text and styling
6. Download as PNG
7. Save to `public/images/og-image.png`

**Option 2: Use Figma**
1. Create frame: 1200 x 630px
2. Design your preview card
3. Export as PNG

**Option 3: Use Online OG Image Generator**
- [og-playground.vercel.app](https://og-playground.vercel.app/)
- [metatags.io](https://metatags.io/)

**Option 4: Simple Design with Current Logo**
If you want to quickly use your existing logo:
1. Open an image editor (Photoshop, GIMP, Preview, etc.)
2. Create a 1200 x 630px canvas with white or blue background
3. Place your `d79logo.png` in the center
4. Add text "District 79 Directory" below it
5. Save as `og-image.png`

### 2. Apple Touch Icon (Optional but Recommended)

This appears when users add your site to their iPhone/iPad home screen.

**File:** `public/apple-touch-icon.png`  
**Size:** 180 x 180 pixels  
**Format:** PNG

Create from your favicon or logo, sized to 180x180px.

### 3. Additional Favicon Sizes (Optional)

For better browser compatibility:

**Files to create in `public/` directory:**
- `favicon-16x16.png` (16 x 16 pixels)
- `favicon-32x32.png` (32 x 32 pixels)
- `favicon-96x96.png` (96 x 96 pixels)
- `favicon-192x192.png` (192 x 192 pixels) - Android
- `favicon-512x512.png` (512 x 512 pixels) - Android

You can use a favicon generator like [realfavicongenerator.net](https://realfavicongenerator.net/) to create all sizes at once.

## 🎨 Design Specifications

### Brand Colors (NYC DOE)
- **Primary Blue:** #0078D4 or #003F87
- **White:** #FFFFFF
- **Black Text:** #000000 or #1A1A1A

### Typography
- Use clear, readable fonts
- Keep text minimal but descriptive
- Include "NYC Department of Education" if space allows

### Layout Suggestions for OG Image

```
┌─────────────────────────────────────────────┐
│                                             │
│           [District 79 Logo]                │
│                                             │
│         District 79 Directory               │
│    Adult Education & Youth Programs         │
│                                             │
│         NYC Department of Education         │
│                                             │
└─────────────────────────────────────────────┘
        1200 x 630 pixels
```

## 📁 File Structure After Setup

```
district79-directory/
├── app/
│   └── favicon.ico ✅ (already exists)
├── public/
│   ├── apple-touch-icon.png ⚠️ (create this)
│   ├── images/
│   │   ├── og-image.png ⚠️ (create this - most important!)
│   │   ├── d79logo.png ✅ (already exists)
│   │   └── nycpublicshools.png ✅ (already exists)
│   └── favicon-*.png (optional additional sizes)
```

## 🧪 Testing Your Setup

### Test Favicon
1. Visit your site: `https://district79-directory.vercel.app`
2. Check browser tab - should show your favicon
3. Test in multiple browsers (Chrome, Safari, Firefox)

### Test Open Graph Image

**Option 1: Facebook Sharing Debugger**
1. Go to [developers.facebook.com/tools/debug](https://developers.facebook.com/tools/debug/)
2. Enter: `https://district79-directory.vercel.app`
3. Click "Debug"
4. You should see your OG image preview

**Option 2: Twitter Card Validator**
1. Go to [cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator)
2. Enter your URL
3. Preview the card

**Option 3: LinkedIn Post Inspector**
1. Go to [linkedin.com/post-inspector](https://www.linkedin.com/post-inspector/)
2. Enter your URL
3. See the preview

**Option 4: Generic OG Preview Tool**
1. Go to [metatags.io](https://metatags.io/)
2. Enter your URL
3. See preview for all platforms

### Test in Slack/Discord
Just paste your URL in a message and see the preview!

## 🚀 Quick Start Checklist

- [ ] Create `og-image.png` (1200x630) → Save to `public/images/`
- [ ] Create `apple-touch-icon.png` (180x180) → Save to `public/`
- [ ] Commit and push changes
- [ ] Wait for Vercel deployment
- [ ] Test with Facebook Debugger
- [ ] Test by sharing URL on Slack/Discord
- [ ] Check favicon in browser tab

## 💡 Tips

1. **Keep it simple** - OG images should be readable even when small
2. **Test on mobile** - Many people will see this on phones
3. **Avoid text at edges** - Social platforms crop differently
4. **Use high contrast** - Makes text readable on any background
5. **Update cache** - After uploading, use Facebook Debugger to clear cache

## 📝 Current Metadata (Already Configured)

Your site is already configured with:
- ✅ Open Graph tags for Facebook, LinkedIn, etc.
- ✅ Twitter Card tags
- ✅ Favicon references
- ✅ Apple touch icon reference
- ✅ SEO metadata (title, description, keywords)

**You just need to create the image files!**

## 🔧 Updating the OG Image Later

If you update `og-image.png`:
1. Replace the file in `public/images/`
2. Commit and push
3. Clear cache using Facebook Debugger
4. Some platforms cache for 24 hours, so be patient

## 🆘 Need Help?

If you need someone to design the OG image professionally:
- Hire on Fiverr ($5-20)
- Ask your marketing/design team
- Use Canva templates (free)

---

**Most Important:** Create `public/images/og-image.png` at 1200x630 pixels. This is what people will see when they share your site!

