async function handler({ userId }) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  if (!userId) {
    return { error: "User ID is required" };
  }

  try {
    const existingRole = await sql`
      SELECT role FROM user_roles WHERE user_id = ${userId}
    `;

    if (existingRole.length > 0) {
      return { role: existingRole[0].role };
    }

    const totalUsers = await sql`
      SELECT COUNT(*) as count FROM auth_users
    `;

    const isFirstUser = totalUsers[0].count <= 1;
    const defaultRole = isFirstUser ? "ADMIN" : "REPORTER";

    await sql`
      INSERT INTO user_roles (user_id, role)
      VALUES (${userId}, ${defaultRole})
    `;

    return { role: defaultRole };
  } catch (error) {
    console.error("Error getting/creating user role:", error);
    return { error: "Failed to get user role" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}