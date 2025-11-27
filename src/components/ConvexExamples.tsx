// Example component showing how to use Convex in your app
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// Example 1: Querying data
export function TeacherClassList({ teacherId }: { teacherId: Id<"users"> }) {
  const classes = useQuery(api.classes.getTeacherClasses, { teacherId });

  if (classes === undefined) {
    return <div>Loading classes...</div>;
  }

  return (
    <div>
      <h2>My Classes</h2>
      {classes.map((cls) => (
        <div key={cls._id}>
          <h3>{cls.name}</h3>
          <p>Code: {cls.code}</p>
        </div>
      ))}
    </div>
  );
}

// Example 2: Creating data
export function CreateClassButton({ teacherId }: { teacherId: Id<"users"> }) {
  const createClass = useMutation(api.classes.createClass);

  const handleCreate = async () => {
    const result = await createClass({
      name: "New Class",
      description: "A new class description",
      teacherId,
    });
    console.log("Created class with code:", result.code);
  };

  return (
    <button onClick={handleCreate}>
      Create New Class
    </button>
  );
}

// Example 3: Student joining a class
export function JoinClassForm({ studentId }: { studentId: Id<"users"> }) {
  const joinClass = useMutation(api.classes.joinClass);

  const handleJoin = async (code: string) => {
    try {
      const cls = await joinClass({ code, studentId });
      console.log("Joined class:", cls.name);
    } catch (error) {
      console.error("Error joining class:", error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleJoin(formData.get("code") as string);
    }}>
      <input name="code" placeholder="Enter class code" />
      <button type="submit">Join Class</button>
    </form>
  );
}

// Example 4: Real-time student list
export function StudentList({ classId }: { classId: Id<"classes"> }) {
  const students = useQuery(api.classes.getClassStudents, { classId });

  if (students === undefined) {
    return <div>Loading students...</div>;
  }

  return (
    <div>
      <h3>Students ({students.length})</h3>
      <ul>
        {students.map((student) => (
          <li key={student._id}>{student.name}</li>
        ))}
      </ul>
    </div>
  );
}
