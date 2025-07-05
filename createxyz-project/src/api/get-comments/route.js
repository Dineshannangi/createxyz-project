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

    let issueAccessQuery;
    if (role === "REPORTER") {
      issueAccessQuery = await sql`
        SELECT id FROM issues 
        WHERE id = ${issueId} AND created_by = ${session.user.id}
      `;
    } else {
      issueAccessQuery = await sql`
        SELECT id FROM issues WHERE id = ${issueId}
      `;
    }

    if (issueAccessQuery.length === 0) {
      return { error: "Issue not found or access denied" };
    }

    const comments = await sql`
      SELECT 
        c.id,
        c.comment,
        c.created_at,
        c.user_id,
        u.name as user_name,
        u.email as user_email
      FROM issue_comments c
      LEFT JOIN auth_users u ON c.user_id = u.id
      WHERE c.issue_id = ${issueId}
      ORDER BY c.created_at ASC
    `;

    return {
      success: true,
      comments,
      userRole: role,
    };
  } catch (error) {
    console.error("Error fetching comments:", error);
    return { error: "Failed to fetch comments" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}