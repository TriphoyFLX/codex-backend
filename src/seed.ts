import prisma from './lib/prisma';
import { hashPassword } from './lib/auth';

async function main() {
  console.log('Starting seed...');

  // Create schools
  const troitskayaSchool = await prisma.school.create({
    data: {
      name: 'МБОУ Троицкая СОШ',
      city: 'Троицкое',
    },
  });
  console.log('Created school:', troitskayaSchool.name);

  const demoSchool = await prisma.school.create({
    data: {
      name: 'Demo School',
      city: 'Moscow',
    },
  });
  console.log('Created school:', demoSchool.name);

  // Create a teacher
  const teacherPassword = await hashPassword('teacher123');
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@demo.com',
      password_hash: teacherPassword,
      role: 'TEACHER',
      school_id: troitskayaSchool.id,
    },
  });
  console.log('Created teacher:', teacher.email);

  // Generate a teacher code
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 365); // 1 year

  const teacherCode = await prisma.teacherCode.create({
    data: {
      code: 'TEACHER123',
      school_id: troitskayaSchool.id,
      created_by: teacher.id,
      expires_at: expiresAt,
    },
  });
  console.log('Created teacher code:', teacherCode.code);

  // Create a student
  const studentPassword = await hashPassword('student123');
  const student = await prisma.user.create({
    data: {
      email: 'student@demo.com',
      password_hash: studentPassword,
      role: 'STUDENT',
      school_id: troitskayaSchool.id,
    },
  });
  console.log('Created student:', student.email);

  console.log('\n=== Seed Complete ===');
  console.log('\nLogin credentials:');
  console.log('Teacher: teacher@demo.com / teacher123');
  console.log('Student: student@demo.com / student123');
  console.log('\nTeacher code for registration: TEACHER123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
