# KEMS — Knowledge Event Management System

A campus venue-booking and event-management platform built for a university
(KNUST). Students and lecturers request auditoriums, registrars approve and
manage venues and events, external users ("outsiders") book and pay online —
all with email/SMS notifications and an AI assistant that helps users
discover events.

## Features

- **Multi-role accounts** — Student, Lecturer, Registrar, and Outsider
  (external organizer) roles with JWT auth served via HttpOnly cookies.
- **Venue booking workflow** — insiders submit booking requests for campus
  auditoriums (Great Hall, IDL Conference Centre, CCB, Kumapley Auditorium,
  parade grounds, …); the registrar assigns venues, sets capacity, and
  approves requests with terms & conditions.
- **Event management** — registrars post events; users browse public events,
  follow tags, and get invited events; saved-events list per user.
- **Online payments** — Paystack checkout and webhook signature verification
  for outsider bookings.
- **Notifications** — transactional email via SendGrid (Brunei-style HTML
  templates) and SMS via Hubtel.
- **Evette AI assistant** — an OpenAI-powered chatbot that answers questions
  and recommends events based on a user's preferences and upcoming schedule.

## Tech stack

| Layer    | Technology                                                        |
|----------|-------------------------------------------------------------------|
| Backend  | Django 4.2, Django REST Framework, SimpleJWT                      |
| Frontend | React 18, Vite, Tailwind CSS, Material Tailwind, MUI, Radix UI    |
| Database | SQLite (development)                                              |
| Email    | SendGrid                                                          |
| SMS      | Hubtel                                                            |
| Payments | Paystack                                                          |
| AI       | OpenAI (Evette chatbot)                                           |

## Project structure

```
kems/                    # Django backend
├── booking/             # Venues, booking requests, registrar workflow, payments
├── core/                # Events, tags, saved events, Evette chatbot, email/SMS services
├── users/               # Custom user model (student/lecturer/registrar/outsider)
├── kems_backend/        # Settings, URLs, ASGI/WSGI
├── media/               # Seeded event & venue images
└── templates/           # Email HTML templates

kems_frontend/           # React (Vite) frontend
└── src/
    ├── pages/           # Role-based dashboards, booking, events, payments
    ├── components/      # UI kit (Radix-based) and shared components
    ├── services/        # Axios API clients
    └── contexts/        # Auth & toast contexts
```

## Getting started

### Backend

```bash
cd kems
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill in the keys you have
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API is served at `http://localhost:8000/api/`.

### Frontend

```bash
cd kems_frontend
npm install
cp .env.example .env            # point VITE_API_BASE_URL at the backend
npm run dev
```

The app runs at `http://localhost:5173`.

## Environment variables

Backend (`kems/.env`) — all keys are optional except `SECRET_KEY`;
features degrade gracefully when a provider key is missing.

| Variable                   | Purpose                                   |
|----------------------------|-------------------------------------------|
| `SECRET_KEY`               | Django secret key                         |
| `DEBUG`                    | `True` for development (default)          |
| `ALLOWED_HOSTS`            | Comma-separated host list                 |
| `FRONTEND_URL`             | Used for links in emails                  |
| `JWT_SECRET_KEY`           | Signing key for tokens                    |
| `PAYSTACK_SECRET_KEY`      | Paystack payments                         |
| `PAYSTACK_PUBLIC_KEY`      | Paystack inline checkout                  |
| `PAYSTACK_WEBHOOK_SECRET`  | Webhook signature verification            |
| `SENDGRID_API_KEY`         | Transactional email                       |
| `DEFAULT_FROM_EMAIL`       | Sender address for email                  |
| `HUBTEL_API_KEY` / `HUBTEL_API_SECRET` / `HUBTEL_SENDER_ID` | SMS |
| `OPENAI_API_KEY`           | Evette chatbot                            |
| `OPENAI_MODEL`             | Chat model (default `gpt-3.5-turbo`)      |

Frontend (`kems_frontend/.env`):

| Variable                  | Purpose                                    |
|---------------------------|--------------------------------------------|
| `VITE_API_BASE_URL`       | Backend URL (default `/api` via Vite proxy)|
| `VITE_FRONTEND_URL`       | This app's public URL                      |
| `VITE_PAYSTACK_PUBLIC_KEY`| Paystack inline checkout                   |

## Notes

- All third-party credentials are read from environment variables — never
  commit real keys.
- `kems/media/` contains seeded demo images for venues and events.
