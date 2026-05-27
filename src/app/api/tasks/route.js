import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const prisma = new PrismaClient();

async function getUserPayload(request) {
  const token = request.cookies.get("session_token")?.value;
  if (!token) return null;
  try {
    const encodedSecret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload; // usually { id, username, role, ... }
  } catch (e) {
    return null;
  }
}

// GET all tasks
export async function GET(request) {
  try {
    const payload = await getUserPayload(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    // Default to viewing own tasks
    let filterUserId = payload.sub;

    // If OWNER is viewing someone else's board
    if (payload.role === "OWNER" && targetUserId) {
      filterUserId = targetUserId;
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId: filterUserId,
      },
      orderBy: {
        order: 'asc',
      },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST create a new task
export async function POST(request) {
  try {
    const payload = await getUserPayload(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, description, status = 'OPEN', points = 1, targetUserId } = body;

    let taskUserId = payload.sub;
    if (payload.role === "OWNER" && targetUserId) {
      taskUserId = targetUserId;
    }

    // Get highest order in the target status column
    const highestOrderTask = await prisma.task.findFirst({
      where: { status, userId: taskUserId },
      orderBy: { order: 'desc' },
    });

    const newOrder = highestOrderTask ? highestOrderTask.order + 1 : 0;

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        status,
        points: Number(points),
        order: newOrder,
        userId: taskUserId,
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// PATCH reorder tasks (bulk update)
export async function PATCH(request) {
  try {
    const payload = await getUserPayload(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { tasks } = body; // expecting array of { id, status, order }

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Run bulk updates in a transaction
    const updatePromises = tasks.map((task) =>
      prisma.task.update({
        where: { id: task.id },
        data: {
          status: task.status,
          order: task.order,
        },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 });
  }
}
