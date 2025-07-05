async function handler({ issueId, comment }) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  if (!issueId || !comment) {
    return { error: "Issue ID and comment are required" };
  }

  if (comment.trim().length === 0) {
    return { error: "Comment cannot be empty" };
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

    const result = await sql`
      INSERT INTO issue_comments (issue_id, user_id, comment)
      VALUES (${issueId}, ${session.user.id}, ${comment.trim()})
      RETURNING id, issue_id, user_id, comment, created_at
    `;

    // Get user email for the response
    const userInfo = await sql`
      SELECT email FROM auth_users WHERE id = ${session.user.id}
    `;

    return {
      success: true,
      comment: {
        ...result[0],
        user_email: userInfo[0].email,
      },
    };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { error: "Failed to add comment" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}