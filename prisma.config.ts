import { defineConfig } from '@prisma/config';

export default defineConfig({
    datasource: {
        url: 'file:./dev.db', // This tells Prisma where to create the file
    },
});