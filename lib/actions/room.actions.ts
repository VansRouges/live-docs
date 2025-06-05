'use server';

import { nanoid } from 'nanoid'
import { liveblocks } from '../liveblocks';
import { revalidatePath } from 'next/cache';
import { getAccessType, parseStringify } from '../utils';
import { redirect } from 'next/navigation';
import { 
  assignRoleWithPermit, 
  checkUserPermission, 
  syncUserWithPermit, 
  unassignRoleWithPermit
} from './permissions';

export const createDocument = async ({ userId, email }: CreateDocumentParams) => {
  const roomId = nanoid();

  try {
    // Sync user with Permit as editor
    await syncUserWithPermit(email, 'editor');

    const metadata = {
      creatorId: userId,
      email,
      title: 'Untitled'
    }

    const usersAccesses: RoomAccesses = {
      [email]: ['room:write']
    }

    const room = await liveblocks.createRoom(roomId, {
      metadata,
      usersAccesses,
      defaultAccesses: []
    });
    
    revalidatePath('/');
    return parseStringify(room);
  } catch (error) {
    console.log(`Error happened while creating a room: ${error}`);
    throw error;
  }
}

// Update the getDocument function to check permissions
export const getDocument = async ({ roomId, userId }: { roomId: string; userId: string }) => {
  try {
    // First check Permit permissions
    const canView = await verifyUserPermission(userId, 'view');
    if (!canView) {
      throw new Error('You do not have permission to view this document');
    }

    const room = await liveblocks.getRoom(roomId);
    return parseStringify(room);
  } catch (error) {
    console.log(`Error happened while getting a room: ${error}`);
    throw error;
  }
};

export const updateDocument = async (roomId: string, title: string) => {
  try {
    const updatedRoom = await liveblocks.updateRoom(roomId, {
      metadata: {
        title
      }
    })

    revalidatePath(`/documents/${roomId}`);

    return parseStringify(updatedRoom);
  } catch (error) {
    console.log(`Error happened while updating a room: ${error}`);
  }
}

export const getDocuments = async (email: string ) => {
  try {
      const rooms = await liveblocks.getRooms({ userId: email });
    
      return parseStringify(rooms);
  } catch (error) {
    console.log(`Error happened while getting rooms: ${error}`);
  }
}

export const updateDocumentAccess = async ({ roomId, email, userType, updatedBy }: ShareDocumentParams) => {
  try {
    // Verify current user has permission to edit
    const canEdit = await verifyUserPermission(updatedBy.email, 'edit');
    if (!canEdit) {
      throw new Error('You do not have permission to modify access');
    }

    // Convert 'viewer'/'editor' to Permit actions
    const permitRole = userType === 'editor' ? 'editor' : 'viewer';
    await assignRoleWithPermit(email, permitRole);

    const usersAccesses: RoomAccesses = {
      [email]: getAccessType(userType) as AccessType,
    }

    const room = await liveblocks.updateRoom(roomId, { 
      usersAccesses
    });

    if (room) {
      const notificationId = nanoid();
      await liveblocks.triggerInboxNotification({
        userId: email,
        kind: '$documentAccess',
        subjectId: notificationId,
        activityData: {
          userType,
          title: `You have been granted ${userType} access to the document by ${updatedBy.name}`,
          updatedBy: updatedBy.name,
          avatar: updatedBy.avatar,
          email: updatedBy.email
        },
        roomId
      });
    }

    revalidatePath(`/documents/${roomId}`);
    return parseStringify(room);
  } catch (error) {
    console.error(`Error updating document access:`, error);
    throw error;
  }
}

export const removeCollaborator = async ({ roomId, email }: {roomId: string, email: string}) => {
  try {
    const room = await liveblocks.getRoom(roomId)

    if(room.metadata.email === email) {
      throw new Error('You cannot remove yourself from the document');
    }

    // Unassign all roles in Permit
    await unassignRoleWithPermit(email, 'editor');
    await unassignRoleWithPermit(email, 'viewer');

    const updatedRoom = await liveblocks.updateRoom(roomId, {
      usersAccesses: {
        [email]: null
      }
    })

    revalidatePath(`/documents/${roomId}`);
    return parseStringify(updatedRoom);
  } catch (error) {
    console.log(`Error happened while removing a collaborator: ${error}`);
    throw error;
  }
}

export const deleteDocument = async (roomId: string) => {
  try {
    await liveblocks.deleteRoom(roomId);
    revalidatePath('/');
    redirect('/');
  } catch (error) {
    console.log(`Error happened while deleting a room: ${error}`);
  }
}

// Update the verifyUserPermission function
export const verifyUserPermission = async (email: string, requiredAction: 'edit' | 'view'): Promise<boolean> => {
  try {
    const hasPermission = await checkUserPermission(email, requiredAction);
    if (!hasPermission) {
      console.warn(`User ${email} lacks permission to ${requiredAction} document`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Permission verification failed for ${email}:`, error);
    return false;
  }
};