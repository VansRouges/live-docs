"use server";

// import { clerkClient } from "@clerk/nextjs/server";
import { parseStringify } from "../utils";

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