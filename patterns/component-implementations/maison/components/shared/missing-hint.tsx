/**
 * 잠긴 주 단추 옆의 «무엇이 모자라는가» 한 줄 (화면 검토 M18 · 2026-09-27).
 *
 * 주 단추가 회색으로 잠겨 있는데 까닭을 말하지 않으면, 사용자는 칸을 하나씩 채워
 * 보며 무엇이 막는지 찾는다. 컴퓨터가 낯선 사람일수록 «고장» 으로 받아들인다.
 * 잠그는 조건과 **같은 목록**을 여기에 넘긴다: 조건은 그대로 두고 까닭만 적는다.
 *
 *     <MissingHint missing={[!title.trim() && "제목", !date && "게시일"]} />
 *
 * 비어 있으면 아무것도 그리지 않는다.
 */
export function MissingHint({
  missing,
  className,
}: {
  /** 빈 필수 칸의 이름. false · 빈 글은 걸러 낸다(조건식을 그대로 넘길 수 있게) */
  missing: ReadonlyArray<string | false | null | undefined>;
  className?: string;
}) {
  const names = missing.filter((m): m is string => Boolean(m));
  if (names.length === 0) return null;
  return (
    <p
      role="status"
      className={`qd-action-hint ${className ?? "qd-field-hint self-center sm:mr-auto"}`}
    >
      필수 항목 {names.length}개를 입력하세요: {names.join(" · ")}
    </p>
  );
}
