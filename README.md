# Craftiva Job Request System

A comprehensive job request system where members can create job requests and apprentices can view and apply for them.

## Features

### For Members (Job Creators)

-   **Create Job Requests**: Post detailed job descriptions with budget ranges, deadlines, and required skills
-   **Manage Applications**: View and accept/reject applications from apprentices
-   **Track Job Progress**: Monitor the status and progress of assigned jobs
-   **Job Statistics**: View overview of total jobs, open jobs, in-progress jobs, and total spent

### For Apprentices (Job Seekers)

-   **Browse Available Jobs**: View all open job requests with detailed information
-   **Apply for Jobs**: Submit proposals for jobs that match their skills
-   **Track Applications**: Monitor the status of their job applications
-   **Manage Active Jobs**: Update progress and mark jobs as completed
-   **Earnings Tracking**: View total earnings and job statistics

## Database Schema

The system uses two main tables:

### `job_requests`

-   `id`: Unique identifier
-   `client_id`: Reference to the member who created the job
-   `title`: Job title
-   `description`: Detailed job description
-   `budget_min` / `budget_max`: Budget range
-   `skills_required`: Array of required skills
-   `location`: Job location (can be remote)
-   `deadline`: Job deadline
-   `status`: open, in_progress, completed, cancelled
-   `assigned_apprentice_id`: Reference to the assigned apprentice
-   `progress`: Progress percentage (0-100)
-   `created_at` / `updated_at`: Timestamps

### `job_applications`

-   `id`: Unique identifier
-   `apprentice_id`: Reference to the apprentice applying
-   `job_request_id`: Reference to the job being applied for
-   `proposal`: The apprentice's proposal text
-   `status`: pending, accepted, rejected
-   `created_at` / `updated_at`: Timestamps

## User Interface

### Member Dashboard (Jobs Tab)

-   **Job Creation Form**: Complete form with all job details
-   **Job Statistics Cards**: Overview of job metrics
-   **My Job Requests**: List of created jobs with applications
-   **Application Management**: Accept/reject buttons for pending applications

### Apprentice Dashboard (Jobs Tab)

-   **Available Jobs**: Browseable list of open job requests
-   **Job Details**: Complete information including client details and budget
-   **Application Tracking**: View status of submitted applications
-   **Active Job Management**: Progress updates and completion tools

## Security Features

-   **Row Level Security (RLS)**: Database-level security policies
-   **User Authentication**: All actions require valid user authentication
-   **Authorization**: Users can only access their own data and appropriate public data
-   **Input Validation**: Form validation and data sanitization

## Getting Started

1. **Database Setup**: Run the `database-setup.sql` script in your Supabase SQL editor
2. **Authentication**: Ensure Supabase authentication is properly configured
3. **Access**: Members can access the Jobs tab from their dashboard
4. **Create Jobs**: Use the job creation form to post new opportunities
5. **Apply**: Apprentices can browse and apply for available jobs

## API Functions

The system includes comprehensive API functions in `supabase-auth.js`:

-   `createJobRequest()`: Create new job requests
-   `getAllJobRequests()`: Fetch available jobs for apprentices
-   `getClientJobRequests()`: Get jobs created by a specific member
-   `getApprenticeJobApplications()`: Get applications submitted by an apprentice
-   `applyForJob()`: Submit a job application
-   `updateApplicationStatus()`: Accept or reject applications
-   `updateJobProgress()`: Update job progress percentage
-   `completeJob()`: Mark a job as completed

## Usage Examples

### Creating a Job Request

```javascript
const jobData = {
    title: "Website Design for Restaurant",
    description: "Need a modern, responsive website for a new restaurant",
    budgetMin: 500,
    budgetMax: 1500,
    location: "Remote",
    deadline: "2024-02-15",
    skillsRequired: ["design", "programming"],
};

await createJobRequest(userId, jobData);
```

### Applying for a Job

```javascript
const proposal =
    "I have 3 years of experience in web design and have created similar restaurant websites. I can deliver a modern, responsive design within your budget and timeline.";

await applyForJob(apprenticeId, jobRequestId, proposal);
```

## Future Enhancements

-   **Messaging System**: Direct communication between clients and apprentices
-   **Payment Integration**: Automated payment processing
-   **Review System**: Client and apprentice reviews
-   **Advanced Filtering**: More sophisticated job search and filtering
-   **Notifications**: Real-time notifications for job updates
-   **File Attachments**: Support for portfolio attachments in applications

