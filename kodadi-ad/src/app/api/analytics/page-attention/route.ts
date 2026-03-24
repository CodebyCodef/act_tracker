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

    const pageViews = await prisma.$queryRaw<{ page: string; count: bigint }[]>`
      SELECT page, COUNT(*)::bigint as count
      FROM events
      WHERE "projectId" = ${projectId}
        AND type = 'PAGE_VIEW'
        AND timestamp >= ${since}
        AND page IS NOT NULL
      GROUP BY page
      ORDER BY count DESC
      LIMIT 20
    `;

    const clickDensityRaw = await prisma.$queryRaw<{ page: string; element: string; count: bigint }[]>`
      SELECT page, COALESCE(element, 'unknown') as element, COUNT(*)::bigint as count
      FROM events
      WHERE "projectId" = ${projectId}
        AND type = 'CLICK'
        AND timestamp >= ${since}
        AND page IS NOT NULL
      GROUP BY page, element
      ORDER BY count DESC
      LIMIT 30
    `;

    const clickDensity = clickDensityRaw.map((c) => ({ page: c.page, element: c.element, count: Number(c.count) }));

    const timeOnPageRows = await prisma.$queryRaw<{ page: string; avg_duration: number; sessions: bigint }[]>`
      SELECT 
        page,
        AVG(CAST(metadata->>'duration' AS INTEGER)) as avg_duration,
        COUNT(*)::bigint as sessions
      FROM events
      WHERE "projectId" = ${projectId}
        AND type = 'TIME_ON_PAGE'
        AND timestamp >= ${since}
        AND page IS NOT NULL
        GROUP BY page
      ORDER BY avg_duration DESC
      LIMIT 20
    `;

    const timeOnPage = timeOnPageRows.map((r) => ({ page: r.page, avg_duration: Number(r.avg_duration), sessions: Number(r.sessions) }));

    const pages = pageViews.map((pv) => {
      const pageClicks = clickDensity.filter((c) => c.page === pv.page);
      const topElements = pageClicks.slice(0, 5).map((c) => ({
        element: c.element,
        clicks: c.count,
      }));

      return {
        page: pv.page,
        views: Number(pv.count),
        topElements,
      };
    });

    return NextResponse.json({
      pages,
      timeOnPage,
      clickDensity,
    });
  } catch (error: any) {
    console.error("Page attention error:", error);
    return NextResponse.json({ pages: [], timeOnPage: [], clickDensity: [], error: error.message }, { status: 500 });
  }
}
