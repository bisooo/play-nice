"use client"
import Link from 'next/link';
import Image from 'next/image';
import localFont from 'next/font/local';
import React from 'react';
import { useSession } from 'next-auth/react';

const logoFont = localFont({ src: '../public/font-style.ttf' })

const Navbar : React.FC = () => {
    
    const { data: session } = useSession();
    const isUserLoggedIn = !!session;

    return (
        <nav className='flex-start w-full mb-16 pl-5 pr-5 pt-5'>
            <Link href="/" className="flex-start">
                <Image 
                src="/play-nice-white.png"
                alt="LOGO"
                width={100}
                height={100}
                className="cover"
                unoptimized={true}
                />
            </Link>
            {/* DESKTOP NAVIGATION */} 
            {isUserLoggedIn ? 
                (
                    <div className="flex items-center justify-between w-full pr-10 pt-4">
                        <div className="flex-1 flex justify-center">
                            <Link href="/dashboard" className={logoFont.className}>DASHBOARD</Link>
                        </div>
                        <div className="flex-none">
                            <Link href="/profile">
                                <Image
                                    // SET TO SPOTIFY USER PROFILE IMAGE
                                    src={session.image ?? 'placeholder.jpg'}
                                    alt="User Profile"
                                    width={50}
                                    height={50}
                                    className="rounded-full"
                                    unoptimized={true}
                                />
                            </Link>
                        </div>
                    </div>
                ) : 
                (
                    // LOGIN WITH SPOTIFY
                    <div className="flex items-center justify-between w-full pr-10 pt-4">
                        <div className="flex-1 flex justify-center">
                            <h1 className={logoFont.className}>LOGIN WITH SPOTIFY TO CONTINUE</h1>
                        </div>
                        <div className="flex-none">
                            <Link href="/profile">
                                <Image
                                    // SET TO PLACE HOLDER IMAGE
                                    src="placeholder.jpg"
                                    alt="User Profile"
                                    width={50}
                                    height={50}
                                    className="rounded-full"
                                    unoptimized={true}
                                />
                            </Link>
                        </div>
                        
                    </div>
                )}
            {/* MOBILE NAVIGATION */}
        </nav>
    )
}

export default Navbar;