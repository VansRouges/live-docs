"use client";
import { ClientSideSuspense, RoomProvider } from '@liveblocks/react'
import React, { useEffect, useRef } from 'react'
import { Editor } from "@/components/editor/Editor";
import Header from "@/components/Header";
import { SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from "@clerk/nextjs";
import ActiveCollaborators from './ActiveCollaborators';
import { useState } from 'react';
import { Input } from './ui/input';
import Image from 'next/image';
import { updateDocument } from '@/lib/actions/room.actions';
import Loader from './Loader';

const CollaborativeRoom = ({ roomId, roomMetadata, users, currentUserType}: CollaborativeRoomProps) => {
    console.log("Room Metadata:", roomMetadata)

    const [documentTitle, setDocumentTitle] = useState(roomMetadata.title);
    const [editing , setEditing] = useState(false);
    const [loading , setLoading] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);

    const updateTitleHandler = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setLoading(true);

            try{
                if (documentTitle !== roomMetadata.title) {
                    const updatedDocument = await updateDocument(roomId, documentTitle);

                    if (updatedDocument) {
                        setEditing(false);
                    }
                }
            } catch (error) {
                console.error("Error updating title", error);
            }

            setLoading(false);
        }
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setEditing(false);
                updateDocument(roomId, documentTitle);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }
    , [containerRef, documentTitle, roomId])

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current?.focus();
        }
    }, [editing])

  return (
    <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<Loader />}>
            <div className="collaborative-room">
                <Header>
                    <div ref={containerRef} className="flex w-fit items-center justify-center gap-2">
                        {editing && !loading ? (
                            <Input
                                type="test"
                                value={documentTitle}
                                onChange={(e) => setDocumentTitle(e.target.value)}
                                ref={inputRef}
                                placeholder='Enter title'
                                onKeyDown={updateTitleHandler}
                                disabled={!editing}
                                className='document-title-input'
                            />
                        ) : (
                            <>
                                <p className='document-title'>{documentTitle}</p>
                            </>
                        )}

                        {currentUserType === "editor" && !editing && (
                            <Image 
                                src="/assets/icons/edit.svg"
                                alt="Edit"
                                width={24}
                                height={24}
                                onClick={() => setEditing(true)}
                                className='pointer'
                            />
                        )}

                        {currentUserType !== "editor" && !editing && (
                            <p className='view-only-tag'>View only</p>
                        )}

                        {loading && <p className='text-sm text-gray-400'>saving...</p>}
                    </div>
                    <div className='flex w-full flex-1 justify-end gap-2'>
                        <ActiveCollaborators />
                        <SignedOut>
                            <SignInButton />
                            <SignUpButton />
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>
                </Header>
                <Editor roomId={roomId} currentUserType={currentUserType} />
            </div>
        </ClientSideSuspense>
    </RoomProvider>
  )
}

export default CollaborativeRoom
