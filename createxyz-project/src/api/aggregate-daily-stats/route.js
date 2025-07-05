async function handler() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const statusCounts = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM issues 
      GROUP BY status
    `;

    const upsertQueries = statusCounts.map(
      ({ status, count }) =>
        sql`
        INSERT INTO daily_stats (date, status, issue_count)
        VALUES (${today}, ${status}, ${count})
        ON CONFLICT (date, status)
        DO UPDATE SET 
          issue_count = EXCLUDED.issue_count,
          created_at = now()
      `
    );

    if (upsertQueries.length > 0) {
      await sql.transaction(upsertQueries);
    }

    return {
      success: true,
      date: today,
      updated_stats: statusCounts.map(({ status, count }) => ({
        status,
        count: parseInt(count),
      })),
    };
  } catch (error) {
    console.error("Error aggregating daily stats:", error);
    return { error: "Failed to aggregate daily stats" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}