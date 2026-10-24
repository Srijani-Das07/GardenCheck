# GardenCheck

GardenCheck is a full-stack web application for tracking the care of household and garden plants. It records plant species and their care requirements, the individual plants a user owns, and a history of care actions and health observations. From this history it calculates when each plant is next due for watering and fertilizing, and shows that status on the dashboard with colour-coded indicators.

The application uses a Node.js and Express REST API, a hosted SQLite-compatible database (Turso, accessed through libSQL), and a plain HTML, CSS and JavaScript frontend with no build step.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Due Status Calculation](#due-status-calculation)
- [Setup and Installation](#setup-and-installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Validation and Error Handling](#validation-and-error-handling)
- [Known Limitations](#known-limitations)
- [Possible Improvements](#possible-improvements)

---

## Features

**Accounts**
- Registration with name, email and password. Emails are trimmed and lowercased; passwords must be at least 6 characters and are hashed with bcrypt (10 salt rounds) before storage.
- Login against the stored hash. On success the user record (id, name, email) is kept in the browser's `sessionStorage`, and logout clears it.

**Species catalogue**
- Create, edit and delete species with a name, watering interval in days, sunlight needs (Low, Indirect, Direct), fertilizing interval, ideal temperature range in °C, and difficulty level (Easy, Medium, Hard).
- The fertilizing interval is chosen in the interface from fixed presets (14, 21, 30, 45, 60 or 90 days) or set to "No fertilizer needed".
- A species cannot be deleted while any plant still references it.

**Plants**
- Add, edit and delete plants. Each plant has a species, an optional nickname, a date acquired and an optional location.
- Deleting a plant also deletes all of its care and health logs.
- Plants are displayed as cards showing species, location, acquisition date, and watering and fertilizing status.

**Activity logging**
- Care actions: watered, fertilized, repotted, pruned, each with a date and optional notes.
- Health updates: thriving, struggling or dead, each with a date.
- The "Fertilized" option is hidden for plants whose species has no fertilizing interval.

**History**
- A per-plant history view merges care and health logs, sorted newest first. The five most recent entries are shown by default, with a "Show all" option for the full list.

**Due status indicators**
- Each plant card shows a watering message and, when applicable, a fertilizing message, coloured by urgency:
  - **Red**: due today or overdue (with the number of days overdue)
  - **Amber**: due within the next 3 days
  - **Green**: due more than 3 days from now
  - **Gray**: no activity of that type has been logged yet
- A status dot on each card reflects the more urgent of the two statuses.

**Interface**
- Two-page layout (My Garden and Species) with tab navigation, modal forms, toast notifications for success and error messages, and empty-state guidance that directs a new user to add a species before adding plants.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Web framework | Express 4 |
| Database | Turso (hosted libSQL / SQLite) via `@libsql/client` |
| Password hashing | `bcryptjs` |
| Configuration | `dotenv` |
| Cross-origin requests | `cors` |
| Frontend | HTML, CSS and vanilla JavaScript (Fetch API), no framework or bundler |

---

## Project Structure

```
GardenCheck/
├── db/
│   └── schema.sql              # Table definitions, constraints and indexes
├── public/                     # Static frontend served by Express
│   ├── login.html              # Login and registration page
│   ├── auth.js                 # Login/registration logic
│   ├── index.html              # Main dashboard (My Garden, Species, modals)
│   ├── app.js                  # Dashboard logic: species, plants, logs, history, due status
│   └── style.css               # Styles for both pages
├── server/
│   ├── index.js                # Express app setup, route mounting, static serving
│   ├── db.js                   # libSQL client initialisation
│   ├── middleware/
│   │   └── errorHandler.js     # Central error-to-HTTP-response mapping
│   ├── models/                 # SQL queries, one module per entity
│   │   ├── userModel.js
│   │   ├── speciesModel.js
│   │   ├── plantModel.js
│   │   ├── careLogModel.js
│   │   ├── healthLogModel.js
│   │   └── dueStatusModel.js
│   ├── routes/                 # Express routers with input validation
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── species.js
│   │   ├── plants.js
│   │   ├── careLogs.js
│   │   ├── healthLogs.js
│   │   └── dueStatus.js
│   └── utils/
│       ├── AppError.js         # Error class carrying an HTTP status code
│       └── asyncHandler.js     # Forwards rejected promises to the error handler
├── .env.example
├── package.json
└── package-lock.json
```

---

## Architecture

The backend follows a layered route, model and database structure:

1. **Routes** (`server/routes/`) receive HTTP requests, validate required fields and allowed values, and throw `AppError` instances for invalid input.
2. **Models** (`server/models/`) contain all SQL. Every query uses parameterised arguments (`?` placeholders), not string concatenation.
3. **Database client** (`server/db.js`) creates one shared libSQL client from environment variables and fails at startup if they are missing.
4. **Error handling**: each async route is wrapped in `asyncHandler`, so any thrown or rejected error reaches `errorHandler.js`, which converts it into a JSON response with an appropriate status code.

The Express server also serves the `public/` directory as static files. A request to `/` returns `login.html`. Unmatched `/api` routes return a JSON 404.

The frontend uses no framework. `app.js` keeps species, plants and due status in in-memory caches, calls the API through a small `fetch` wrapper, and re-renders the relevant section after each change.

---

## Database Schema

Defined in `db/schema.sql`. Foreign keys are declared with `PRAGMA foreign_keys = ON`.

| Table | Purpose | Key columns and constraints |
|---|---|---|
| `users` | Registered accounts | `email` is `UNIQUE`; `password` stores the bcrypt hash; `created_at` defaults to the current timestamp |
| `species` | Care requirements per species | `watering_interval_days > 0` (required); `fertilizing_interval_days` is either NULL or `> 0`; `difficulty_level` is one of `Easy`, `Medium`, `Hard` |
| `plants` | Plants owned by a user | `user_id` references `users` (`ON DELETE CASCADE`); `species_id` references `species`; `date_acquired` required |
| `care_logs` | Care actions performed | `plant_id` references `plants` (`ON DELETE CASCADE`); `action_type` is one of `watered`, `fertilized`, `repotted`, `pruned` |
| `health_logs` | Health observations | `plant_id` references `plants` (`ON DELETE CASCADE`); `status` is one of `thriving`, `struggling`, `dead` |

Indexes exist on `plants(user_id)`, `plants(species_id)`, `care_logs(plant_id)` and `health_logs(plant_id)`.

**Relationships:** one user has many plants; one species is used by many plants; one plant has many care logs and many health logs. Species are global and not tied to a user.

**Cascading deletes:** cascades are declared in the schema, but the application does not depend on them. Deleting a plant or a user runs explicit `DELETE` statements for the dependent rows inside a single `db.batch(..., "write")` call, so the related logs are removed whether or not foreign key enforcement is active on the connection.

---

## Due Status Calculation

Due status is calculated in SQL by `dueStatusModel.js` and returned by `GET /api/due_status/:userId`. For each of the user's plants, the query:

1. Joins the plant to its species to get `watering_interval_days` and `fertilizing_interval_days`.
2. Uses two grouped subqueries over `care_logs` to find the most recent `watered` date and the most recent `fertilized` date.
3. Calculates days overdue as:

   ```
   days_overdue = CAST(julianday('now') - julianday(last_date) AS INTEGER) - interval_days
   ```

   A positive value means overdue, zero means due today, and a negative value means the number of days remaining.
4. Returns `NULL` when no action of that type has been logged, or (for fertilizing) when the species has no fertilizing interval.

The frontend (`computeWaterInfo` and `computeFertilizeInfo` in `app.js`) adds the interval to the last action date to show the next due date (for example, "Mon, 3 Nov") and assigns the red, amber, green or gray class from the overdue value.

---

## Setup and Installation

### Prerequisites

- Node.js and npm. No engine version is pinned in `package.json`; a current LTS release of Node.js is recommended.
- A Turso database and auth token, created through the [Turso CLI](https://docs.turso.tech/cli/introduction) or dashboard.

### Steps

1. **Clone the repository and install dependencies**

   ```bash
   git clone https://github.com/Srijani-Das07/GardenCheck.git
   cd GardenCheck
   npm install
   ```

2. **Create the database and apply the schema**

   ```bash
   turso db create gardencheck
   turso db shell gardencheck < db/schema.sql
   ```

   The repository has no migration runner or seed script, so the schema must be applied manually once. The database starts empty, with no species preloaded.

3. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in the values:

   ```env
   TURSO_DATABASE_URL=libsql://<database-name>-<org>.turso.io
   TURSO_AUTH_TOKEN=<auth-token>
   PORT=3000
   ```

   The database URL and token can be obtained with `turso db show gardencheck --url` and `turso db tokens create gardencheck`. The server refuses to start if either `TURSO_DATABASE_URL` or `TURSO_AUTH_TOKEN` is missing. `PORT` defaults to `3000`.

4. **Start the server**

   ```bash
   npm start
   ```

   The application is then available at `http://localhost:3000`.

---

## Usage

1. Open the application and register an account, or log in.
2. Go to the **Species** page and add at least one species with its watering interval and other care details. Plants cannot be added until a species exists.
3. Return to **My Garden**, select **+ Add Plant**, choose a species, and enter the acquisition date along with an optional nickname and location.
4. Use **Log Activity** on a plant card to record watering, fertilizing, repotting, pruning or a health update. Watering and fertilizing reminders begin once the first watering or fertilizing entry is logged.
5. Use **History** to view a plant's combined care and health timeline.

---

## API Reference

All endpoints are prefixed with `/api` and accept and return JSON.

### Authentication

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/auth/register` | `name`, `email`, `password` | Creates a user. Returns `201` with `id`, `name`, `email`, `created_at`. Returns `409` if the email is already registered. |
| POST | `/auth/login` | `email`, `password` | Verifies credentials. Returns `id`, `name`, `email`, or `401` for invalid credentials. |

### Users

| Method | Endpoint | Body | Description |
|---|---|---|---|
| PUT | `/users/:id` | `name`, `email` | Updates a user's name and email. |
| DELETE | `/users/:id` | | Deletes a user along with their plants and all related logs. |

### Species

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/species` | | Lists all species, ordered by name. |
| POST | `/species` | `name`, `watering_interval_days`, optional `sunlight_needs`, `fertilizing_interval_days`, `ideal_temp_min`, `ideal_temp_max`, `difficulty_level` | Creates a species. |
| PUT | `/species/:id` | Same as POST | Updates a species. Returns `404` if it does not exist. |
| DELETE | `/species/:id` | | Deletes a species. Returns `409` if any plant uses it. |

### Plants

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/plants/user/:userId` | | Lists a user's plants with species name and watering interval, newest first. |
| POST | `/plants` | `user_id`, `species_id`, `date_acquired`, optional `nickname`, `location` | Creates a plant. Returns `400` if the species does not exist. |
| PUT | `/plants/:id` | `species_id`, `date_acquired`, optional `nickname`, `location` | Updates a plant. Returns `404` if it does not exist. |
| DELETE | `/plants/:id` | | Deletes a plant and its care and health logs. |

### Care Logs

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/care_logs/plant/:plantId` | | Lists a plant's care logs, newest first. |
| POST | `/care_logs` | `plant_id`, `action_type`, `date_performed`, optional `notes` | Creates a care log. `action_type` must be `watered`, `fertilized`, `repotted` or `pruned`. |
| DELETE | `/care_logs/:id` | | Deletes a care log. |

### Health Logs

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/health_logs/plant/:plantId` | | Lists a plant's health logs, newest first. |
| POST | `/health_logs` | `plant_id`, `status`, `date_logged` | Creates a health log. `status` must be `thriving`, `struggling` or `dead`. |
| DELETE | `/health_logs/:id` | | Deletes a health log. |

### Due Status

| Method | Endpoint | Description |
|---|---|---|
| GET | `/due_status/:userId` | For each of the user's plants: last watered and fertilized dates, intervals, and days overdue for each. |

---

## Validation and Error Handling

Errors are returned as `{ "error": "<message>" }` with the following status codes:

| Status | Cause |
|---|---|
| `400` | Missing or invalid input (for example, an empty name, an invalid email format at registration, a password under 6 characters, a non-positive watering interval, an unknown action type or status, or a missing date) |
| `401` | Invalid login credentials |
| `404` | Updating a plant or species that does not exist, or an unknown API route |
| `409` | Duplicate email, deleting a species that is still in use, or any database `UNIQUE` or `FOREIGN KEY` constraint violation |
| `500` | Any other unhandled error, returned with a generic message; the full error is logged on the server |

Validation happens at two levels: the route handlers check input before it reaches the database, and the schema enforces `NOT NULL`, `CHECK`, `UNIQUE` and foreign key constraints as a second line of defence.

---

## Known Limitations

These limitations describe the current state of the code and are listed for transparency.

**Security**
- **No server-side authentication or authorization.** Login does not issue a session, cookie or token. The frontend stores the user object in `sessionStorage` and sends the user ID in request URLs and bodies. The API does not check who is making a request, so any client that knows or guesses an ID can read, modify or delete another user's plants, logs or account. The client-side login check only controls which page the browser shows.
- **Possible cross-site scripting (XSS).** The frontend builds HTML with `innerHTML` from user-provided values (species names, plant nicknames, locations, log notes) without escaping them.
- **Open CORS policy.** `cors()` is enabled with default settings, so requests from any origin are accepted.
- No rate limiting on the login and registration endpoints.

**Data and behaviour**
- Species are shared across all users. Any user can edit or delete any species, which affects every user whose plants use it.
- Temperature and interval values of `0` are stored as `NULL`, because both the frontend and the models use `value || null`. As a result, an ideal temperature of 0 °C cannot be saved.
- There is no check that `ideal_temp_min` is less than or equal to `ideal_temp_max`.
- Date fields are only checked for presence, not format, and future dates are accepted.
- Health status does not affect reminders. A plant whose latest health log is "dead" still shows watering and fertilizing reminders.
- Day differences are calculated with `julianday('now')`, which uses UTC on the database server. Near midnight, the "due today" or overdue count can differ by one day from the user's local date.
- Due status is only tracked from the first logged watering or fertilizing; the acquisition date is not used as a starting point.
- The due status query sorts by watering urgency, but the dashboard displays plants in creation order (newest first), not by urgency.

**Features present in the API but not in the interface**
- Updating a user's profile (`PUT /users/:id`) and deleting an account (`DELETE /users/:id`).
- Deleting individual care or health log entries.

**Tooling**
- No automated tests, linting configuration, development script (for example, auto-reload) or deployment configuration.
- No migration or seed scripts; the schema must be applied manually and the species catalogue starts empty.
- No responsive or mobile-specific layout rules in the stylesheet.

---

## Possible Improvements

- Add server-side sessions or signed tokens (for example, JWT), derive the user identity from them, and check resource ownership on every plant, log and user endpoint.
- Escape user content before rendering, or build DOM nodes with `textContent` instead of `innerHTML`.
- Restrict CORS to known origins and add rate limiting to the authentication endpoints.
- Scope species per user, or limit editing of shared species to administrators.
- Use explicit `null` and `undefined` checks instead of `|| null` so that zero values are stored correctly.
- Pause reminders for plants whose latest health status is "dead".
- Sort the dashboard by urgency and add filters by location or status.
- Add profile management, account deletion and log deletion to the interface.
- Add a seed script with common species, a migration step, and automated API tests.

---
