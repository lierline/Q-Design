import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Badge } from "@/components/shared/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SortHeaderButton } from "@/components/shared/sort-header-button";
import { StepProgress } from "@/components/shared/step-progress";
import { AuthCard } from "@/components/auth/auth-card";
import { RibbonBackground } from "@/components/auth/ribbon-background";

export default function Fixture() {
  const [checked, setChecked] = useState(false);
  const [document, setDocument] = useState("quality");
  const [cursor, setCursor] = useState("2026-10-10");
  const [selected, setSelected] = useState("2026-10-10");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="qd-page-head qd-page-head--plain">
        <div className="qd-page-head-row">
          <div className="qd-page-head-text">
            <h1 className="qd-page-head-title">품질 문서 검토</h1>
            <p className="qd-page-head-sub" data-hangul>
              메종 공용 부품 검증
            </p>
          </div>
          <Badge tone="success">검토 가능</Badge>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button>저장</Button>
        <Button variant="outline">미리 보기</Button>
        <Button variant="ghost">돌아가기</Button>
        <Button disabled>사용 불가</Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button data-testid="open-dialog">검토 대화상자</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>문서 검토</DialogTitle>
              <DialogDescription>
                입력 내용을 확인하고 검토를 완료합니다.
              </DialogDescription>
            </DialogHeader>
            <Field label="검토 의견">
              <Textarea placeholder="검토 의견을 입력하세요" />
            </Field>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">취소</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>검토 완료</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" data-testid="open-drawer">
              상세 패널
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="qd-drawer-header flex-col pr-[var(--qd-control-icon)]">
              <SheetTitle>문서 상세</SheetTitle>
              <SheetDescription>
                품질 문서의 검토 상태를 확인합니다.
              </SheetDescription>
            </div>
            <div className="qd-drawer-body mt-6 space-y-4">
              <Badge tone="info">검토 중</Badge>
              <Field label="문서명">
                <Input defaultValue="품질관리 절차서" />
              </Field>
            </div>
            <div className="qd-drawer-actions mt-6">
              <SheetClose asChild>
                <Button variant="ghost">닫기</Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
        {(["top", "bottom"] as const).map((side) => (
          <Sheet key={side}>
            <SheetTrigger asChild>
              <Button variant="ghost" data-testid={`open-sheet-${side}`}>
                {side === "top" ? "위" : "아래"} 긴 패널
              </Button>
            </SheetTrigger>
            <SheetContent side={side}>
              <SheetTitle>긴 문서 검토</SheetTitle>
              <SheetDescription>내용이 많아도 패널 안에서 확인합니다.</SheetDescription>
              {Array.from({ length: 60 }, (_, index) => (
                <p key={index} className="py-3">검토 항목 {index + 1}</p>
              ))}
              <SheetClose asChild><Button>확인 완료</Button></SheetClose>
            </SheetContent>
          </Sheet>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="문서명"
            required
            hint="검토할 문서의 제목을 입력하세요."
          >
            <Input placeholder="문서 제목" />
          </Field>
          <Field label="문서 번호" required error="문서 번호를 입력하세요.">
            <Input placeholder="QMN-DOC-0001" />
          </Field>
          <Field label="상태">
            <Select defaultValue="review">
              <option value="draft">작성 중</option>
              <option value="review">검토 중</option>
              <option value="complete">완료</option>
            </Select>
          </Field>
          <Field label="관련 문서">
            <Combobox
              value={document}
              onChange={setDocument}
              options={[
                {
                  value: "quality",
                  label: "품질관리 절차서",
                  hint: "QMN-DOC-0001",
                },
                {
                  value: "record",
                  label: "기록관리 절차서",
                  hint: "QMN-DOC-0002",
                },
                {
                  value: "audit",
                  label: "내부감사 절차서",
                  hint: "QMN-DOC-0003",
                },
              ]}
            />
          </Field>
          <Field label="비고">
            <Textarea placeholder="추가 검토 사항" />
          </Field>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={checked}
                onChange={(event) => setChecked(event.target.checked)}
              />
              검토 항목 선택
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked readOnly disabled />
              완료한 항목
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox indeterminate readOnly />
              일부 항목 선택
            </label>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4" aria-label="검토 진행">
        <h2 className="qd-section-title">검토 진행</h2>
        <StepProgress
          steps={[
            { label: "작성", done: true, detail: "문서 작성 완료" },
            {
              label: "검토",
              done: false,
              current: true,
              detail: "검토 담당자 확인 중",
            },
            { label: "발행", done: false, detail: "최종 승인 대기" },
          ]}
        />
        <div
          className="qd-progress"
          role="progressbar"
          aria-label="검토 진행률"
          aria-valuenow={50}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="qd-progress-fill" style={{ width: "50%" }} />
        </div>
      </section>

      <section className="overflow-x-auto" aria-label="문서 목록">
        <table className="qd-table w-full">
          <thead>
            <tr>
              <SortHeaderButton
                active
                dir={direction}
                onClick={() =>
                  setDirection(direction === "asc" ? "desc" : "asc")
                }
              >
                문서
              </SortHeaderButton>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>품질관리 절차서</td>
              <td>
                <Badge tone="info">검토 중</Badge>
              </td>
            </tr>
            <tr>
              <td>기록관리 절차서</td>
              <td>
                <Badge tone="success">완료</Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-3" aria-label="검토일 선택">
        <h2 className="qd-section-title">검토일</h2>
        <div className="max-w-full overflow-x-auto">
          <Calendar
            cursor={cursor}
            onCursorChange={setCursor}
            selected={selected}
            onPick={setSelected}
          />
        </div>
      </section>
      <EmptyState
        compact
        title="추가 검토 항목이 없습니다"
        description="항목을 등록하면 이곳에 표시됩니다."
        action={<Button variant="outline">검토 항목 등록</Button>}
      />
      <section className="qm-auth relative isolate" data-testid="foundation-auth" aria-label="메종 로그인 기반">
        <RibbonBackground />
        <div className="qm-auth-split">
          <aside className="qm-auth-brand">
            <div>
              <p className="qm-auth-eyebrow">Q-Maison</p>
              <h2 className="qm-auth-headline" data-testid="foundation-auth-title">
                Quality,<br />kept under one<br />
                <span className="qm-auth-headline-accent">roof.</span>
              </h2>
              <p className="qm-auth-subhead">Documents, CAPA and audits in one workspace.</p>
            </div>
          </aside>
          <div className="qm-auth-form-wrap">
            <div className="qm-auth-form-inner">
              <AuthCard title="로그인" description="품질 기록을 이어갑니다.">
                <div className="space-y-4">
                  <Field label="이메일">
                    <Input data-testid="foundation-auth-input" type="email" placeholder="name@example.com" autoComplete="off" />
                  </Field>
                  <Field label="비밀번호">
                    <Input type="password" placeholder="비밀번호" autoComplete="off" />
                  </Field>
                  <Button className="w-full">로그인</Button>
                </div>
              </AuthCard>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
