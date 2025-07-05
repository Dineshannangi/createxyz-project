async function handler({ issueId }) {
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

    let issueQuery;
    let queryParams;

    if (role === "REPORTER") {
      issueQuery = `
        SELECT 
          i.*,
          creator.name as creator_name,
          creator.email as creator_email,
          creator.email as reporter_email,
          assignee.name as assignee_name,
          assignee.email as assignee_email
        FROM issues i
        LEFT JOIN auth_users creator ON i.created_by = creator.id
        LEFT JOIN auth_users assignee ON i.assigned_to = assignee.id
        WHERE i.id = $1 AND i.created_by = $2
      `;
      queryParams = [issueId, session.user.id];
    } else {
      issueQuery = `
        SELECT 
          i.*,
          creator.name as creator_name,
          creator.email as creator_email,
          creator.email as reporter_email,
          assignee.name as assignee_name,
          assignee.email as assignee_email
        FROM issues i
        LEFT JOIN auth_users creator ON i.created_by = creator.id
        LEFT JOIN auth_users assignee ON i.assigned_to = assignee.id
        WHERE i.id = $1
      `;
      queryParams = [issueId];
    }

    const issues = await sql(issueQuery, queryParams);

    if (issues.length === 0) {
      return { error: "Issue not found or access denied" };
    }

    return {
      issue: issues[0],
      userRole: role,
    };
  } catch (error) {
    console.error("Error fetching issue:", error);
    return { error: "Failed to fetch issue" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}