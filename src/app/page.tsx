import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-between p-10">
        <Image 
          src="/play-nice-color.png"
          alt="LOGO"
          width={300}
          height={300}
          className="cover"
          unoptimized={true}
        />
    </div>
  );
}
