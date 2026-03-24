import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get("projectId");
    const days = parseInt(req.nextUrl.searchParams.get("days") || "30");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const adViews = await prisma.$queryRaw<{ name: string; count: bigint }[]>`
      SELECT COALESCE(metadata->>'ad', metadata->>'name', 'Unknown') as name, COUNT(*)::bigint as count
      FROM events
      WHERE "projectId" = ${projectId}
        AND type = 'AD_VIEW'
        AND timestamp >= ${since}
      GROUP BY COALESCE(metadata->>'ad', metadata->>'name', 'Unknown')
      ORDER BY count DESC
      LIMIT 20
    `;

    const adClicks = await prisma.$queryRaw<{ name: string; count: bigint }[]>`
      SELECT COALESCE(metadata->>'ad', metadata->>'name', 'Unknown') as name, COUNT(*)::bigint as count
      FROM events
      WHERE "projectId" = ${projectId}
        AND type = 'AD_CLICK'
        AND timestamp >= ${since}
      GROUP BY COALESCE(metadata->>'ad', metadata->>'name', 'Unknown')
      ORDER BY count DESC
      LIMIT 20
    `;

    const clickMap = new Map(
      adClicks.map((c) => [c.name, Number(c.count)])
    );

    const ads = adViews.map((item) => {
      const clicks = clickMap.get(item.name) || 0;
      const views = Number(item.count);
      return {
        name: item.name,
        position: "inline",
        views,
        clicks,
        ctr: views > 0 ? ((clicks / views) * 100).toFixed(2) : "0.00",
      };
    });

    const dailyTrendRows = await prisma.$queryRaw<{ date: string; type: string; count: bigint }[]>`
      SELECT 
        DATE(timestamp)::text as date,
        type,
        COUNT(*)::bigint as count
      FROM events
      WHERE "projectId" = ${projectId}
        AND type IN ('AD_VIEW', 'AD_CLICK')
        AND timestamp >= ${since}
      GROUP BY DATE(timestamp), type
      ORDER BY date ASC
    `;

    const dailyTrend = dailyTrendRows.map((r) => ({ date: r.date, type: r.type, count: Number(r.count) }));

    return NextResponse.json({
      ads,
      dailyTrend,
      totalViews: ads.reduce((sum, a) => sum + a.views, 0),
      totalClicks: ads.reduce((sum, a) => sum + a.clicks, 0),
    });
  } catch (error: any) {
    console.error("Ad attention error:", error);
    return NextResponse.json({ ads: [], dailyTrend: [], totalViews: 0, totalClicks: 0, error: error.message }, { status: 500 });
  }
}
