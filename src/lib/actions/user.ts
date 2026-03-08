"use server"

import {prisma} from "@/lib/prisma";
import {auth} from "@/lib/auth";

export async function updateUserBio(newBio: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    return await prisma.user.update({
        where: { id: session.user.id },
        data: { bio: newBio },
    });
}