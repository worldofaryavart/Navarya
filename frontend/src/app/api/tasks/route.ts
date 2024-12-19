import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Replace this with actual data from your database
  const tasks = [
    { id: 1, title: 'Task 1', completed: false },
    { id: 2, title: 'Task 2', completed: true },
  ];

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // TODO: Add task to your database
    return NextResponse.json({ message: 'Task created successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
