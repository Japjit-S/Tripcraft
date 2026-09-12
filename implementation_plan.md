# Build Frontend Foundation for Roamwise

This plan outlines the steps to build the frontend foundation for the Roamwise travel itinerary app using Next.js, TypeScript, and Tailwind CSS, strictly using mock data for now.

## Goal Description

Initialize the Next.js project and create the core UI shell, routing, and component architecture for Roamwise. The focus is on establishing the functional flow (Planner, Trip Workspace, My Trips, Auth) with a clear separation between the UI and the data layer (currently mocked).

## Open Questions

Since we are using mock data, I will set up a dedicated `lib/mockData.ts` file to hold our typed mock itineraries and users. Is there any specific city or dummy data you would like me to use for the primary mock trip?

## Proposed Changes

### Setup & Configuration

- Initialize a Next.js (App Router), TypeScript, and Tailwind CSS project in the `antigravity working folder`.
- Configure basic global styles and neutral theme settings.

### Components (Reusable UI)

- **Layout**: `SidebarNav` (Left navigation), `AppLayout` (Main wrapper).
- **Planner**: `TripForm` (inputs for city, date, duration, persona, arrival details).
- **Trip Workspace**:
  - `WorkspaceLayout`: Main area for itinerary, sidebar for calendar/notes.
  - `ItineraryDay`: Morning/Afternoon/Evening breakdown.
  - `ItineraryItem`: Activity card with reason, tags.
  - `MapPlaceholder`: Static placeholder component that updates state on item selection.
  - `WeatherSummary`: Simple weather card.
  - `DayNotes`: Free-form text area for day-specific notes.
- **My Trips**: `TripCard`, `EmptyState`, `DeleteDialog`.

### Routes (Pages)

- `/planner`: The trip generation form.
- `/trip/[id]`: The trip workspace displaying a selected itinerary.
- `/trips`: My Trips dashboard.
- `/login` & `/signup`: temporary auth views.

### Data Layer

- **Types**: `Itinerary`, `ItineraryDay`, `ItineraryItem`, `Profile`, etc.
- **Mock Service**: Functions like `getTrip(id)`, `getUserTrips()`, `generateTrip(params)` returning mock data.

## Verification Plan

### Manual Verification
- Start the development server (`npm run dev`).
- Navigate through `/planner` -> `/trip/1` -> `/trips`.
- Verify form validation on the planner.
- Verify selecting a day updates the Day Notes view.
- Verify selecting an itinerary item updates the mock selected-place state for the map placeholder.
- Ensure the layout is responsive and styled neutrally with Tailwind.

## Phase 2: UI Redesign (Inspiration Alignment)

To better align the `/trip/[id]` workspace with the provided design inspiration, the following structural updates are planned:

- **Top-Right User Profile (PFP)**: Introduce a user profile component (Name, Profile Picture, and potentially a notification bell/flag) at the top right of the application (e.g. top of the right sidebar or header) to reflect the logged-in state.
- **Map Relocation**: Move the `MapPlaceholder` out of the right sidebar and position it within the main content area. In the inspiration, it sits as a tall column to the left of the "To do's" list.
- **Further Layout Adjustments**: (Pending discussion on how to adapt the banner, stat cards, and itinerary list to match the remaining structure).
