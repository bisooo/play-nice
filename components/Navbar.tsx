"use client"
import Link from 'next/link';
import Image from 'next/image';
import localFont from 'next/font/local';
import React from 'react';
import { useSession } from 'next-auth/react';

const logoFont = localFont({ src: '../public/font-style.ttf' })

const Navbar : React.FC = () => {
    
    const { data: session, status } = useSession();

    if (status === 'unauthenticated' )
    {
        return (
            <nav className='flex justify-between items-center w-full mb-16 pl-5 pr-5 pt-5'>
                <Link href="/" className="flex items-center">
                    <Image 
                    src="/play-nice-white.png"
                    alt="LOGO"
                    width={50}
                    height={50}
                    className="cover"
                    unoptimized={true}
                    />
                </Link>
                {/* DESKTOP NAVIGATION */} 
                <div className="flex items-center flex-grow justify-between">
                    <div className="flex-1 flex justify-center">
                        <h1 className={logoFont.className}>LOGIN WITH SPOTIFY</h1>
                    </div>
                    <div className="flex-none flex items-center">
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
                {/* MOBILE NAVIGATION */}
            </nav>
        );
    }

    return (
            <nav className='flex justify-between items-center w-full mb-16 pl-5 pr-5 pt-5'>
                <Link href="/" className="flex items-center">
                    <Image 
                        src="/play-nice-white.png"
                        alt="LOGO"
                        width={50}
                        height={50}
                        className="cover"
                        unoptimized={true}
                    />
                </Link>
            
                {/* DESKTOP NAVIGATION */} 
                <div className="flex items-center flex-grow justify-between">
                    <div className="flex-1 flex justify-center">
                        <Link href="/dashboard" className={logoFont.className}>DASHBOARD</Link>
                    </div>
                
                    <div className="flex-none flex items-center">
                        <Link href="/profile">
                            <div className="relative">
                                <Image
                                src={session?.image ?? '/placeholder.jpg'}
                                alt="User Profile"
                                width={50}
                                height={50}
                                className="rounded-full"
                                unoptimized={true}
                                />
                            </div>
                        </Link>
                    </div>
                </div>
      
                {/* MOBILE NAVIGATION */}
            </nav>
      
    )
}

export default Navbar;