import { storage } from "./storage";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

export async function cancelStaleBookings(): Promise<number> {
  try {
    const allBookings = await storage.getAllBookings();
    const now = new Date();
    let cancelledCount = 0;

    for (const booking of allBookings) {
      if (booking.status !== "pending") continue;
      if (!booking.bookedAt) continue; // Skip if no bookedAt timestamp
      
      const bookedAt = new Date(booking.bookedAt);
      const timeSinceBooking = now.getTime() - bookedAt.getTime();
      
      // Cancel if pending for more than 24 hours
      if (timeSinceBooking > TWENTY_FOUR_HOURS_MS) {
        await storage.cancelBooking(booking.id);
        await storage.decrementBookedCount(booking.classId);
        cancelledCount++;
        console.log(`[Scheduler] Auto-cancelled stale booking ${booking.id} (pending for ${Math.round(timeSinceBooking / 1000 / 60 / 60)}h)`);
      }
    }

    if (cancelledCount > 0) {
      console.log(`[Scheduler] Auto-cancelled ${cancelledCount} stale booking(s)`);
    }

    return cancelledCount;
  } catch (error) {
    console.error("[Scheduler] Error cancelling stale bookings:", error);
    return 0;
  }
}

let schedulerInterval: NodeJS.Timeout | null = null;

export function startBookingScheduler(): void {
  if (schedulerInterval) {
    console.log("[Scheduler] Already running");
    return;
  }

  console.log("[Scheduler] Starting auto-cancel scheduler (checks every hour)");
  
  // Run immediately on startup
  cancelStaleBookings();
  
  // Then run every hour
  schedulerInterval = setInterval(cancelStaleBookings, CHECK_INTERVAL_MS);
}

export function stopBookingScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Scheduler] Stopped");
  }
}
