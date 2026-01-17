import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed database...');

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYk9YmqhZ4i', // password: demo123
      name: 'Demo User',
    },
  });

  console.log('Created demo user:', user.email);

  // Create demo tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Setup development environment',
      description: 'Install Node.js, PostgreSQL, and set up the project',
      status: 'DONE',
      dueDate: new Date('2026-01-15'),
      userId: user.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Build authentication system',
      description: 'Implement JWT-based authentication with login and register',
      status: 'IN_PROGRESS',
      dueDate: new Date('2026-01-20'),
      userId: user.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Create task dashboard',
      description: 'Build the main dashboard with task list and filters',
      status: 'TODO',
      dueDate: new Date('2026-01-25'),
      userId: user.id,
    },
  });

  console.log('Created demo tasks:', [task1.title, task2.title, task3.title]);

  // Create activity logs
  await prisma.activityLog.create({
    data: {
      action: 'REGISTER',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: 'CREATE',
      entity: 'Task',
      entityId: task1.id,
      details: JSON.stringify({ title: task1.title }),
      userId: user.id,
      taskId: task1.id,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
