import { Permit } from 'permitio';
import { NextResponse } from 'next/server';

const PERMIT_API_KEY = process.env.PERMIT_API_KEY as string;

const permit = new Permit({
  token: PERMIT_API_KEY,
  pdp: 'https://cloudpdp.api.permit.io',
});

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

  try {
    // First check if user exists using SDK
     // Create new user and assign role in one operation
      await permit.api.users.sync({
        key: email,
        email,
        first_name: firstName,
        last_name: lastName,
        role_assignments: [{ role, tenant: "default" }]
      });

      return NextResponse.json({
        message: "User created and role assigned successfully",
        data: { email, role }
      }, { status: 201 });
      
  } catch (error) {
    console.error("Failed to sync user to Permit.io:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to sync with Permit.io",
        error: typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error)
      },
      { status: typeof error === "object" && error !== null && "status" in error ? (error as any).status : 500 }
    );
  }
}