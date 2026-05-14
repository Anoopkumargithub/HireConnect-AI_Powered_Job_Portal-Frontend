# HireConnect AngularJS Architecture

## Modules
- `hireConnectApp` (root)
- `auth` (login/register)
- `candidate` (candidate dashboard)
- `recruiter` (recruiter dashboard)
- `admin` (admin dashboard)
- `shared` (services, interceptors, directives, UI helpers)

## Routing & Guard
Routes are configured in `app/app.routes.js` using `ngRoute`. Access control is enforced in `app/app.run.js` with `$routeChangeStart`, which checks the JWT from `localStorage` via `authService.isLoggedIn()` and role via `authService.getRole()`.

## Routes
| Path | Component | Auth Required | Roles |
|------|-----------|---------------|-------|
| `/login` | `<login>` | No | Public |
| `/register` | `<register>` | No | Public |
| `/candidate/jobs` | `<job-search>` | Yes | Candidate |
| `/candidate/applications` | `<my-applications>` | Yes | Candidate |
| `/candidate/profile` | `<my-profile>` | Yes | Candidate |
| `/candidate/ai-resume` | `<ai-resume-analysis>` | Yes | Candidate |
| `/candidate/interviews` | `<interview-schedule>` | Yes | Candidate |
| `/recruiter/post-job` | `<post-job>` | Yes | Recruiter |
| `/recruiter/my-jobs` | `<my-jobs>` | Yes | Recruiter |
| `/recruiter/applications` | `<applications-per-job>` | Yes | Recruiter |
| `/recruiter/ranked-candidates/:jobId` | `<ranked-candidates>` | Yes | Recruiter |
| `/recruiter/schedule-interview/:applicationId` | `<schedule-interview>` | Yes | Recruiter |
| `/admin` | `<admin-dashboard>` | Yes | Admin |
