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

export async function DELETE(request: Request) {
  const { userId, role } = await request.json();

  if (!userId || !role) {
    return NextResponse.json(
      { error: 'userId and role are required.' },
      { status: 400 }
    );
  }

  const roleUnassignmentPayload = {
    role,
    tenant: "default" // Using default tenant as per your original code
    // Note: Documentation mentions resource_instance but we're omitting it as it's not in your use case
  };

  try {
    const response = await axios.delete(
      `${PERMIT_API_BASE}/${PERMIT_PROJ_ID}/${PERMIT_ENV_ID}/users/${userId}/roles`,
      {
        headers: PERMIT_AUTH_HEADER,
        data: roleUnassignmentPayload // DELETE with body requires this format in axios
      }
    );

    return NextResponse.json({
      message: "Role unassigned successfully",
      data: response.data,
    }, { status: 200 });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Failed to unassign role in Permit.io:", error.response?.data || error.message);
      
      // Handle 404 specifically (role not assigned)
      if (error.response?.status === 404) {
        return NextResponse.json(
          { 
            success: false, 
            message: "Role not assigned to user",
            error: error.response?.data 
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to unassign role in Permit.io",
          error: error.response?.data 
        },
        { status: error.response?.status || 500 }
      );
    } else {
      console.error("Failed to unassign role in Permit.io:", error);
      return NextResponse.json(
        { success: false, message: "Failed to unassign role in Permit.io" },
        { status: 500 }
      );
    }
  }
}