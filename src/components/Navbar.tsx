"use client";
import Link from "next/link";
import Image from "next/image";
import localFont from "next/font/local";
import React from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const logoFont = localFont({ src: "../../public/font-style.ttf" });

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const navClasses =
    "flex justify-between items-center w-full pl-5 pr-5 pt-5 bg-black text-white fixed top-0 left-0 right-0 z-50";

  if (status === "unauthenticated") {
    return (
      <nav className={navClasses}>
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
        <div className="flex-1 flex justify-center">
          <div className="flex-1 flex justify-center">
            <h1 className={logoFont.className}>LOGIN WITH SPOTIFY</h1>
          </div>
          <div className="flex-none flex items-center">
            <Link href="/profile">
              <Image
                src="/placeholder.jpg"
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
    <nav className={`${navClasses} mb-16`}>
      {/* Left Section: Logo */}
      <Link href="/" className="flex-shrink-0">
        <Image
          src="/play-nice-white.png"
          alt="LOGO"
          width={50}
          height={50}
          className="cover"
          unoptimized={true}
        />
      </Link>

      {/* Middle Section: Links (Dashboard and Sampler) */}
      <div className="flex flex-grow items-center justify-center space-x-4 md:space-x-24">
        <Link
          href="/dashboard"
          className={`${logoFont.className} nav-link ${
            pathname === "/dashboard" ? "active" : ""
          }`}
        >
          DASHBOARD
        </Link>
        <Link
          href="/sampler"
          className={`${logoFont.className} nav-link ${
            pathname === "/sampler" ? "active" : ""
          }`}
        >
          SAMPLER
        </Link>
      </div>

      {/* Right Section: Profile Image */}
      <div className="flex-none flex items-center">
        <Link href="/profile">
          <div className="relative">
            <Image
              src={session?.image ?? "/placeholder.jpg"}
              alt="User Profile"
              width={50}
              height={50}
              className="rounded-full"
              unoptimized={true}
            />
          </div>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
