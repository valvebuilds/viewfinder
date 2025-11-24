# 🧭 PRD #002 — ViewFinder Web App (MVP)
*(Phase 2 of the ViewFinder project)*

## 1. Overview

**Product name:** ViewFinder  
**Goal:** Build the first functional version of the ViewFinder web app — a private beta focused on helping photographers upload, explore, and prepare their images for sharing or social export using AI-powered organization tools.

The app lives under the same domain as the landing page (**myviewfinder.io**) and will share its visual identity: clean, minimal, fast, and high-end.

## 2. Purpose

The MVP should:
1. Allow photographers to upload and browse images quickly.  
2. Use AI to **analyze and tag** images for fast searching.  
3. Offer a **smart search** experience (find by color, faces, subjects).  
4. Allow exporting curated selections for social media layouts or downloads.  
5. Include a secure **login system** so users can manage private galleries.  

## 3. Target Audience

- Professional or semi-pro photographers who shoot editorial, travel, portrait, or commercial work.  
- Not wedding-focused — ViewFinder positions itself as a tool for photographers who value aesthetics and workflow speed.  
- Early users will be private beta testers (invited photographers who provide feedback).  

## 4. MVP Feature Scope

### ✅ Core MVP Features
1. **Upload & Browse Galleries**  
   - Drag & drop upload (bulk images).  
   - Auto-thumbnail creation.  
   - Gallery view with zoom and lightbox mode.  
   - Responsive layout (desktop and mobile).  
   - File formats: JPG, PNG (RAW planned later).  

2. **Smart Search (AI-powered)**  
   - AI auto-tags images upon upload:  
     - Color palette  
     - Objects & subjects (people, buildings, landscapes)  
     - Presence of faces (no personal ID yet)  
   - Search bar allowing queries like “blue sky,” “portrait,” “no people.”  
   - Quick filters for color and composition type.  

3. **Social Media Export (first intelligent output)**  
   - Select photos → export as layout set.  
   - Export options:
     - Single post  
     - Carousel / sequence (basic ordering by color or subject similarity)  
   - Output as downloadable ZIP or shareable preview page.  

4. **User Authentication**  
   - Managed login via **Clerk.dev** or **Supabase Auth**.  
   - Basic account dashboard: galleries, settings, logout.  
   - Secure sessions, passwordless or email login.

## 5. Future (Post-MVP) Features

| Feature | Description |
|----------|--------------|
| **AI Sequencing (photo-book logic)** | Auto-arrange photos like a story based on color, subject, and composition. |
| **Client Review Mode** | Clients can view, flag, and comment on shared galleries. |
| **Face Recognition (opt-in)** | Identify recurring people within projects. |
| **Advanced Search** | “Find photos similar to this one.” |
| **Printing Integration** | Connect with lab APIs to print curated books or proofs. |

## 6. Non-Goals (Not in MVP)

- No client accounts or comments yet.  
- No drawing tools or annotation.  
- No AI-generated captions yet (reserved for later).  
- No RAW processing (JPG and PNG only).  
- No mobile app yet — only responsive web.

## 7. Visual & UX Direction

- **Look:** minimal, crisp, photographic (Comet’s color palette).  
- **Layout:** focus on the images — light UI, minimal distractions.  
- **Theme:** dark gray/black background for gallery mode (better for viewing photos).  
- **Transitions:** soft fades, quick feedback for uploads and searches.  
- **Speed:** every interaction should feel instant — upload progress, tag results, search updates.

## 8. Technical Architecture (Explained Simply)

### Frontend
- **Framework:** Next.js (React) — fast, SEO-friendly, perfect for Cursor.  
- **Styling:** Tailwind CSS or custom SCSS for simplicity.  
- **Hosting:** Vercel (connects directly from Cursor).  
- **Auth:** Clerk.dev or Supabase Auth.

### Backend
- **File Storage:**  
  - Start with **Supabase Storage** or **AWS S3** (cloud storage for images).  
  - Stores original + resized thumbnails.  
- **Database:**  
  - Supabase Postgres (stores users, galleries, and tags).  
- **AI Tagging Pipeline:**  
  - External APIs for analysis (use best tool per job):  
    - **GPT-Vision:** for complex composition or color reasoning.  
    - **HuggingFace / Replicate / Clarifai:** for simple tagging (cheaper).  
  - Store tags and embeddings in the database for fast searching.

### Smart Search
- Store each image’s metadata (tags, dominant color, simple embeddings).  
- Simple query system that filters by tags or color similarity.  
- Future: connect to a **vector database (like Pinecone or Qdrant)** for advanced similarity searches.

## 9. Balancing GPT-Vision and Open-Source Models

| Task | Recommended Model | Cost / Note |
|------|-------------------|--------------|
| Tagging objects, people, colors | HuggingFace (e.g., ViT or CLIP) | Fast, low cost |
| Composition / storytelling | GPT-4 Vision | Use on-demand (not for every photo) |
| Color analysis & palettes | OpenCV / Python libraries | Free & local |
| Face detection (not recognition) | OpenCV / YOLOv8 | Fast, no PII |
| Text captioning (optional) | BLIP or GPT-4 Vision | Optional later |

**Logic:**  
- Run local or free models for batch tagging (speed + cost).  
- Call GPT-Vision only for premium tasks (story, curation, sequencing).  
- This hybrid system keeps cost down and performance up.

## 10. Storage & Performance Strategy (Plain Terms)

- All uploads go directly from user’s browser to cloud storage (not via your server) for **speed**.  
- Each upload triggers a background **AI tagging job**.  
- Results saved in database → instant availability for search.  
- CDN (content delivery network) used to serve images quickly worldwide (Vercel or Cloudflare).  
- Estimated load: 1GB per photographer for MVP tests → totally fine on free tiers.

## 11. Estimated Costs (Per Month, MVP Scale)

| Component | Tool | Cost |
|------------|------|------|
| Hosting | Vercel (Hobby plan) | Free |
| Database & Auth | Supabase | Free → $25 if upgraded |
| Storage | Supabase / AWS S3 | Free (small usage) |
| AI Tagging (GPT-Vision calls) | OpenAI API | $20–$50 depending on usage |
| Email/Auth service | Clerk.dev | Free up to 100 users |
| Automation / Webhooks | Make.com | $10 |
| Analytics | Plausible | $10 |
| **Total (approx.)** |  | **$40–$90 / month (beta)** |

## 12. Success Metrics

- First 10 photographers successfully upload and browse galleries.  
- Smart search returns accurate results in <2 seconds.  
- Export feature used by ≥50% of active beta testers.  
- Feedback: ≥80% say app feels “fast” and “professional.”  

## 13. Development Roadmap (Simple Steps)

| Phase | Focus | Deliverable |
|-------|--------|-------------|
| **Phase 1** | Auth + Upload | Working login + gallery upload |
| **Phase 2** | AI Tagging | Auto-tagging + basic search |
| **Phase 3** | Smart Search | Color/subject search, filters |
| **Phase 4** | Export | Social media layout export |
| **Phase 5** | Polish & Test | Invite photographers (private beta) |

## 14. Future-Proofing

- Modular architecture: each AI step runs separately (you can replace models easily).  
- External APIs (OpenAI, Supabase) ensure you don’t have to manage infrastructure.  
- Prepared for future mobile app (PWA-compatible front-end).  
- All data stored securely, ready for scaling with real-time database (Supabase).

## 15. Future Expansions

| Feature | Description |
|----------|--------------|
| **Client Review Links** | Clients flag favorites, add notes. |
| **AI Sequencing** | Create photo stories or “photo-book” layouts. |
| **AI Captioning** | Generate text suggestions for social posts. |
| **Team Collaboration** | Multiple photographers per workspace. |
| **Printing Integration** | API to send curated sets to print labs. |

## 16. Open Questions

1. Should AI tagging run **automatically on upload**, or should users click “Analyze” to save credits?  
2. Will the export feature directly connect to Instagram later, or remain a download-only tool?  
3. Should the private beta include 5–10 real photographers or stay invite-only until stability improves?  

## 17. Summary

ViewFinder’s MVP web app will focus on **speed, clarity, and quality** — giving photographers a taste of the workflow revolution you’re building:  
upload → AI-organize → search → export.  

Everything beyond that (sequencing, captions, collaboration) will layer naturally on top once this foundation is stable.
