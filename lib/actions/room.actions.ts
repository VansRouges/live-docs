"use server";
import { nanoid } from 'nanoid';
import { liveblocks } from '../liveblocks';
import { revalidatePath } from 'next/cache';
import { parseStringify } from '../utils';

export const createDocument = async ({ userId, email}: CreateDocumentParams) => {
    const roomId = nanoid();

    try {
        const metadata = {
            creatorId: userId,
            email,
            title: "Untitled",
        }

        const usersAccesses: RoomAccesses = {
            [email]: ["room:write"],
        }

        const room = await liveblocks.createRoom(roomId, {
            metadata,
            usersAccesses,
            defaultAccesses: [] ,
        });

        console.log("Room created", room);

        revalidatePath("/");

        return parseStringify(room);
    } catch (error) {
        console.log("Error creating room", error);
        throw error;
    }
}

export const getDocument = async ({ roomId, userId }: { roomId: string; userId: string }) => {
    try {
        const room = await liveblocks.getRoom(roomId);

        const hasAccess = Object.keys(room.usersAccesses).includes(userId);

        if (!hasAccess) {
            throw new Error("You do not have access to this document");
        }

        return parseStringify(room);
    } catch (error) {
        console.error("Error fetching documents", error);
        return [];
    }
}

export const updateDocument = async (roomId: string, title: string ) => {
    try {
        const updatedRoom = await liveblocks.updateRoom(roomId, {
            metadata: {
                title,
            }
        });

        revalidatePath(`/documents/${roomId}`);
        return parseStringify(updatedRoom);
    } catch (error) {
        console.error("Error updating document", error);
        return [];
    }
}

export const getDocuments = async ( email: string ) => {
    try {
        const rooms = await liveblocks.getRooms({ userId: email });

        return parseStringify(rooms);
    } catch (error) {
        console.error("Error while gettingg rooms:", error);
    }
}