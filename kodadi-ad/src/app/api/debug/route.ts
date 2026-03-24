import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const key = req.nextUrl.searchParams.get("key");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const sessions = await prisma.session.count({ where: { projectId } });
  const totalEvents = await prisma.event.count({ where: { projectId } });

  const eventsByType = await prisma.$queryRaw<{ type: string; count: bigint }[]>`
    SELECT type, COUNT(*) as count FROM events WHERE "projectId" = ${projectId} GROUP BY type ORDER BY count DESC
  `;

  const sampleEvents = await prisma.event.findMany({
    where: { projectId },
    orderBy: { timestamp: "desc" },
    take: 20,
    select: { type: true, page: true, element: true, metadata: true, timestamp: true },
  });

  return NextResponse.json({
    project: { id: project.id, name: project.name, apiKey: project.apiKey },
    sessions,
    totalEvents,
    eventsByType: eventsByType.map((e) => ({ type: e.type, count: Number(e.count) })),
    sampleEvents,
  });
}
