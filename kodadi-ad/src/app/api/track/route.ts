import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventType, Prisma } from "@prisma/client";

interface TrackEvent {
  type: string;
  page?: string;
  element?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

interface TrackPayload {
  apiKey: string;
  sessionId: string;
  visitorId?: string;
  userAgent?: string;
  country?: string;
  device?: string;
  browser?: string;
  events: TrackEvent[];
}

export async function POST(req: NextRequest) {
  try {
    const body: TrackPayload = await req.json();
    const { apiKey, sessionId, visitorId, userAgent, country, device, browser, events } = body;

    if (!apiKey || !sessionId || !events?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { apiKey },
    });

    if (!project) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const session = await prisma.session.upsert({
      where: { sessionId },
      update: { endedAt: new Date() },
      create: {
        sessionId,
        projectId: project.id,
        visitorId,
        userAgent,
        country,
        device,
        browser,
      },
    });

    const eventRecords: Prisma.EventCreateManyInput[] = events.map((event) => ({
      type: event.type as EventType,
      sessionId: session.id,
      projectId: project.id,
      page: event.page,
      element: event.element,
      metadata: (event.metadata || undefined) as Prisma.InputJsonValue | undefined,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
    }));

    await prisma.event.createMany({
      data: eventRecords,
    });

    return NextResponse.json({ success: true, count: eventRecords.length });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
