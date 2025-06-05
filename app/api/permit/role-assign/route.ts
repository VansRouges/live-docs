import axios from 'axios';
import { NextResponse } from 'next/server';

const PERMIT_API_BASE = "https://api.permit.io/v2/facts";
const PERMIT_PROJ_ID = "3e4b77901d8f4fd1a51109f8ed04f615"; // Your project ID
const PERMIT_ENV_ID = "bf4959f547c74a1c8bff519b20a9174b"; // Your environment ID
const PERMIT_API_KEY = process.env.PERMIT_API_KEY as string;
const PERMIT_AUTH_HEADER = {
  Authorization: `Bearer ${PERMIT_API_KEY}`,
  "Content-Type": "application/json",
};

const allowedRoles: string[] = ['editor', 'viewer'];

export async function POST(request: Request) {
  const { userId, role } = await request.json();

  if (!userId || !role) {
    return NextResponse.json(
      { error: 'userId and role are required.' },
      { status: 400 }
    );
  }

  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: 'Invalid role. Allowed roles: editor, viewer' },
      { status: 400 }
    );
  }

  const roleAssignmentPayload = {
    role,
    tenant: "default" // Using default tenant as per your original code
  };

  try {
    const response = await axios.post(
      `${PERMIT_API_BASE}/${PERMIT_PROJ_ID}/${PERMIT_ENV_ID}/users/${userId}/roles`,
      roleAssignmentPayload,
      { headers: PERMIT_AUTH_HEADER }
    );

    return NextResponse.json({
      message: "Role assigned successfully",
      data: response.data,
    }, { status: 200 });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Failed to assign role in Permit.io:", error.response?.data || error.message);
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to assign role in Permit.io",
          error: error.response?.data 
        },
        { status: error.response?.status || 500 }
      );
    } else {
      console.error("Failed to assign role in Permit.io:", error);
      return NextResponse.json(
        { success: false, message: "Failed to assign role in Permit.io" },
        { status: 500 }
      );
    }
  }
}