import CollaborativeRoom from "@/components/CollaborativeRoom"
import { getDocument, verifyUserPermission } from "@/lib/actions/room.actions";
import { getClerkUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation";

const Document = async ({ params: { id } }: SearchParamProps) => {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

  try {
    const canView = await verifyUserPermission(userEmail, 'read');
    if (!canView) {
      redirect(`/error?reason=no-read-access`);
    }

    const room = await getDocument({
      roomId: id,
      userId: userEmail,
    });

    if (!room) {
      redirect(`/error?reason=room-not-found`);
    }

    const canEdit = await verifyUserPermission(userEmail, 'edit');
    const currentUserType = canEdit ? 'editor' : 'viewer';

    const userIds = Object.keys(room.usersAccesses || {});
    const users = await getClerkUsers({ userIds });

    const usersData = users
      .filter((user: User | null): user is User => !!user && !!user.email)
      .map((user: User) => ({
        ...user,
        userType: room.usersAccesses?.[user.email]?.includes('room:write')
          ? 'editor'
          : 'viewer'
      }));

    return (
      <main className="flex w-full flex-col items-center">
        <CollaborativeRoom 
          roomId={id}
          roomMetadata={room.metadata}
          users={usersData}
          currentUserType={currentUserType}
        />
      </main>
    );
  } catch (error) {
    console.error("Error loading document:", error);
    redirect(`/error?reason=${encodeURIComponent('load-failed')}`);
  }
};

export default Document;
