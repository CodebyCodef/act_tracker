import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      domain: true,
      apiKey: true,
      createdAt: true,
      _count: {
        select: { sessions: true, events: true },
      },
    },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { name, domain } = await req.json();

  if (!name || !domain) {
    return NextResponse.json({ error: "Name and domain required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name,
      domain,
      userId,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
