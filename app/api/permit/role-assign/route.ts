import { Permit } from 'permitio';
import { NextResponse } from 'next/server';

const PERMIT_API_KEY = process.env.PERMIT_API_KEY as string;

const permit = new Permit({
  token: PERMIT_API_KEY,
  pdp: 'https://cloudpdp.api.permit.io',
});

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

  try {
    // Assign role using SDK
    await permit.api.roleAssignments.assign({
      user: userId,
      role,
      tenant: "default",
      // resource: "Document"
    });

    return NextResponse.json({
      message: "Role assigned successfully",
      data: { userId, role }
    }, { status: 200 });
  } catch (error) {
    console.error("Failed to assign role in Permit.io:", error);
    
    // Handle user not found case
    if (error.status === 404) {
      return NextResponse.json(
        { 
          success: false, 
          message: "User not found in Permit.io",
          error: error.message 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to assign role in Permit.io",
        error: error.message 
      },
      { status: error.status || 500 }
    );
  }
}