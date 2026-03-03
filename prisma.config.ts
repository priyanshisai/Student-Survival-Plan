import { defineConfig } from '@prisma/config';

export default defineConfig({
    datasource: {
        // This must point to the dev.db file seen in your git status
        url: 'file:./dev.db',
    },
});