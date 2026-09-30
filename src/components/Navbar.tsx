"use client";
import Link from "next/link";
import Image from "next/image";
import localFont from "next/font/local";
import React from "react";
import { usePathname } from "next/navigation";

const logoFont = localFont({ src: "../../public/font-style.ttf" });

const ON_REPEAT_LINKS = [
  { href: "/on-repeat/artists", label: "ARTISTS ON REPEAT" },
  { href: "/on-repeat/tracks", label: "TRACKS ON REPEAT" },
];

const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navClasses =
    "flex justify-between items-center w-full pl-5 pr-5 pt-5 bg-black text-white fixed top-0 left-0 right-0 z-50";

  return (
    <nav className={`${navClasses} mb-16`}>
      {/* Left Section: Logo */}
      <Link href="/" className="flex-shrink-0">
        <Image
          src="/play-nice-color.png"
          alt="LOGO"
          width={50}
          height={50}
          className="cover"
          unoptimized={true}
        />
      </Link>

      {/* Middle Section: Links (Artists / Tracks On Repeat) */}
      <div className="flex flex-grow items-center justify-center space-x-6 md:space-x-24 px-3">
        {ON_REPEAT_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`${logoFont.className} nav-link text-center text-xs sm:text-base ${
              pathname === href ? "active" : ""
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right Section: the colored logo, same size as the left one, so the links stay centred */}
      <Link href="/" className="flex-shrink-0">
        <Image
          src="/play-nice-color.png"
          alt="PLAY-NICE home"
          width={50}
          height={50}
          className="cover"
          unoptimized={true}
        />
      </Link>
    </nav>
  );
};

export default Navbar;
