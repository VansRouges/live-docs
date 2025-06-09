import axios from 'axios';
import permit from "../permit"; // Adjust the import path as necessary

const PERMIT_API_BASE = "https://api.permit.io/v2/facts";
const PERMIT_PROJ_ID = "3e4b77901d8f4fd1a51109f8ed04f615";
const PERMIT_ENV_ID = "bf4959f547c74a1c8bff519b20a9174b";
const PERMIT_API_KEY = process.env.PERMIT_API_KEY as string;

const permitApi = axios.create({
  baseURL: PERMIT_API_BASE,
  headers: {
    Authorization: `Bearer ${PERMIT_API_KEY}`,
    "Content-Type": "application/json",
  },
});

// Cache for user existence checks
const userExistenceCache = new Map<string, boolean>();

export const checkUserExistsInPermit = async (email: string): Promise<boolean> => {
  // Check cache first
  if (userExistenceCache.has(email)) {
    return userExistenceCache.get(email)!;
  }

  try {
    const response = await permit.api.users.get(email);
    userExistenceCache.set(email, true);
    return true;
  } catch (error) {
    if (error.status === 404) {
      userExistenceCache.set(email, false);
      return false;
    }
    console.error('Permit user check failed:', error);
    // Assume user exists to prevent duplicate creation
    return true;
  }
};

export const syncUserWithPermit = async (email: string, role: 'editor' | 'viewer' | 'creator') => {
  try {
    const userExists = await checkUserExistsInPermit(email);
    if (userExists) return;

    // User doesn't exist, create them
    await permitApi.post(`/${PERMIT_PROJ_ID}/${PERMIT_ENV_ID}/users`, {
      key: email,
      email,
      role_assignments: [{ role, tenant: "default" }],
    });
    userExistenceCache.set(email, true);
  } catch (error) {
    console.error("Permit sync error:", error);
    throw error;
  }
};

export const assignRoleWithPermit = async (email: string, role: 'editor' | 'viewer' | 'creator') => {
  try {
    // First check if user exists as a fallback
    const userExists = await checkUserExistsInPermit(email);
    if (!userExists) {
      console.log(`User ${email} not found, attempting to sync first...`);
      await syncUserWithPermit(email, role);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    // Assign the role
    await permitApi.post(`/${PERMIT_PROJ_ID}/${PERMIT_ENV_ID}/users/${email}/roles`, {
      role,
      tenant: "default"
    });
    console.log(`Successfully assigned ${role} role to ${email}`);
  } catch (error) {
    console.error(`Failed to assign ${role} role to ${email}:`, error);
    throw error;
  }
};
// export const assignRoleWithPermit = async (email: string, role: 'editor' | 'viewer') => {
//   try {
//     // First check if user exists as a fallback
//     const userExists = await checkUserExistsInPermit(email);
//     if (!userExists) {
//       console.log(`User ${email} not found, attempting to sync first...`);
//       await syncUserWithPermit(email, role);
//       await new Promise(resolve => setTimeout(resolve, 3000));
//     }

//     // Assign the role
//     await permit.api.roleAssignments.assign({
//       user: email,
//       role,
//       tenant: "default",
//       resource: "Document"
//     });
    
//     console.log(`Successfully assigned ${role} role to ${email}`);
//   } catch (error) {
//     console.error(`Failed to assign ${role} role to ${email}:`, error);
//     throw error;
//   }
// };
// `${PERMIT_API_BASE}/${PERMIT_PROJ_ID}/${PERMIT_ENV_ID}/users/${userId}/roles

export const unassignRoleWithPermit = async (email: string, role: 'editor' | 'viewer') => {
  try {
    await permitApi.delete(`/${PERMIT_PROJ_ID}/${PERMIT_ENV_ID}/users/${email}/roles`, {
      data: {
        role,
        tenant: "default"
      }
    });
  } catch (error) {
    console.error("Permit role unassignment error:", error);
    throw error;
  }
};

// Add this new function for checking permissions
export const checkUserPermission = async (email: string, action: string): Promise<boolean> => {
  try {
    const resource = "Document"; // Fixed resource type as per your requirement
    const permitted = await permit.check(email, action, resource);
    console.log(`Permission check for ${email} to ${action} on ${resource}:`, permitted);
    return permitted;
  } catch (error) {
    console.error(`Error checking permission for ${email}:`, error);
    return true; // Fallback to allow access
  }
};