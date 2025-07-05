async function handler({
  userId,
  page = 1,
  limit = 20,
  status,
  severity,
  search,
}) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  if (!userId) {
    return { error: "User ID is required" };
  }

  try {
    const userRole = await sql`
      SELECT role FROM user_roles WHERE user_id = ${userId}
    `;

    if (userRole.length === 0) {
      return { error: "User role not found" };
    }

    const role = userRole[0].role;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (role === "REPORTER") {
      whereConditions.push(`created_by = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (severity) {
      whereConditions.push(`severity = $${paramIndex}`);
      queryParams.push(severity);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(
        `(LOWER(title) LIKE LOWER($${paramIndex}) OR LOWER(description) LIKE LOWER($${
          paramIndex + 1
        }))`
      );
      queryParams.push(`%${search}%`);
      queryParams.push(`%${search}%`);
      paramIndex += 2;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const countQuery = `SELECT COUNT(*) as total FROM issues ${whereClause}`;
    const issuesQuery = `
      SELECT 
        i.*,
        creator.name as creator_name,
        creator.email as creator_email,
        assignee.name as assignee_name,
        assignee.email as assignee_email
      FROM issues i
      LEFT JOIN auth_users creator ON i.created_by = creator.id
      LEFT JOIN auth_users assignee ON i.assigned_to = assignee.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countParams = [...queryParams];
    const issuesParams = [...queryParams, limit, offset];

    const [countResult, issues] = await sql.transaction([
      sql(countQuery, countParams),
      sql(issuesQuery, issuesParams),
    ]);

    const total = parseInt(countResult[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      issues,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      userRole: role,
    };
  } catch (error) {
    console.error("Error listing issues:", error);
    return { error: "Failed to list issues" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}