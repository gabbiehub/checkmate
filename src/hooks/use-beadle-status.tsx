import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";

interface UseBeadleStatusOptions {
  classId: string;
}

interface BeadleStatus {
  isBeadle: boolean;
  isLoading: boolean;
  isMember: boolean;
  canMarkAttendance: boolean;
}

/**
 * Hook to check if the current user is a beadle for a specific class.
 * 
 * Usage:
 * ```tsx
 * const { isBeadle, isLoading, canMarkAttendance } = useBeadleStatus({ classId });
 * 
 * // Guard beadle-only features
 * if (!canMarkAttendance) {
 *   return <div>Access denied</div>;
 * }
 * ```
 */
export function useBeadleStatus({ classId }: UseBeadleStatusOptions): BeadleStatus {
  const { user } = useAuth();

  const membershipInfo = useQuery(
    api.classes.getStudentClassRole,
    user?.userId
      ? {
          classId: classId as Id<"classes">,
          studentId: user.userId,
        }
      : "skip"
  );

  // Also check if user is the teacher of this class
  const classData = useQuery(
    api.classes.getClass,
    classId ? { classId: classId as Id<"classes"> } : "skip"
  );

  const isTeacher = classData?.teacherId === user?.userId;
  const isBeadle = membershipInfo?.isBeadle === true;
  const isMember = membershipInfo?.isMember === true;
  const isLoading = membershipInfo === undefined || classData === undefined;

  return {
    isBeadle,
    isLoading,
    isMember,
    // Teachers and beadles can both mark attendance
    canMarkAttendance: isTeacher || isBeadle,
  };
}

/**
 * Component wrapper that only renders children if user is a beadle.
 * Useful for conditionally showing beadle-only UI.
 * 
 * Usage:
 * ```tsx
 * <BeadleOnly classId={classId}>
 *   <Button>Mark All Present</Button>
 * </BeadleOnly>
 * ```
 */
interface BeadleOnlyProps {
  classId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function BeadleOnly({ classId, children, fallback = null }: BeadleOnlyProps) {
  const { isBeadle, isLoading } = useBeadleStatus({ classId });

  if (isLoading) {
    return null;
  }

  if (!isBeadle) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component wrapper that renders children if user can mark attendance (teacher or beadle).
 * 
 * Usage:
 * ```tsx
 * <AttendanceManagerOnly classId={classId}>
 *   <AttendanceControls />
 * </AttendanceManagerOnly>
 * ```
 */
interface AttendanceManagerOnlyProps {
  classId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AttendanceManagerOnly({ classId, children, fallback = null }: AttendanceManagerOnlyProps) {
  const { canMarkAttendance, isLoading } = useBeadleStatus({ classId });

  if (isLoading) {
    return null;
  }

  if (!canMarkAttendance) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
