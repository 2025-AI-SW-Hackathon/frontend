'use client'; // 🚨 꼭 맨 위에 선언!

import type { NextPage } from 'next';
import Image from "next/image";
import styles from './index.module.css';
import { useRouter } from 'next/navigation'; // ✅ App Router용
import Sidebar from "@/components/Sidebar"; // 실제 경로에 맞게 조정
import { useAuth } from "@/components/AuthContext";
import UserProfile from "@/components/UserProfile";

const Component1: NextPage = () => {
  const router = useRouter(); // ⬅️ 사용 준비
  const { user, signIn, signOut, isAuthenticated } = useAuth();
  
  const goToHome = () => {
    router.push("/home");
  };
  
  const handleAuthAction = () => {
    if (isAuthenticated) {
      signOut();
    } else {
      router.push("/auth/signin");
    }
  };
  	return (
    		<div className={styles.div}>
      			<div className={styles.body}>
        				<div className={styles.div1}>
          					<div className={styles.main}>
            						<div className={styles.section}>
              							<div className={styles.div2}>학습 통계</div>
              							<div className={styles.div3}>
                								<div className={styles.div4}>
                  									<div className={styles.div5}>
                    										<div className={styles.div6}>
                      											<div className={styles.div7}>누적 수업 수</div>
                      											<b className={styles.b}>24</b>
                    										</div>
                    										<Image className={styles.divIcon} width={48} height={48} sizes="100vw" alt="" src="/1.png" />
                  									</div>
                								</div>
                								<div className={styles.div8}>
                  									<div className={styles.div5}>
                    										<div className={styles.div6}>
                      											<div className={styles.div7}>총 생성 주석</div>
                      											<b className={styles.b1}>1,247</b>
                    										</div>
                    										<Image className={styles.divIcon} width={48} height={48} sizes="100vw" alt="" src="/2.png" />
                  									</div>
                								</div>
                								<div className={styles.div12}>
                  									<div className={styles.div5}>
                    										<div className={styles.div6}>
                      											<div className={styles.div7}>이번 주 활동</div>
                      											<b className={styles.b2}>8시간</b>
                    										</div>
                    										<Image className={styles.divIcon} width={48} height={48} sizes="100vw" alt="" src="/3.png" />
                  									</div>
                								</div>
                								<div className={styles.div16}>
                  									<div className={styles.div5}>
                    										<div className={styles.div18}>
                      											<div className={styles.div19}>평균 주석/강의</div>
                      											<b className={styles.b3}>52</b>
                    										</div>
                    										<Image className={styles.divIcon} width={48} height={48} sizes="100vw" alt="" src="/4.png" />
                  									</div>
                								</div>
              							</div>
            						</div>
            						<div className={styles.section1}>
              							<div className={styles.div20}>최근 강의 기록</div>
              							<div className={styles.div21}>
                								<div className={styles.div22}>
                  									<div className={styles.div23}>
                    										<div className={styles.div24}>
                      											<div className={styles.div25}>
                        												<Image className={styles.divChild} width={40} height={40} sizes="100vw" alt="" src="/파일.svg" />
                        												<div className={styles.div26}>
                          													<div className={styles.pdf}>데이터베이스_시스템_3장.pdf</div>
                          													<div className={styles.div27}>생성 주석: 47개 • 2024년 1월 15일</div>
                        												</div>
                      											</div>
                      											<Image className={styles.buttonIcon} width={10} height={24} sizes="100vw" alt="" src="button.svg" />
                    										</div>
                    										<div className={styles.div28}>
                      											<div className={styles.div29}>
                        												<Image className={styles.divChild} width={40} height={40} sizes="100vw" alt="" src="/파일.svg" />
                        												<div className={styles.div30}>
                          													<div className={styles.pdf1}>운영체제_프로세스관리.pdf</div>
                          													<div className={styles.div27}>생성 주석: 63개 • 2024년 1월 12일</div>
                        												</div>
                      											</div>
                      											<Image className={styles.buttonIcon} width={10} height={24} sizes="100vw" alt="" src="button.svg" />
                    										</div>
                    										<div className={styles.div32}>
                      											<div className={styles.div33}>
                        												<Image className={styles.divIcon4} width={40} height={40} sizes="100vw" alt="" src="/파일.svg" />
                        												<div className={styles.div34}>
                          													<div className={styles.pdf2}>알고리즘_정렬_알고리즘.pdf</div>
                          													<div className={styles.div35}>생성 주석: 38개 • 2024년 1월 10일</div>
                        												</div>
                      											</div>
                      											<Image className={styles.buttonIcon} width={10} height={24} sizes="100vw" alt="" src="button.svg" />
                    										</div>
                  									</div>
                								</div>
              							</div>
            						</div>
            						<div className={styles.div36}>
              							<div className={styles.section2}>
                								<div className={styles.h3}>
                  									<div className={styles.ai}>AI 서비스 안내</div>
                								</div>
                								<div className={styles.div37}>
                  									<div className={styles.divParent}>
                    										<div className={styles.div38}>
                      											<div className={styles.iconCircle}>
                        											<Image src="/mic.svg" alt="마이크" width={10} height={13} />
                      											</div>
                      											<div className={styles.div39}>실시간 음성 인식으로 강의 내용을 자동 분석합니다</div>
                    										</div>
                    										<div className={styles.div40}>
                      											<div className={styles.iconCircle}>
                        											<Image src="/papers.svg" alt="문서" width={10} height={13} />
                      											</div>
                      											<div className={styles.div41}>강의자료 기반 맞춤형 주석을 생성합니다</div>
                    										</div>
                    										<div className={styles.div42}>
                      											<div className={styles.iconCircle}>
                        											<Image src="/drag.svg" alt="드래그" width={12} height={13} />
                      											</div>
                      											<div className={styles.div43}>드래그앤드롭으로 주석 위치를 자유롭게 조정하세요</div>
                    										</div>
                  									</div>
                								</div>
              							</div>
              							<div className={styles.section3}>
                								<div className={styles.h3}>
                  									<div className={styles.div44}>피드백</div>
                								</div>
                								<div className={styles.textarea}>
                  									<div className={styles.div45}>서비스 개선을 위한 의견을 남겨주세요...</div>
                								</div>
                								<div className={styles.button}>
                  									<div className={styles.div46}>피드백 보내기</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.header}>
            						<div className={styles.div47}>
              							<div className={styles.div48}>
                								<b className={styles.speakNote}>Speak Note</b>
              							</div>
              							<div className={styles.div49} />
                                          <div className={styles.buttonWrapper}>
          <div className={styles.button1} onClick={goToHome} style={{ cursor: "pointer" }}>
            <div className={styles.div50}>강의 시작하기</div>
          </div>
          {isAuthenticated && user && (
            <div style={{ marginLeft: "10px" }}>
              <UserProfile />
            </div>
          )}
          {!isAuthenticated && (
            <div className={styles.button1} onClick={handleAuthAction} style={{ cursor: "pointer", marginLeft: "10px" }}>
              <div className={styles.div50}>로그인</div>
            </div>
          )}
        </div>
            						</div>
          					</div>
                              <Sidebar />
        				</div>
      			</div>
    		</div>);
};

export default Component1;
