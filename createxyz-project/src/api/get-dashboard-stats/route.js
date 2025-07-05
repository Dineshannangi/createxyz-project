async function handler() {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  try {
    const stats = await sql`
      SELECT 
        severity,
        COUNT(*) as count
      FROM issues 
      WHERE status = 'OPEN'
      GROUP BY severity
    `;

    const result = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    stats.forEach((stat) => {
      result[stat.severity] = parseInt(stat.count);
    });

    return { stats: result };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { error: "Failed to fetch dashboard stats" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}