import { Permit } from 'permitio';
import { NextResponse } from 'next/server';

const PERMIT_API_KEY = process.env.PERMIT_API_KEY as string;

const permit = new Permit({
  token: PERMIT_API_KEY,
  pdp: 'https://cloudpdp.api.permit.io',
});

export async function DELETE(request: Request) {
  const { userId, role } = await request.json();

  if (!userId || !role) {
    return NextResponse.json(
      { error: 'userId and role are required.' },
      { status: 400 }
    );
  }

  try {
    // Unassign role using SDK
    await permit.api.roleAssignments.unassign({
      user: userId,
      role,
      tenant: "default",
    });

    return NextResponse.json({
      message: "Role unassigned successfully",
      data: { userId, role }
    }, { status: 200 });
  } catch (error) {
    console.error("Failed to unassign role in Permit.io:", error);
    
    // Handle role not assigned case
    if (typeof error === "object" && error !== null && "status" in error && (error as any).status === 404) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Role not assigned to user",
          error: (error as any).message 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to unassign role in Permit.io",
        error: typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error)
      },
      { status: typeof error === "object" && error !== null && "status" in error ? (error as any).status : 500 }
    );
  }
}