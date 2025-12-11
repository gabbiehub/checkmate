import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process scheduled notifications every minute
crons.interval(
  "process-scheduled-notifications",
  { minutes: 1 },
  internal.eventsAndReminders.processScheduledNotifications
);

export default crons;
