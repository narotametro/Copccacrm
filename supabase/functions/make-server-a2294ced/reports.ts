import * as kv from './kv_store.tsx';

export async function saveReport(c: any) {
  try {
    const userId = c.get('userId');
    const user = await kv.get(`users:profile:${userId}`);
    const { period, reportData, insights, summary } = await c.req.json();

    const reportId = Date.now();
    const report = {
      id: reportId,
      userId,
      teamId: user?.teamId || null,
      period,
      reportData,
      insights: Array.isArray(insights) ? insights : [],
      summary,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'Unknown',
    };

    await kv.set(`reports:${reportId}`, report);
    
    // Get user reports and ensure it's an array
    const existingUserReports = await kv.get(`reports:user:${userId}`);
    const userReports = Array.isArray(existingUserReports) ? existingUserReports : [];
    userReports.unshift(reportId);
    if (userReports.length > 50) userReports.pop();
    await kv.set(`reports:user:${userId}`, userReports);
    
    if (user?.teamId) {
      const existingTeamReports = await kv.get(`reports:team:${user.teamId}`);
      const teamReports = Array.isArray(existingTeamReports) ? existingTeamReports : [];
      teamReports.unshift(reportId);
      if (teamReports.length > 100) teamReports.pop();
      await kv.set(`reports:team:${user.teamId}`, teamReports);
    }

    return c.json({ id: reportId, message: 'Report saved successfully' });
  } catch (error) {
    console.error('Save report error:', error);
    return c.json({ error: 'Failed to save report' }, 500);
  }
}

export async function getReports(c: any) {
  try {
    const userId = c.get('userId');
    const user = await kv.get(`users:profile:${userId}`);
    
    // Ensure we have a valid user
    if (!user) {
      return c.json([]);
    }
    
    let reportIds = [];
    if (user.role === 'admin' && user.teamId) {
      const teamReports = await kv.get(`reports:team:${user.teamId}`);
      reportIds = Array.isArray(teamReports) ? teamReports : [];
    } else {
      const userReports = await kv.get(`reports:user:${userId}`);
      reportIds = Array.isArray(userReports) ? userReports : [];
    }
    
    const reports = [];
    for (const id of reportIds) {
      const report = await kv.get(`reports:${id}`);
      if (report) {
        reports.push({
          id: report.id,
          period: report.period,
          createdAt: report.createdAt,
          createdBy: report.createdBy,
          summary: report.summary,
        });
      }
    }
    
    return c.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    return c.json([]);
  }
}

export async function getReport(c: any) {
  const userId = c.get('userId');
  const user = await kv.get(`users:profile:${userId}`);
  const reportId = parseInt(c.req.param('id'));
  
  const report = await kv.get(`reports:${reportId}`);
  if (!report) return c.json({ error: 'Report not found' }, 404);
  
  if (report.userId !== userId && user.role !== 'admin') {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  if (user.role === 'admin' && report.teamId !== user.teamId) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  return c.json(report);
}

export async function deleteReport(c: any) {
  try {
    const userId = c.get('userId');
    const user = await kv.get(`users:profile:${userId}`);
    const reportId = parseInt(c.req.param('id'));
    
    const report = await kv.get(`reports:${reportId}`);
    if (!report) return c.json({ error: 'Report not found' }, 404);
    
    if (report.userId !== userId && user?.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    await kv.del(`reports:${reportId}`);
    
    // Update user reports list
    const existingUserReports = await kv.get(`reports:user:${report.userId}`);
    const userReports = Array.isArray(existingUserReports) ? existingUserReports : [];
    await kv.set(`reports:user:${report.userId}`, userReports.filter((id: number) => id !== reportId));
    
    // Update team reports list if applicable
    if (report.teamId) {
      const existingTeamReports = await kv.get(`reports:team:${report.teamId}`);
      const teamReports = Array.isArray(existingTeamReports) ? existingTeamReports : [];
      await kv.set(`reports:team:${report.teamId}`, teamReports.filter((id: number) => id !== reportId));
    }
    
    return c.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    return c.json({ error: 'Failed to delete report' }, 500);
  }
}
