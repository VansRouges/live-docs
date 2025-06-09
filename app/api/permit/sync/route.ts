import axios from 'axios';
import { NextResponse } from 'next/server';

const PERMIT_API_URL = "https://api.permit.io/v2/facts/3e4b77901d8f4fd1a51109f8ed04f615/bf4959f547c74a1c8bff519b20a9174b/users";
const PERMIT_API_KEY = process.env.PERMIT_API_KEY as string;
const PERMIT_AUTH_HEADER = {
  Authorization: `Bearer ${PERMIT_API_KEY}`,
  "Content-Type": "application/json",
};

const allowedRoles: string[] = ['editor', 'viewer'];

export async function POST(request: Request) {
  const { firstName, lastName, email, role, userId } = await request.json();

  if (!email || !role || !userId) {
    return NextResponse.json(
      { error: 'Email, role, and userId are required.' },
      { status: 400 }
    );
  }

  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: 'Invalid role. Allowed roles: editor, viewer' },
      { status: 400 }
    );
  }

  const permitPayload = {
    key: email,
    email,
    role_assignments: [{ role, tenant: "default" }],
  };

  try {
    // First check if user exists
    try {
      await axios.get(`${PERMIT_API_URL}/${email}`, { headers: PERMIT_AUTH_HEADER });
      
      // User exists - call role-assign endpoint on same domain
      try {
        const requestUrl = new URL(request.url);
        const roleAssignUrl = `${requestUrl.origin}/api/permit/role-assign`;
        
        const roleAssignResponse = await axios.post(
          roleAssignUrl,
          {
            userId: email,
            role
          }
        );

        return NextResponse.json({
          message: "Role assigned to existing user successfully",
          data: roleAssignResponse.data,
        }, { status: 200 });
        
      } catch (roleAssignError) {
        console.error("Failed to assign role to existing user:", roleAssignError);
        return NextResponse.json(
          { 
            success: false, 
            message: "User exists but failed to assign role",
            error: axios.isAxiosError(roleAssignError) ? roleAssignError.response?.data : roleAssignError 
          },
          { status: 500 }
        );
      }

    } catch (getError) {
      // User doesn't exist - proceed with creation
      if (!axios.isAxiosError(getError) || getError.response?.status !== 404) {
        throw getError; // Re-throw if it's not a 404 error
      }

      // Create new user
      const response = await axios.post(PERMIT_API_URL, permitPayload, { headers: PERMIT_AUTH_HEADER });
      const permitResponse = response.data;

      return NextResponse.json({
        message: "User created successfully",
        permit: permitResponse,
      }, { status: 201 });
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Failed to sync user to Permit.io:", error.response?.data || error.message);
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to sync with Permit.io",
          error: error.response?.data 
        },
        { status: error.response?.status || 500 }
      );
    } else {
      console.error("Failed to sync user to Permit.io:", error);
      return NextResponse.json(
        { success: false, message: "Failed to sync with Permit.io" },
        { status: 500 }
      );
    }
  }
}