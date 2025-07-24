// components/Sidebar.tsx
import Image from "next/image";
import 대시보드 from "@/components/image/대시 보드.svg";
import 강의사용 from "@/components/image/강의 사용.svg";
import 설정 from "@/components/image/설정.svg";
import 연필로고 from "@/components/image/pe.png"; // 아직 사용은 안 했지만 필요시 대비
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-20 h-screen bg-white shadow-md flex flex-col items-center py-6">
      <Image src={연필로고} alt="Logo" width={40} height={53} className="mb-10" />

      <nav className="flex flex-col items-center gap-10 text-gray-400 text-xs">
      <Link href="/dashboard">
  <div className="flex flex-col items-center gap-1 cursor-pointer">
    <Image src={대시보드} alt="대시보드" width={20} height={20} />
    <div>대시보드</div>
  </div>
</Link>

        {/* ✅ 강의 사용 → /home 으로 이동 */}
        <Link href="/home">
          <div className="flex flex-col items-center gap-1 text-[#a8c7fa] cursor-pointer">
            <Image src={강의사용} alt="강의 사용" width={22.5} height={20} />
            <div>강의 사용</div>
          </div>
        </Link>
        <div className="flex flex-col items-center gap-1">
          <Image src={설정} alt="설정" width={23} height={20} />
          <div>설정</div>
        </div>
      </nav>
    </aside>
  );
}
