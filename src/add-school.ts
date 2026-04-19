import prisma from './lib/prisma';

async function main() {
  console.log('Adding school...');

  // Check if school already exists
  const existingSchool = await prisma.school.findFirst({
    where: { name: 'МБОУ Троицкая СОШ' }
  });

  if (existingSchool) {
    console.log('School already exists:', existingSchool.name);
  } else {
    const school = await prisma.school.create({
      data: {
        name: 'МБОУ Троицкая СОШ',
        city: 'Троицкое',
      },
    });
    console.log('Created school:', school.name);
  }

  console.log('\nDone!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
