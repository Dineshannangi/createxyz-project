async function handler({ title, description, severity, fileUrl, fileName }) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  if (!title || !description) {
    return { error: "Title and description are required" };
  }

  if (!severity || !["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(severity)) {
    return {
      error: "Valid severity level is required (LOW, MEDIUM, HIGH, CRITICAL)",
    };
  }

  try {
    const result = await sql`
      INSERT INTO issues (title, description, severity, file_url, file_name, created_by)
      VALUES (${title}, ${description}, ${severity}, ${fileUrl || null}, ${
      fileName || null
    }, ${session.user.id})
      RETURNING id, title, description, severity, file_url, file_name, status, created_at
    `;

    return {
      success: true,
      issue: result[0],
    };
  } catch (error) {
    console.error("Error creating issue:", error);
    return { error: "Failed to create issue" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}