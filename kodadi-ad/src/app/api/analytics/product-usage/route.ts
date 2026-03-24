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

    const productViews = await prisma.$queryRaw<{ name: string; count: bigint }[]>`
      SELECT COALESCE(metadata->>'product', metadata->>'name', 'Unknown') as name, COUNT(*)::bigint as count
      FROM events
      WHERE "projectId" = ${projectId}
        AND type = 'PRODUCT_VIEW'
        AND timestamp >= ${since}
      GROUP BY COALESCE(metadata->>'product', metadata->>'name', 'Unknown')
      ORDER BY count DESC
      LIMIT 20
    `;

    const productInteractions = await prisma.$queryRaw<{ name: string; count: bigint }[]>`
      SELECT COALESCE(metadata->>'product', metadata->>'name', 'Unknown') as name, COUNT(*)::bigint as count
      FROM events
      WHERE "projectId" = ${projectId}
        AND type = 'PRODUCT_INTERACTION'
        AND timestamp >= ${since}
      GROUP BY COALESCE(metadata->>'product', metadata->>'name', 'Unknown')
      ORDER BY count DESC
      LIMIT 20
    `;

    const interactionMap = new Map(
      productInteractions.map((item) => [item.name, Number(item.count)])
    );

    const products = productViews.map((item) => ({
      name: item.name,
      views: Number(item.count),
      interactions: interactionMap.get(item.name) || 0,
    }));

    // Also include products that only have interactions (no views)
    for (const [name, count] of interactionMap) {
      if (!products.find((p) => p.name === name)) {
        products.push({ name, views: 0, interactions: count });
      }
    }

    const dailyTrendRows = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT 
        DATE(timestamp)::text as date,
        COUNT(*)::bigint as count
      FROM events
      WHERE "projectId" = ${projectId}
        AND type IN ('PRODUCT_VIEW', 'PRODUCT_INTERACTION')
        AND timestamp >= ${since}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

    const dailyTrend = dailyTrendRows.map((r) => ({ date: r.date, count: Number(r.count) }));

    return NextResponse.json({
      products,
      dailyTrend,
      totalEvents: products.reduce((sum, p) => sum + p.views + p.interactions, 0),
    });
  } catch (error: any) {
    console.error("Product usage error:", error);
    return NextResponse.json({ products: [], dailyTrend: [], totalEvents: 0, error: error.message }, { status: 500 });
  }
}
