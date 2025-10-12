## Relevant Files

- `src/app/page.tsx` - Main page for the application.
- `src/app/layout.tsx` - Root layout for the application.
- `src/app/globals.css` - Global styles for the application.
- `src/components/Header.tsx` - Application header, likely to include login/logout.
- `src/components/UploadZone.tsx` - Component for handling image uploads.
- `src/components/PhotoGrid.tsx` - Component for displaying images in a grid.
- `src/components/AlbumPreview.tsx` - Component for previewing albums.
- `src/components/AlbumEditor.tsx` - Component for editing albums.
- `src/components/AlbumGenerationPanel.tsx` - Component for AI album generation.
- `src/components/ClientShare.tsx` - Potentially reusable for export functionality.
- `src/lib/aiAnalysis.ts` - Functions related to AI image analysis and tagging.
- `src/store/useAlbumStore.ts` - Zustand store for managing album state.
- `src/types/index.ts` - TypeScript type definitions.
- `src/app/sign-in/[[...sign-in]]/page.tsx` - Clerk sign-in page.
- `src/app/sign-up/[[...sign-up]]/page.tsx` - Clerk sign-up page.
- `middleware.ts` - Clerk authentication middleware.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Implement User Authentication
  - [x] 1.1 Choose and configure an authentication provider (Clerk.dev or Supabase Auth).
  - [x] 1.2 Implement user registration and login flows.
  - [x] 1.3 Create a basic account dashboard with gallery, settings, and logout options.
  - [x] 1.4 Secure user sessions.
  - [x] 1.5 Integrate authentication components into the `Header.tsx` and `layout.tsx`.
- [ ] 2.0 Develop Image Upload and Gallery Browsing
  - [ ] 2.1 Implement drag & drop image upload functionality using `UploadZone.tsx`.
  - [ ] 2.2 Develop auto-thumbnail creation upon upload.
  - [ ] 2.3 Create a gallery view with zoom and lightbox mode using `PhotoGrid.tsx` and `AlbumPreview.tsx`.
  - [ ] 2.4 Ensure responsive layout for desktop and mobile.
  - [ ] 2.5 Support JPG and PNG file formats for uploads.
  - [ ] 2.6 Integrate image storage with Supabase Storage or AWS S3.
- [ ] 3.0 Integrate AI Tagging and Smart Search
  - [ ] 3.1 Implement AI auto-tagging upon image upload (color palette, objects, subjects, faces) using `src/lib/aiAnalysis.ts`.
  - [ ] 3.2 Store tags and embeddings in the database (Supabase Postgres).
  - [ ] 3.3 Develop a search bar for queries like “blue sky,” “portrait,” “no people.”
  - [ ] 3.4 Implement quick filters for color and composition type.
  - [ ] 3.5 Explore integration with a vector database (Pinecone or Qdrant) for advanced similarity searches (future consideration).
- [ ] 4.0 Build Social Media Export
  - [ ] 4.1 Implement photo selection for export.
  - [ ] 4.2 Develop export options for single posts and carousel/sequences (basic ordering by color or subject similarity).
  - [ ] 4.3 Implement output as downloadable ZIP using `ClientShare.tsx`.
  - [ ] 4.4 Implement output as a shareable preview page.
- [ ] 5.0 Refine UI/UX and Prepare for Beta
  - [ ] 5.1 Implement minimal, crisp, and photographic UI/UX based on the PRD's visual direction.
  - [ ] 5.2 Optimize layout to focus on images with light UI and minimal distractions.
  - [ ] 5.3 Apply a dark gray/black background for gallery mode.
  - [ ] 5.4 Implement soft fades and quick feedback transitions for uploads and searches.
  - [ ] 5.5 Ensure all interactions feel instant.
  - [ ] 5.6 Conduct thorough testing and bug fixing.
  - [ ] 5.7 Prepare the application for private beta invitation to photographers.