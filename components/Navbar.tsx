"use client"
import Link from 'next/link';
import Image from 'next/image';
import localFont from 'next/font/local';
import React from 'react';

const logoFont = localFont({ src: '../public/font-style.ttf' })

const Navbar : React.FC = () => {
    // DUMMY MOCK - USER LOGIN STATUS
    const isUserLoggedIn = true;

    // STATES

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
                    <div className="flex-center w-full gap-x-40">
                        <Link href="/chat" className={logoFont.className}>
                            CHAT
                        </Link>
                        <Link href="/dashboard" className={logoFont.className}>
                            DASHBOARD
                        </Link>
                    </div>                   
                ) : 
                (
                    // LOGIN WITH SPOTIFY
                    <></>
            )}
            <div className="flex-end">
                <Link href="/profile">
                    <Image 
                        // SET TO SPOTIFY USER PROFILE IMAGE
                        src="/channel-red.jpg"
                        alt="LOGO"
                        width={50}
                        height={50}
                        className="rounded-full"
                        unoptimized={true}
                    />
                </Link>
            </div>
            {/* MOBILE NAVIGATION */}
        </nav>
    )
}

export default Navbar;