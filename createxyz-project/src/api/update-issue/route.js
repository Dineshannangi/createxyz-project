async function handler({ issueId, status, severity, assignedTo }) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  if (!issueId) {
    return { error: "Issue ID is required" };
  }

  try {
    const userRole = await sql`
      SELECT role FROM user_roles WHERE user_id = ${session.user.id}
    `;

    if (userRole.length === 0) {
      return { error: "User role not found" };
    }

    const role = userRole[0].role;

    if (role !== "MAINTAINER" && role !== "ADMIN") {
      return {
        error:
          "Access denied. Only MAINTAINER and ADMIN roles can update issues",
      };
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (status !== undefined) {
      if (!["OPEN", "TRIAGED", "IN_PROGRESS", "DONE"].includes(status)) {
        return {
          error: "Invalid status. Must be OPEN, TRIAGED, IN_PROGRESS, or DONE",
        };
      }
      updateFields.push(`status = $${++paramCount}`);
      updateValues.push(status);
    }

    if (severity !== undefined) {
      if (!["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(severity)) {
        return {
          error: "Invalid severity. Must be LOW, MEDIUM, HIGH, or CRITICAL",
        };
      }
      updateFields.push(`severity = $${++paramCount}`);
      updateValues.push(severity);
    }

    if (assignedTo !== undefined) {
      if (assignedTo === null) {
        updateFields.push(`assigned_to = $${++paramCount}`);
        updateValues.push(null);
      } else {
        const userExists = await sql`
          SELECT id FROM auth_users WHERE id = ${assignedTo}
        `;
        if (userExists.length === 0) {
          return { error: "Assigned user not found" };
        }
        updateFields.push(`assigned_to = $${++paramCount}`);
        updateValues.push(assignedTo);
      }
    }

    if (updateFields.length === 0) {
      return { error: "No valid fields to update" };
    }

    updateFields.push(`updated_at = $${++paramCount}`);
    updateValues.push(new Date());

    const queryString = `
      UPDATE issues 
      SET ${updateFields.join(", ")}
      WHERE id = $${++paramCount}
      RETURNING id, title, description, severity, status, assigned_to, created_by, created_at, updated_at
    `;
    updateValues.push(issueId);

    const result = await sql(queryString, updateValues);

    if (result.length === 0) {
      return { error: "Issue not found" };
    }

    return {
      success: true,
      issue: result[0],
    };
  } catch (error) {
    console.error("Error updating issue:", error);
    return { error: "Failed to update issue" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}