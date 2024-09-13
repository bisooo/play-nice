import Image from "next/image";
import Login from "../components/Login";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-between">
      <Login/>
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
