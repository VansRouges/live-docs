"use server";

import { liveblocks } from "../liveblocks";
// import { clerkClient } from "@clerk/nextjs/server";
import { parseStringify } from "../utils";
import axios from "axios";

export const getClerkUsers = async ({ userIds }: { userIds: string[]}) => {
    try {
        const response = await axios.get("https://api.clerk.com/v1/users", {
            headers: {
                Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            params: {
                limit: 100, // Increase if needed
                order_by: "-created_at",
            },
        });

        const users = response.data.map((user: any) => ({
            id: user.id,
            email: user.email_addresses[0]?.email_address,
            name: user.full_name,
            avatar: user.profile_image_url,
        }));

        // Filter users based on the provided userIds (emails)
        const sortedUsers = userIds.map((email) =>
            users.find((user) => user.email === email)
        );

        return parseStringify(sortedUsers);
    } catch (error) {
        console.error("Error fetching users", error);
        return [];
    }
}

export const getDocumentUsers = async ({ roomId, currentUser, text }: { roomId: string, currentUser: string, text: string }) => {
    try{
        const room = await liveblocks.getRoom(roomId);

        const users = Object.keys(room.usersAccesses).filter((email) => email !== currentUser);

        if(text.length){
            const lowerCaseText = text.toLowerCase()

            const filteredUsers = users.filter((email: string) => email.toLowerCase().includes(lowerCaseText));

            return parseStringify(filteredUsers);
        }

        return parseStringify(users);
    } catch (error) {
        console.error("Error fetching document users", error);
        return [];
    }
}