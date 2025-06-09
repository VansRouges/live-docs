'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useSelf } from '@liveblocks/react/suspense';
import React, { useState } from 'react'
import { Button } from "./ui/button";
import Image from "next/image";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import UserTypeSelector from "./UserTypeSelector";
import Collaborator from "./Collaborator";
import { updateDocumentAccess } from "@/lib/actions/room.actions";
import { assignRoleWithPermit } from "@/lib/actions/permissions";
import { toast } from "sonner"

const ShareModal = ({ roomId, collaborators, creatorId, currentUserType }: ShareDocumentDialogProps) => {
  const user = useSelf();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assigningRole, setAssigningRole] = useState(false);
  const [roleAssigned, setRoleAssigned] = useState(false);
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<UserType>('viewer');

  const handleAssignRole = async () => {
    if (!email) {
      toast.error('Please enter an email address first');
      return;
    }

    setAssigningRole(true);
    try {
      const response = await fetch('/api/permit/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: email,
          role: userType,
          email,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to assign role');
      }

      toast.success(`Role assigned successfully`);
      setRoleAssigned(true);
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Failed to assign role');
    } finally {
      setAssigningRole(false);
    }
  };

  const shareDocumentHandler = async () => {
    setLoading(true);

    await updateDocumentAccess({ 
      roomId, 
      email, 
      userType: userType as UserType, 
      updatedBy: user.info,
    });

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="gradient-blue flex h-9 gap-1 px-4" disabled={currentUserType !== 'editor'}>
          <Image
            src="/assets/icons/share.svg"
            alt="share"
            width={20}
            height={20}
            className="min-w-4 md:size-5"
          />
          <p className="mr-1 hidden sm:block">Share</p>
        </Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog">
        <DialogHeader>
          <DialogTitle>Manage document access</DialogTitle>
          <DialogDescription>
            Assign roles and share this document with collaborators
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-blue-100">
              Email address
            </Label>
            <Input
              id="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 text-black"
            />
          </div>

          <div>
            <Label className="text-blue-100">Access level</Label>
            <UserTypeSelector 
              userType={userType}
              setUserType={setUserType}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAssignRole}
              className="flex-1 bg-dark-400 hover:bg-dark-300"
              disabled={assigningRole || !email}
            >
              {assigningRole ? 'Assigning...' : 'Assign Role'}
            </Button>

            <Button 
              onClick={shareDocumentHandler} 
              className="flex-1 gradient-blue"
              disabled={loading || !roleAssigned}
            >
              {loading ? 'Sending...' : 'Invite'}
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium text-blue-100">Current collaborators</h3>
          <ul className="flex flex-col">
            {collaborators.map((collaborator) => (
              <Collaborator 
                key={collaborator.id}
                roomId={roomId}
                creatorId={creatorId}
                email={collaborator.email}
                collaborator={collaborator}
                user={user.info}
              />
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ShareModal