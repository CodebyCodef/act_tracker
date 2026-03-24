import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSummary } from "@/lib/ai";

export async function GET(req: NextRequest) {
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

  const [totalEvents, totalSessions, topPages, topProducts, adStats] = await Promise.all([
    prisma.event.count({
      where: { projectId, timestamp: { gte: since } },
    }),
    prisma.session.count({
      where: { projectId, startedAt: { gte: since } },
    }),
    prisma.event.groupBy({
      by: ["page"],
      where: {
        projectId,
        type: "PAGE_VIEW",
        timestamp: { gte: since },
        page: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.event.groupBy({
      by: ["metadata"],
      where: {
        projectId,
        type: { in: ["PRODUCT_VIEW", "PRODUCT_INTERACTION"] },
        timestamp: { gte: since },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.event.groupBy({
      by: ["type"],
      where: {
        projectId,
        type: { in: ["AD_VIEW", "AD_CLICK"] },
        timestamp: { gte: since },
      },
      _count: { id: true },
    }),
  ]);

  const dataContext = `
Analytics Summary for project "${project.name}" (last ${days} days):

Overview:
- Total Events: ${totalEvents}
- Total Sessions: ${totalSessions}

Top Pages by Views:
${topPages.map((p, i) => `${i + 1}. ${p.page}: ${p._count.id} views`).join("\n")}

Top Products:
${topProducts.map((p, i) => {
    const meta = p.metadata as Record<string, unknown> | null;
    return `${i + 1}. ${meta?.product || meta?.name || "Unknown"}: ${p._count.id} interactions`;
  }).join("\n")}

Ad Performance:
${adStats.map((a) => `- ${a.type}: ${a._count.id}`).join("\n")}

Provide actionable insights about:
1. Which products are performing best and why
2. Which ads are getting the most attention
3. Which pages are most engaging and suggestions to improve
4. Overall recommendations for improving user engagement
`;

  const summary = await generateSummary(dataContext);

  return NextResponse.json({
    summary,
    stats: {
      totalEvents,
      totalSessions,
      topPages,
      topProducts,
      adStats,
    },
  });
}
