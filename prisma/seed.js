const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');

const prisma = new PrismaClient();

function hashPassword(raw) {
  return createHash('sha256').update(raw).digest('hex');
}

async function main() {
  const features = [
    { code: 'employee_profiles', key: 'employee_profiles', name: 'Employee Profiles', description: 'Unlock employee directory and profiles' },
    { code: 'advanced_reporting', key: 'advanced_reporting', name: 'Advanced Reporting', description: 'Unlock detailed reports dashboard' },
    { code: 'leave_tracking', key: 'leave_tracking', name: 'Leave Tracking', description: 'Unlock leave and billing related tools' },
    { code: 'priority_support', key: null, name: 'Priority Support', description: 'Descriptive feature, does not gate a page' },
  ];

  for (const feature of features) {
    await prisma.feature.upsert({
      where: { code: feature.code },
      update: feature,
      create: feature,
    });
  }

  const plans = [
    { code: 'free', name: 'Free', monthlyPrice: 0 },
    { code: 'pro', name: 'Pro', monthlyPrice: 1200 },
    { code: 'business', name: 'Business', monthlyPrice: 3500 },
  ];

  const planRecords = {};
  for (const plan of plans) {
    planRecords[plan.code] = await prisma.plan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }

  const allFeatures = await prisma.feature.findMany();
  const byCode = Object.fromEntries(allFeatures.map((f) => [f.code, f]));

  const mapping = [
    ['free', 'employee_profiles', true, 1],
    ['free', 'advanced_reporting', false, 2],
    ['free', 'leave_tracking', false, 3],
    ['free', 'priority_support', false, 4],

    ['pro', 'employee_profiles', true, 1],
    ['pro', 'advanced_reporting', true, 2],
    ['pro', 'leave_tracking', false, 3],
    ['pro', 'priority_support', true, 4],

    ['business', 'employee_profiles', true, 1],
    ['business', 'advanced_reporting', true, 2],
    ['business', 'leave_tracking', true, 3],
    ['business', 'priority_support', true, 4],
  ];

  for (const [planCode, featureCode, included, order] of mapping) {
    await prisma.planFeature.upsert({
      where: {
        planId_featureId: {
          planId: planRecords[planCode].id,
          featureId: byCode[featureCode].id,
        },
      },
      update: { included, order },
      create: {
        planId: planRecords[planCode].id,
        featureId: byCode[featureCode].id,
        included,
        order,
      },
    });
  }

  const freePlan = planRecords.free;
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@taskly.local' },
    update: { name: 'Demo User', isAdmin: false, passwordHash: hashPassword('123456') },
    create: {
      name: 'Demo User',
      email: 'demo@taskly.local',
      passwordHash: hashPassword('123456'),
      isAdmin: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@taskly.local' },
    update: { name: 'Admin User', isAdmin: true, passwordHash: hashPassword('123456') },
    create: {
      name: 'Admin User',
      email: 'admin@taskly.local',
      passwordHash: hashPassword('123456'),
      isAdmin: true,
    },
  });

  let demoWorkspace = await prisma.workspace.findFirst({ where: { name: 'Demo Workspace' } });

  if (!demoWorkspace) {
    demoWorkspace = await prisma.workspace.create({
      data: { name: 'Demo Workspace', currentPlanId: freePlan.id },
    });
  } else {
    demoWorkspace = await prisma.workspace.update({
      where: { id: demoWorkspace.id },
      data: { currentPlanId: freePlan.id },
    });
  }

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: demoUser.id, workspaceId: demoWorkspace.id } },
    update: { role: 'owner' },
    create: { userId: demoUser.id, workspaceId: demoWorkspace.id, role: 'owner' },
  });

  await prisma.subscription.upsert({
    where: { workspaceId: demoWorkspace.id },
    update: { planId: freePlan.id, status: 'active' },
    create: { workspaceId: demoWorkspace.id, planId: freePlan.id, status: 'active' },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
