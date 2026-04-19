"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./lib/prisma"));
async function main() {
    console.log('Adding school...');
    // Check if school already exists
    const existingSchool = await prisma_1.default.school.findFirst({
        where: { name: 'МБОУ Троицкая СОШ' }
    });
    if (existingSchool) {
        console.log('School already exists:', existingSchool.name);
    }
    else {
        const school = await prisma_1.default.school.create({
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
    await prisma_1.default.$disconnect();
});
