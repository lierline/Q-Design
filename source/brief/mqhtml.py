# -*- coding: utf-8 -*-
"""MedQraft 대외 문서 빌더 (회사 문서 양식 v8 · HTML).

2026-09-24 부터 회사 문서 양식 규격서 v8 (SP-MQ-2026-001 rev.02, 원본 `templates/spec-v8/`,
정리본 Q-Design docs/23) 을 따릅니다. 오너 결정: 「전체를 v8 이랑 맞춰줘」.
그 전(v7 까지)의 값은 git 이력(이 파일 2026-09-24 이전 판)에 있습니다.

새 문서는 이 모듈로 만들고, HTML 을 원본으로 둡니다. DOCX 와 PDF 는 파생물입니다.

    import sys; sys.path.insert(0, 'D:/Claude/MedQraft Docs/templates')
    from mqhtml import Doc

    d = Doc(doctype='QUO', proj='ONP', seq='001', rev='01',
            docname='견적서', eyebrow='Quotation', title='견적서',
            subtitle='...', client='(재)춘천바이오산업진흥원',
            footer_label='핵심 조건', footer_note='...')
    d.h('견적 개요')
    d.p('...')
    d.save('out/문서.html')            # 저장 직전에 스스로 검사합니다
    d.to_docx('out/문서.html')         # node 로 DOCX 까지 (쪽번호는 Word 필드)
    d.to_pdf('out/문서.pdf')           # 헤드리스 크롬 + v8 머리말 · 꼬리말 · 쪽번호

단위: 값은 규격서의 pt · mm 를 96 dpi 의 px 로 환산해 적습니다(_pt · _mm). 동봉 DOCX 변환기
(tools/html2docx.js)가 모든 길이를 px 로 읽기 때문입니다. pt 로 적으면 Word 에서 3/4 크기로 줄어듭니다.

v8 에서 달라진 것 (v7 대비)
  · 본문색 #1B2230, 소절 제목 #354154. 본문 폭 166 mm (좌우 여백 22 mm)
  · 장 제목: 위 1.2 pt 먹선 + 왼쪽 14 mm 열에 금색 모노 번호. 장마다 새 쪽 (chapter_page)
  · 표: 바탕색 없음, 위 1.2 pt · 아래 0.75 pt 먹선 머리행, 0.4 pt 가로선, 「표 N」 캡션, 고정 열 너비
  · 한 줄 결론(footer_note)은 꼬리말이 아니라 문서 끝 「면책」 장의 ◆ 밴드에 한 번
  · 면책은 번호 없는 장. 개정 이력 쪽은 두지 않음(v8 표 6). 발행본 rev.01
  · 표지에는 머리말 · 꼬리말 · 쪽번호 · 워터마크를 넣지 않음(to_pdf · DOCX 첫 쪽)

긴 줄표: 문서 어디에도 쓰지 않습니다. **예외는 한 자리**, 부록 · 면책의 «장 번호 칸»(v8 표 2 · 표 6).
2026-09-24 오너 결정 「v8 대로 긴 줄표 사용」. 그 칸은 `<span data-slot="장번호">` 로 표시하고,
검사는 그 표시가 붙은 칸의 긴 줄표 한 글자만 뺀 뒤 나머지 전부를 봅니다.
소스에는 그 글자를 직접 적지 않고 CHAPTER_DASH 로 만듭니다(소스 짝대기 검사가 그대로 돌게).

검사는 저장을 «막습니다».
  · 짝대기(em/en dash, HTML 엔티티) 0곳 (위 한 자리 제외)
  · 표마다 머리글이 비어 있지 않을 것
  · 행마다 열 수가 같을 것
  · 종이 위 글자 대비 4.5 이상 · 한글 · 모노 글꼴 폴백

서식을 바꾸면 이미 발행한 문서와 달라집니다. 이미 나간 문서는 그대로 둡니다.
"""
import datetime
import html as _html
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))

# ── 팔레트 (v8 규격서 · Q-Design docs/23) ────────────────────────────────
#
# 🔴 2026-09-10 종이 대비 보정의 뿌리는 그대로입니다: 금색은 둘로 나눕니다. 선 · 면 ·
#    워터마크 같은 «장식» 은 브랜드 금색, 종이 위 «글자» 는 어두운 금색(4.52).
# 🔑 v8 은 본문과 소절 제목의 색을 나눴습니다. 본문 #1B2230 · 소절 제목 #354154.
#    v7 까지 BODY 가 #354154 였습니다(Q-Design extract-mqdoc 의 「변환기와 차이」).
INK = '#0E1116'          # 제목 · 강조 · 표 머리 · 굵은 규칙선 (흰 종이 18.91)
BODY = '#1B2230'         # 본문 텍스트 (v8)
SUB = '#354154'          # 소절 제목 · 표지 부제 (v8, v7 의 본문색)
MUTED = '#647286'        # 뮤트 · 메타 · 캡션 · 빈 칸 (4.51)
RULE = '#E2E6EC'         # 헤어라인 (면이라 대비 대상 아님)
RULE_STRONG = '#C2CAD6'  # 강한 헤어라인 · 직인란 점선
LABEL_BG = '#F3F6FA'     # 기입 양식(QMS 양식) 라벨 칸 배경. v8 보고서 표에는 쓰지 않습니다
GOLD = '#D6B56D'         # 브랜드 금색. **장식 전용**: 선 · 면 · 워터마크
GOLD_INK = '#8C6C27'     # 종이 위 «글자» 용 금색 (4.52). 아이브로우 · 장 번호 · 표 번호
INDIGO = '#4A5DFF'       # v7 STEP 라벨. v8 팔레트에 없어 빌더는 더 쓰지 않습니다(옛 생성기 호환용 이름)

# v8 표 5 차트 색
BAR = '#CFC7B6'          # 기본 막대
BAR_HI = GOLD_INK        # 강조 한 계열만
WARN = '#B3403A'         # 경고

MAJOR, MINOR, OBSERV, COMPLIANT = '#D92A1F', '#906B11', '#4A5DFF', '#248054'

# 옛 mqdoc 이름. 문서를 옮길 때 표 정의를 그대로 쓸 수 있게 둡니다.
HEAD = ALT = LABEL_BG

# 🔴 2026-09-10 폴백 명시: 없는 글리프가 sans-serif 로 떨어지면 Windows 에서 굴림체가 됩니다.
SANS = "'Noto Sans KR','Malgun Gothic',sans-serif"
MONO = "'JetBrains Mono',Consolas,monospace"

# 판형 (v8 표 1): A4, 좌 · 우 · 위 22 mm, 아래 22 mm + 쪽번호 띠 13 mm, 본문 폭 166 mm
MARGIN_MM = 22
BOTTOM_MM = 35
BODY_PX = 627            # 166 mm @96dpi

COMPANY = '메드크래프트'  # v8 머리말 · 꼬리말 · 발신. 개인사업자라 「주식회사」 를 붙이지 않습니다(법인 전환 전)
CEO = '대표 김병휘'
ADDR = '경기도 성남시 수정구 금토로 80번길 56 · 사업자등록번호 720-12-02968'
CONTACT = '010-8050-8510 · bhkim@medqraft.co.kr'

# v8 표 6 「문체」: 평서형 종결(~한다 · ~아니한다). v7 까지는 「~입니다」 였다.
DISCLAIMER = (
    '본 서비스는 의료기기 R&D·인허가·QMS 운영을 지원하는 도구이다. '
    '최종 인허가 판단과 제출 책임은 제조·수입업자에게 있다. '
    '본 문서는 수신자에 한하여 제공되는 기밀 문서로, 메드크래프트의 '
    '사전 서면 동의 없이 제3자에게 공개·복제·배포할 수 없다.'
)

_DASHES = {0x2014: 'em dash', 0x2013: 'en dash', 0x2015: 'horizontal bar'}
CHAPTER_DASH = chr(0x2014)          # v8: 부록 · 면책의 장 번호 칸에만 (위 머리말 참고)
SLOT = 'data-slot="장번호"'
TOC_MIN = 4                         # 장이 이만큼 이상이면 표지 다음에 목차 (v8 표 4 「목차」)
# v8 표 2 의 크기 + 규격서 예시 표지 · 목차에만 쓰는 크기(7 · 9.5 · 10.5 · 17 pt)
V8_SIZES = (30, 17, 15, 11.5, 10.5, 10, 9.5, 8.5, 8, 7.5, 7, 6)


def _pt(v):
    """pt → px 문자열 (96 dpi). DOCX 변환기가 px 로만 읽습니다."""
    return f'{v * 4 / 3:.2f}'.rstrip('0').rstrip('.') + 'px'


def _mm(v):
    """mm → px 문자열 (96 dpi)."""
    return f'{v * 96 / 25.4:.2f}'.rstrip('0').rstrip('.') + 'px'


class VerifyError(Exception):
    """검사를 통과하지 못했습니다. 저장하지 않습니다."""


def _luminance(hexv):
    """WCAG 상대 휘도."""
    s = hexv.lstrip('#')
    out = 0.0
    for i, w in ((0, 0.2126), (2, 0.7152), (4, 0.0722)):
        v = int(s[i:i + 2], 16) / 255.0
        v = v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
        out += v * w
    return out


def _contrast(a, b):
    """두 색의 대비비. 4.5 이상이 본문 AA 입니다."""
    la, lb = _luminance(a), _luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def esc(s):
    """글자를 HTML 에 안전하게. 이미 태그가 든 조각에는 쓰지 마십시오."""
    return _html.escape(str(s), quote=False)


def blank(text=''):
    """사용자 기입란 〔 〕. 회색으로 나옵니다."""
    return f'<span style="color:{MUTED}">〔 {esc(text)} 〕</span>' if text \
        else f'<span style="color:{MUTED}">〔 〕</span>'


# 표 셀 여백 (v8 표 3): 상하 1.9 mm · 좌우 2.5 mm, 첫 열 왼쪽 0 · 끝 열 오른쪽 0
_PV, _PH = _mm(1.9), _mm(2.5)


def _pad(ci, ncol, v=_PV):
    left = '0' if ci == 0 else _PH
    right = '0' if ci == ncol - 1 else _PH
    return f'padding:{v} {right} {v} {left}'


def _fits(table_html, nrows, ncol):
    """v8 표 4: 20행 이하이고 한 쪽(본문 높이 231 mm)에 들어갈 표만 한 덩어리로 묶는다.

    🔴 행 수만 보면 여러 줄짜리 셀이 든 표(MADDE 견적 내역 표 4)가 「묶임」 이 되어, 쪽에 안 들어가니
       다음 쪽으로 통째로 밀리고 앞 쪽이 거의 빈 채 남았다(2026-09-24). 셀 글자 수로 줄 수를 어림한다.
       어림은 넉넉하게(한 줄에 한글 폭 기준) 잡아, 애매하면 묶지 않고 나누는 쪽으로 기운다.
    """
    if nrows > 21:
        return False
    per_line = max(8, int(BODY_PX / max(ncol, 1) / 11.5))      # 8.5 pt 한글 한 자 ≈ 11.3 px
    height = 0.0
    for row in re.findall(r'<tr.*?</tr>', table_html, re.S):
        lines = 1
        for cell in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.S):
            txt = re.sub(r'<[^>]*>', '', cell)
            blocks = max(1, cell.count('<div'))
            lines = max(lines, blocks + len(txt) // per_line)
        height += lines * 16.4 + 14.4                          # 줄 높이 8.5 pt × 1.45 + 셀 위아래 여백
    return height < 231 * 96 / 25.4 * 0.75                      # 본문 높이의 3/4 까지만


class _Chapter:
    """장 제목 자리표. 절 목록(v8 표 4)을 알려면 장이 끝나야 해서 html() 때 그립니다."""

    def __init__(self, no, title, first, new_page):
        self.no, self.title, self.first, self.new_page = no, title, first, new_page
        self.subs = []


class Doc:
    def __init__(self, doctype, proj, seq='001', rev='01', *, docname,
                 eyebrow, title, subtitle, client, footer_label, footer_note,
                 date=None, to_line='', project_name='', title_size=None,
                 meta_extra=None, product='Q-Atelier', disclaimer=None,
                 form_ref='', parent='', chapter_page=True, toc=None):
        # 머리말에 찍히는 «제품 이름». 기본은 Q-Atelier (2026-09-22 부터 건별로 바꿀 수 있음).
        self.product = product
        # 면책 장 본문. 인허가가 걸리지 않는 건(9001 전산화 등)은 건별로 갈아 끼웁니다.
        self.disclaimer_text = disclaimer or DISCLAIMER
        self.doctype = doctype
        self.proj = proj.upper()
        self.seq = str(seq).zfill(3)
        self.rev = str(rev).zfill(2)
        self.docname = docname
        self.date = date or datetime.date.today()
        self.docno = f'{doctype}-{self.proj}-{self.date:%Y}-{self.seq}'
        self.date_doc = f'{self.date:%Y.%m.%d}'          # v8 표지: 2026.08.28
        self.client = client
        self.to_line = to_line
        self.project_name = project_name
        self.footer_label = footer_label
        self.footer_note = footer_note
        self.eyebrow = eyebrow
        self.title = title
        self.subtitle = subtitle
        # v8 표 2: 표지 제목은 30 pt 하나. 옛 생성기가 넘기는 title_size 는 받기만 하고 쓰지 않습니다.
        self.title_size = title_size
        self.form_ref = form_ref                          # 문서정보 「준용 양식」 (v8 6.1)
        self.parent = parent                              # 문서정보 「상위 문서」
        self.chapter_page = chapter_page                  # v8 표 4: 장은 새 쪽에서
        self.toc = toc                                    # None 이면 장 TOC_MIN 개 이상일 때 목차
        self._meta = meta_extra or []
        self._body = []
        self._chapters = []
        self._secno = 0
        self._first_section = True
        self._tno = 0                                     # 「표 N」 (v8 표 3: 문서 안에서 1부터 연속)
        self._fno = 0                                     # 「그림 N」

    # ── 표지 문서정보 ─────────────────────────────────────────────────────
    def meta(self, rows):
        """표지 오른쪽 문서정보. [(라벨, 값, mono여부), ...]"""
        self._meta = rows

    def _meta_rows(self):
        if self._meta:
            return self._meta
        # v8 6.1: 문서번호 · 개정 · 준용 양식 · 상태 · 작성일 · 상위 문서 순
        rows = [('문서번호', self.docno, True), ('개정', f'rev.{self.rev}', True)]
        if self.form_ref:
            rows.append(('준용 양식', esc(self.form_ref), True))
        rows += [('상태', '발행', False), ('작성일', self.date_doc, True)]
        if self.parent:
            rows.append(('상위 문서', esc(self.parent), True))
        return rows

    def _meta_html(self):
        rows = self._meta_rows()
        out = []
        for i, (label, value, mono) in enumerate(rows):
            line = f'1px solid {INK}' if i == len(rows) - 1 else f'{_pt(0.4)} solid {RULE}'
            vs = f'font-family:{MONO};font-size:{_pt(8)};' if mono else ''
            w = f'width:{_mm(22)};' if i == 0 else ''
            out.append(
                f'<tr><td style="{w}padding:{_mm(1.7)} 0;border-bottom:{line};color:{MUTED};'
                f'white-space:nowrap">{esc(label)}</td>'
                f'<td style="padding:{_mm(1.7)} 0;border-bottom:{line};{vs}color:{INK}">'
                f'{value}</td></tr>')
        return (f'<table style="width:100%;margin-top:{_mm(3.5)};border-collapse:collapse;'
                f'font-size:{_pt(8.5)};line-height:1.5"><tbody>' + ''.join(out) + '</tbody></table>')

    # ── 본문 블록 ─────────────────────────────────────────────────────────
    def h(self, text, num=None):
        """장 제목. 번호는 01, 02 … 로 자동 부여됩니다. 장은 새 쪽에서 시작합니다(chapter_page)."""
        if not self._first_section:
            self._body.append('</section>')
        self._secno += 1
        no = num if num is not None else f'{self._secno:02d}'
        ch = _Chapter(no, text, self._first_section, self.chapter_page)
        self._first_section = False
        self._chapters.append(ch)
        self._body.append(ch)

    def unnumbered(self, text):
        """번호 없는 장(요약 · 부록). v8: 장 번호 칸에 긴 줄표 한 글자."""
        self.h(text, num=CHAPTER_DASH)
        self._secno -= 1

    def h3(self, text):
        """절 제목 (v8 11.5 pt 700, 위 11 mm 아래 2.5 mm)."""
        if self._chapters:
            self._chapters[-1].subs.append(text)
        self._body.append(
            f'<h3 style="break-after:avoid;font-size:{_pt(11.5)};font-weight:700;color:{INK};'
            f'line-height:1.35;margin:{_mm(11)} 0 {_mm(2.5)}">{esc(text)}</h3>')

    def h4(self, text):
        """소절 제목 (v8 10 pt 700 #354154, 위 8.5 mm)."""
        self._body.append(
            f'<h4 style="break-after:avoid;font-size:{_pt(10)};font-weight:700;color:{SUB};'
            f'line-height:1.4;margin:{_mm(8.5)} 0 {_mm(2.5)}">{esc(text)}</h4>')

    def p(self, text, raw=False, lead=False):
        """본문 문단 (v8 10 pt / 1.62, 문단 사이 3 mm). raw=True 면 태그를 그대로, lead=True 면 위를 띄웁니다."""
        body = text if raw else esc(text)
        margin = f'{_mm(8)} 0 {_mm(3)}' if lead else f'0 0 {_mm(3)}'
        self._body.append(
            f'<p style="font-size:{_pt(10)};line-height:1.62;color:{BODY};'
            f'margin:{margin}">{body}</p>')

    def note(self, text, raw=False):
        """※ 로 시작하는 작은 주석 (v8 7.5 pt #647286, 위 1.8 mm)."""
        body = text if raw else esc(text)
        self._body.append(
            f'<p style="font-size:{_pt(7.5)};line-height:1.6;color:{MUTED};'
            f'margin:{_mm(1.8)} 0 {_mm(3)}">{body}</p>')

    def callout(self, text, label='핵심'):
        """◆ 밴드. v8: 한 줄 결론은 문서 끝에 한 번(footer_note 가 면책 장에 자동으로 들어갑니다).
        본문 중간의 밴드는 꼭 필요한 곳에만 씁니다."""
        self._body.append(self._band(label, text))

    @staticmethod
    def _band(label, text):
        return (f'<div style="display:flex;align-items:baseline;margin:{_mm(8)} 0 {_mm(3)};'
                f'border-top:{_pt(1.2)} solid {INK};border-bottom:{_pt(0.5)} solid {RULE};'
                f'padding:{_mm(4)} 0;break-inside:avoid">'
                f'<span style="flex:none;width:{_mm(24)};font-size:{_pt(8)};font-weight:700;'
                f'color:{GOLD_INK};white-space:nowrap">◆ {esc(label)}</span>'
                f'<span style="font-size:{_pt(10)};font-weight:700;line-height:1.6;color:{INK}">'
                f'{esc(text)}</span></div>')

    def _caption(self):
        self._tno += 1
        return (f'<caption style="caption-side:top;text-align:left;margin-bottom:{_mm(2)};'
                f'break-after:avoid"><span style="font-family:{MONO};font-size:{_pt(7.5)};'
                f'font-weight:600;color:{GOLD_INK};letter-spacing:0.06em">표 {self._tno}</span>'
                f'</caption>')

    def table(self, rows, widths=None, aligns=None, header=True, foot=None,
              sizes=None, caption=True):
        """데이터 표 (v8 표 3).

        rows   : [[셀, ...], ...]. 셀은 str(HTML 허용) 또는 dict
                 dict 키 - t(글) · a(정렬) · b(굵게) · c(색) · mono · fill · span
        widths : 열 폭 CSS 문자열 목록. 예 ['32px', None, '96px']. 숫자면 비율
        aligns : 열별 정렬. ['left','right', ...]
        foot   : 합계 행. [(라벨, 값, 강조여부), ...]
        caption: 「표 N」 번호를 붙입니다(v8: 모든 표, 문서 안에서 1부터 연속)
        """
        ncol = max(len(r) for r in rows)
        # 🔴 px 여야 합니다. 동봉 변환기가 「px 폭 → twips ×15」로만 읽으므로
        #    % 로 주면 열 폭이 통째로 무시돼 글자가 세로로 늘어집니다.
        if widths and any(isinstance(w, (int, float)) for w in widths):
            tot = sum(w for w in widths if isinstance(w, (int, float))) or 1
            widths = [f'{round(w / tot * BODY_PX)}px' if isinstance(w, (int, float))
                      else w for w in widths]
        body_rows = rows[1:] if header else rows
        n_last = len(body_rows) - 1
        out = []
        out.append(f'<table style="width:100%;border-collapse:collapse;table-layout:fixed;'
                   f'font-size:{_pt(8.5)};line-height:1.45;color:{BODY}">')
        if caption:
            out.append(self._caption())

        def cell(spec, ci, tag, is_head, ri):
            if not isinstance(spec, dict):
                spec = {'t': spec}
            # 셀 안의 줄바꿈은 블록으로, '~' 로 시작하는 줄은 «곁들이는 설명» 으로 흐리게.
            raw_t = str(spec.get('t', ''))
            lines = raw_t.split('\n')
            parts = []
            for ln in lines:
                if ln.startswith('~'):
                    body_ln = (f'<span style="color:{MUTED};font-size:{_pt(7.5)}">'
                               f'{ln[1:]}</span>')
                else:
                    body_ln = ln
                # 여러 줄이면 <br> 이 아니라 블록으로 감쌉니다(변환기가 <br> 을 삼킵니다).
                parts.append(f'<div style="margin:0 0 3px">{body_ln}</div>'
                             if len(lines) > 1 else body_ln)
            t = ''.join(parts)
            a = spec.get('a') or (aligns[ci] if aligns and ci < len(aligns) else 'left')
            span = spec.get('span', 1)
            last_col = ci + span - 1 == ncol - 1
            st = [f'text-align:{a}', _pad(ci, ncol if not last_col else ci + 1),
                  'vertical-align:top', 'overflow-wrap:anywhere', 'box-sizing:border-box']
            if widths and ci < len(widths) and widths[ci]:
                st.append(f'width:{widths[ci]}')
            if is_head:
                st += [f'font-size:{_pt(8)}', 'font-weight:700', f'color:{INK}',
                       f'border-top:{_pt(1.2)} solid {INK}', f'border-bottom:1px solid {INK}']
            else:
                if ri == 0 and not header:
                    st.append(f'border-top:{_pt(1.2)} solid {INK}')
                st.append(f'border-bottom:1px solid {INK}' if ri == n_last and not foot
                          else f'border-bottom:{_pt(0.4)} solid {RULE}')
                if ci == 0:
                    st += [f'color:{INK}', 'font-weight:500']
                if spec.get('b'):
                    st += ['font-weight:700', f'color:{INK}']
                if spec.get('c'):
                    st.append(f'color:{spec["c"]}')
                if spec.get('mono'):
                    st.append(f'font-family:{MONO}')
                if spec.get('fill'):
                    st.append(f'background:{spec["fill"]}')
            sp = f' colspan="{span}"' if spec.get('span') else ''
            return f'<{tag}{sp} style="{";".join(st)}">{t}</{tag}>'

        if header:
            out.append('<thead style="break-after:avoid;break-inside:avoid"><tr>')
            out += [cell(rows[0][ci] if ci < len(rows[0]) else '', ci, 'th', True, -1)
                    for ci in range(ncol)]
            out.append('</tr></thead>')

        out.append('<tbody>')
        for ri, row in enumerate(body_rows):
            out.append('<tr style="break-inside:avoid">')
            ci = 0
            for spec in row:
                out.append(cell(spec, ci, 'td', False, ri))
                ci += (spec.get('span', 1) if isinstance(spec, dict) else 1)
            out.append('</tr>')
        out.append('</tbody>')

        if foot:
            out.append('<tfoot>')
            for i, (label, value, strong) in enumerate(foot):
                last = i == len(foot) - 1
                top = f'border-top:1px solid {INK};' if i == 0 else ''
                bd = (f'border-bottom:1px solid {INK}' if last
                      else f'border-bottom:{_pt(0.4)} solid {RULE}')
                weight = f'font-weight:700;color:{INK}' if (last or strong) else f'color:{BODY}'
                out.append(
                    f'<tr style="break-inside:avoid"><td colspan="{ncol - 1}" style="{top}'
                    f'padding:{_PV} {_PH} {_PV} 0;text-align:right;{weight};{bd}">{esc(label)}</td>'
                    f'<td style="{top}padding:{_PV} 0 {_PV} {_PH};text-align:right;'
                    f'font-family:{MONO};{weight};{bd}">{value}</td></tr>')
            out.append('</tfoot>')
        out.append('</table>')
        # v8 표 4: 20행 이하면 한 덩어리(쪽을 넘기지 않음). 넘으면 머리행만 쪽마다 되풀이
        keep = 'break-inside:avoid;' if _fits(''.join(out), len(rows), ncol) else ''
        self._body.append(f'<div style="{keep}margin:{_mm(5)} 0 {_mm(3)}">' + ''.join(out) + '</div>')

    def labeled(self, rows, label_w='140px'):
        """라벨-값 표. v8: 바탕색 없이 라벨 열만 500 먹색."""
        n = len(rows) - 1
        out = [f'<table style="width:100%;border-collapse:collapse;table-layout:fixed;'
               f'font-size:{_pt(8.5)};line-height:1.45;color:{BODY}">', self._caption(), '<tbody>']
        for i, (label, value) in enumerate(rows):
            top = f'border-top:{_pt(1.2)} solid {INK};' if i == 0 else ''
            bd = f'1px solid {INK}' if i == n else f'{_pt(0.4)} solid {RULE}'
            out.append(
                f'<tr style="break-inside:avoid">'
                f'<td style="{top}{_pad(0, 2)};border-bottom:{bd};width:{label_w};color:{INK};'
                f'font-weight:500;vertical-align:top;overflow-wrap:anywhere;box-sizing:border-box">{esc(label)}</td>'
                f'<td style="{top}{_pad(1, 2)};border-bottom:{bd};color:{BODY};line-height:1.62;'
                f'vertical-align:top;overflow-wrap:anywhere">{str(value).replace(chr(10), "<br>")}'
                f'</td></tr>')
        out.append('</tbody></table>')
        keep = 'break-inside:avoid;' if _fits(''.join(out), len(rows), 2) else ''
        self._body.append(f'<div style="{keep}margin:{_mm(5)} 0 {_mm(3)}">' + ''.join(out) + '</div>')

    def cards(self, items, cols=3, accent=None):
        """나란히 놓는 짧은 묶음. v8 에는 상자가 없어 위 먹선 + 여백으로만 가릅니다(accent 는 옛 호환)."""
        cells = []
        for title, body in items:
            cells.append(
                f'<div style="border-top:{_pt(1.2)} solid {INK};padding:{_mm(2.5)} 0 {_mm(1.5)}">'
                f'<div style="font-size:{_pt(10)};font-weight:700;color:{INK};'
                f'margin-bottom:{_mm(1.5)}">{esc(title)}</div>'
                f'<div style="font-size:{_pt(8.5)};line-height:1.6;color:{BODY}">'
                f'{esc(body)}</div></div>')
        self._body.append(
            f'<div style="display:grid;grid-template-columns:repeat({cols},1fr);'
            f'gap:{_mm(4)};margin:{_mm(3)} 0 {_mm(3)};break-inside:avoid">' + ''.join(cells) + '</div>')

    def _figcap(self, title, source=''):
        self._fno += 1
        src = (f'<div style="margin-top:{_mm(1.4)};font-size:{_pt(7.5)};line-height:1.6;'
               f'color:{MUTED}">{esc(source)}</div>') if source else ''
        return (f'<div style="margin-top:{_mm(2.2)};break-before:avoid">'
                f'<span style="font-family:{MONO};font-size:{_pt(7.5)};font-weight:600;color:{GOLD_INK};'
                f'letter-spacing:0.06em">그림 {self._fno}</span>'
                f'<span style="font-size:{_pt(8.5)};font-weight:700;color:{INK};margin-left:{_mm(3)}">'
                f'{esc(title)}</span>{src}</div>')

    def steps(self, items, caption=None):
        """STEP 흐름. items 는 [(제목, 본문), ...]

        🔴 flex 가 아니라 «표» 로 만듭니다(DOCX 에서 가로 배치가 풀려 세로로 늘어지기 때문).
        v8 에는 인디고가 없어 STEP 라벨은 종이용 금색입니다.
        """
        n = len(items)
        arrow_w = 22
        cell_w = (BODY_PX - arrow_w * (n - 1)) // n
        cells, widths = [], []
        for i, (title, body) in enumerate(items, 1):
            if i > 1:
                cells.append({'t': '→', 'a': 'center', 'c': GOLD_INK})
                widths.append(f'{arrow_w}px')
            cells.append({'t':
                f'<div style="font-family:{MONO};font-size:{_pt(7.5)};color:{GOLD_INK};'
                f'font-weight:600;letter-spacing:0.08em">STEP {i}</div>'
                f'<div style="font-size:{_pt(10)};font-weight:700;color:{INK};'
                f'margin:5px 0 5px">{esc(title)}</div>'
                f'<div style="font-size:{_pt(8.5)};line-height:1.6;color:{BODY}">'
                f'{esc(body)}</div>', 'a': 'left'})
            widths.append(f'{cell_w}px')
        self.table([cells], widths=widths, header=False, caption=False)
        if caption:
            self._body.append(self._figcap(caption))

    def gantt(self, bars, weeks=28, label_w='178px', head='구간 (계약 후 주차)', caption=None):
        """주차 간트. bars 는 (라벨, 시작주, 끝주, kind) 목록.

        kind 는 'own'(당사 수행, v8 강조 #8C6C27) 또는 'client'(발주기관 소관, v8 기본 막대 #CFC7B6).
        주차는 1부터 세고 양쪽 끝을 포함합니다.
        """
        th = (f'text-align:left;padding:{_mm(1.6)} 4px;font-size:{_pt(8)};font-weight:700;'
              f'color:{INK};border-top:{_pt(1.2)} solid {INK};border-bottom:1px solid {INK}')

        # 주차 숫자는 5칸마다만 적습니다(28칸에 두 자리 수를 모두 넣으면 세로로 쪼개집니다).
        def wk(w):
            return str(w) if (w == 1 or w % 5 == 0 or w == weeks) else ''
        head_cells = (f'<th style="{th};padding-left:0;width:{label_w};box-sizing:border-box">{esc(head)}</th>'
                      + ''.join(f'<th style="{th};text-align:center;font-family:{MONO};'
                                f'font-size:{_pt(6)};padding:{_mm(1.6)} 0">{wk(w)}</th>'
                                for w in range(1, weeks + 1)))
        rows = []
        for ri, (label, s, e, kind) in enumerate(bars):
            fill = BAR_HI if kind == 'own' else BAR
            bd = f'1px solid {INK}' if ri == len(bars) - 1 else f'{_pt(0.4)} solid {RULE}'
            cells = [f'<td style="padding:{_mm(1.6)} 4px {_mm(1.6)} 0;font-size:{_pt(8)};color:{BODY};'
                     f'vertical-align:middle;border-bottom:{bd}">{esc(label)}</td>']
            for w in range(1, weeks + 1):
                bg = f'background:{fill};' if s <= w <= e else ''
                cells.append(f'<td style="padding:{_mm(1.6)} 0;{bg}border-bottom:{bd}"></td>')
            rows.append('<tr style="break-inside:avoid">' + ''.join(cells) + '</tr>')
        self._body.append(
            f'<div style="margin:{_mm(5)} 0 {_mm(3)};break-inside:avoid">'
            '<table style="width:100%;border-collapse:collapse;table-layout:fixed">'
            f'<thead><tr>{head_cells}</tr></thead><tbody>' + ''.join(rows) + '</tbody></table>'
            + (self._figcap(caption) if caption else '') + '</div>')

    def raw(self, html_str):
        self._body.append(html_str)

    # ── 옛 mqdoc 문서를 옮길 때 쓰는 별칭 ─────────────────────────────────
    def hilite(self, text):
        """옛 이름. 앞의 「◆ 라벨」 을 떼고 밴드로 넘깁니다."""
        m = re.match(r'\s*◆\s*(\S+)\s+(.*)', text, re.S)
        if m:
            self.callout(re.sub(r'\s+', ' ', m.group(2)).strip(), m.group(1))
        else:
            self.callout(text)

    def muted(self, text, size=None):
        self.note(text)

    def disclaimer(self, text):
        """옛 이름. 표준 면책은 문서 끝 장에 자동으로 붙으므로, 여기 오는 글은
        그 문서 고유의 단서(지식 자산 표기 등)로 보고 작은 글씨로 답니다."""
        self.note(text)

    def legend(self, text):
        self.note(text)

    def spacer(self, after=None):
        pass

    def h2(self, text):
        self.h3(text)

    def merge(self, *a, **k):
        pass

    def pagebreak(self):
        self._body.append('<div style="break-after:page"></div>')

    # ── 마무리 ────────────────────────────────────────────────────────────
    def revision(self, rows=None):
        """v8 표 6: 외부 배포본에는 개정 이력 쪽을 두지 않습니다. 이력은 사내 대장에서 관리합니다.
        옛 생성기가 부르므로 이름은 남기고 아무것도 그리지 않습니다(2026-09-24)."""
        return None

    # ── 조립 ──────────────────────────────────────────────────────────────
    def _slot(self, no):
        return (f'<span {SLOT} style="flex:none;width:{_mm(14)};font-family:{MONO};font-size:{_pt(10)};'
                f'font-weight:600;letter-spacing:0.04em;color:{GOLD_INK}">{esc(no)}</span>')

    def _chapter_html(self, ch):
        brk = 'break-before:page;' if (ch.new_page and not ch.first) else ''
        top = '0' if (ch.first or ch.new_page) else _mm(11)
        subs = ''
        if ch.subs:
            subs = (f'<div style="margin:{_mm(1.6)} 0 0 {_mm(14)};font-size:{_pt(8)};color:{MUTED};'
                    f'line-height:1.5">{esc(" · ".join(ch.subs))}</div>')
        return (f'<section data-screen-label="{esc(ch.no)} {esc(ch.title)}" style="{brk}">'
                f'<div style="break-after:avoid;margin:{top} 0 {_mm(8)}">'
                f'<div style="display:flex;align-items:baseline;border-top:{_pt(1.2)} solid {INK};'
                f'padding-top:{_mm(3.5)}">{self._slot(ch.no)}'
                f'<h2 style="margin:0;font-size:{_pt(15)};font-weight:700;letter-spacing:-0.01em;'
                f'line-height:1.3;color:{INK}">{esc(ch.title)}</h2></div>{subs}</div>')

    def _toc_on(self):
        return self.toc if self.toc is not None else len(self._chapters) >= TOC_MIN

    def _toc(self):
        rows = [(c.no, c.title, c.subs) for c in self._chapters]
        rows.append((CHAPTER_DASH, '면책', []))
        out = []
        for i, (no, title, subs) in enumerate(rows):
            top = f'border-top:{_pt(1.2)} solid {INK};' if i == 0 else ''
            bd = f'1px solid {INK}' if i == len(rows) - 1 else f'{_pt(0.4)} solid {RULE}'
            w = f'width:{_mm(16)};' if i == 0 else ''
            sub = (f'<div style="margin-top:{_mm(1.2)};font-size:{_pt(8)};color:{MUTED}">'
                   f'{esc(" · ".join(subs))}</div>') if subs else ''
            out.append(
                f'<tr><td style="{w}{top}padding:{_mm(1.5)} {_mm(2.5)} {_mm(1.5)} 0;border-bottom:{bd};'
                f'vertical-align:top"><span {SLOT} style="font-family:{MONO};font-size:{_pt(8)};'
                f'color:{GOLD_INK}">{esc(no)}</span></td>'
                f'<td style="{top}padding:{_mm(1.5)} 0 {_mm(1.5)} {_mm(2.5)};border-bottom:{bd};'
                f'vertical-align:top"><span style="font-weight:700;color:{INK}">{esc(title)}</span>'
                f'{sub}</td></tr>')
        return (f'<section data-screen-label="목차" style="break-after:page">'
                f'<h2 style="margin:0;font-size:{_pt(17)};font-weight:700;letter-spacing:-0.01em;'
                f'color:{INK}">목차</h2>'
                f'<div style="margin-top:{_mm(2.5)};height:{_pt(1.2)};background:{INK}"></div>'
                f'<table style="width:100%;margin-top:{_mm(5)};border-collapse:collapse;'
                f'table-layout:fixed;font-size:{_pt(8.5)};line-height:1.45;color:{BODY}"><tbody>'
                + ''.join(out) + '</tbody></table></section>')

    def _header(self):
        # v8 6.2 머리말 · 6.4 워터마크. 머리말 바깥 상자에는 position 을 주지 않습니다(인쇄 때 쪽 폭을 못 잡음).
        # 워터마크는 머리말 안 높이 0 상자에서 절대 위치(오른쪽 끝, 위에서 179 mm, 폭 105 mm, 불투명도 0.05).
        # DOCX 변환기는 절대 위치 요소를 건너뛰므로 Word 에는 워터마크가 없습니다.
        return (
            f'<div slot="header" style="display:flex;justify-content:space-between;'
            f'align-items:flex-end;padding-bottom:{_mm(2.4)};border-bottom:{_pt(0.5)} solid {RULE};'
            f'font-family:{SANS}">'
            f'<div style="display:flex;align-items:center;gap:{_mm(2.5)}">'
            f'<img src="assets/logo-horizontal-black.png" alt="MedQraft" '
            f'style="height:{_mm(3.2)};display:block"> '
            f'<span style="font-size:{_pt(7.5)};color:{MUTED};white-space:nowrap">'
            f'{esc(self.product)} · {esc(self.docname)}</span></div>'
            f'<div style="display:flex;align-items:baseline;gap:{_mm(3)};flex-shrink:0">'
            f'<span style="font-size:{_pt(6)};letter-spacing:0.3em;color:{MUTED};'
            f'white-space:nowrap">CONFIDENTIAL</span> '
            f'<span style="font-family:{MONO};font-size:{_pt(7.5)};color:{INK};'
            f'white-space:nowrap">{self.docno}</span></div>'
            f'<div style="height:0;overflow:visible"><img src="assets/mq-mark-black.png" alt="" '
            f'aria-hidden="true" style="position:absolute;right:0;top:{_mm(179)};'
            f'width:{_mm(105)};opacity:0.05;pointer-events:none;-webkit-print-color-adjust:exact;'
            f'print-color-adjust:exact"></div></div>')

    def _footer(self):
        # v8 6.3: 왼쪽 회사명, 오른쪽 문서번호 · rev. 한 줄 결론은 넣지 않습니다.
        # 쪽번호 「n / 전체」 는 인쇄 엔진이 찍습니다: DOCX 는 Word 필드(data-folio), PDF 는 to_pdf.
        return (
            f'<div slot="footer" data-folio="v8" style="display:flex;justify-content:space-between;'
            f'align-items:baseline;padding-top:{_mm(2.2)};border-top:{_pt(0.5)} solid {RULE};'
            f'font-family:{SANS}">'
            f'<span style="font-size:{_pt(7.5)};color:{MUTED}">{COMPANY}</span> '
            f'<span style="font-family:{MONO};font-size:{_pt(7.5)};color:{MUTED};white-space:nowrap">'
            f'{self.docno} · rev.{self.rev}</span></div>')

    def _cover(self, height=None):
        # v8 6.1: 위 26 mm 공백 → 아이브로우 · 제목 · 부제 → 1.2 pt 먹선 → TO 블록과 문서정보 표(2단)
        #         → 아래 여백에 발신 블록. 표지에는 머리말 · 꼬리말 · 쪽번호를 넣지 않습니다.
        to_line = esc(self.to_line) if self.to_line else blank('부서 · 담당자 성명')
        proj = esc(self.project_name) if self.project_name else blank('프로젝트명')
        h = height or _mm(236)
        return (
            f'<section data-screen-label="표지" style="position:relative;min-height:{h};'
            f'display:flex;flex-direction:column;break-after:page;padding-top:{_mm(26 - MARGIN_MM)};'
            f'box-sizing:border-box;color:{INK}"><div>'
            f'<div style="font-size:{_pt(8)};font-weight:700;letter-spacing:0.30em;'
            f'text-transform:uppercase;color:{GOLD_INK}">{esc(self.eyebrow)}</div>'
            f'<h1 style="margin:{_mm(6)} 0 0;font-size:{_pt(30)};font-weight:700;'
            f'letter-spacing:-0.02em;line-height:1.24;color:{INK}">{esc(self.title)}</h1>'
            f'<p style="margin:{_mm(7)} 0 0;max-width:{_mm(128)};font-size:{_pt(10.5)};'
            f'line-height:1.72;color:{SUB}">{esc(self.subtitle)}</p></div>'
            f'<div style="margin-top:{_mm(20)};height:{_pt(1.2)};background:{INK}"></div>'
            f'<div style="display:grid;grid-template-columns:1fr {_mm(78)};gap:{_mm(14)};'
            f'margin-top:{_mm(9)}"><div>'
            f'<div style="font-size:{_pt(7)};font-weight:700;letter-spacing:0.22em;color:{MUTED}">TO</div>'
            f'<div style="margin-top:{_mm(3.5)};font-size:{_pt(17)};font-weight:700;'
            f'letter-spacing:-0.01em;color:{INK}">{esc(self.client)}</div>'
            f'<div style="margin-top:{_mm(2.5)};font-size:{_pt(9.5)};color:{SUB}">{to_line} 귀하</div>'
            f'<div style="margin-top:{_mm(6)};padding-top:{_mm(3.5)};border-top:{_pt(0.5)} solid {RULE};'
            f'font-size:{_pt(8.5)};line-height:1.6;color:{MUTED}">{proj}</div></div>'
            f'<div><div style="font-size:{_pt(7)};font-weight:700;letter-spacing:0.22em;'
            f'color:{MUTED}">DOCUMENT</div>{self._meta_html()}</div></div>'
            f'<div style="margin-top:auto;padding-top:{_mm(5)};border-top:{_pt(0.5)} solid {RULE};'
            f'font-size:{_pt(8)};line-height:1.75;color:{MUTED}">'
            f'<span style="font-weight:700;color:{INK}">{COMPANY} · {CEO}</span><br>'
            f'{ADDR}<br>{CONTACT}</div></section>')

    def _disclaimer(self):
        # v8 표 6 「문서 끝」: 부록 다음에 번호 없는 「면책」 장. 장 번호 칸에는 긴 줄표.
        # 한 줄 결론(footer_note)은 이 장 끝에 ◆ 밴드로 한 번(v8 6.3).
        band = self._band(self.footer_label or '핵심', self.footer_note) if self.footer_note else ''
        ch = _Chapter(CHAPTER_DASH, '면책', not self._chapters, self.chapter_page)
        return (self._chapter_html(ch)
                + f'<p style="font-size:{_pt(10)};line-height:1.62;color:{BODY};margin:0 0 {_mm(3)}">'
                f'{esc(self.disclaimer_text)}</p>{band}</section>')

    def _assemble(self):
        parts = []
        for x in self._body:
            parts.append(self._chapter_html(x) if isinstance(x, _Chapter) else x)
        body = ''.join(parts)
        if not self._first_section:
            body += '</section>'
        toc = self._toc() if self._toc_on() else ''
        return toc + body

    def html(self):
        return (
            '<!DOCTYPE html>\n<html lang="ko">\n<head>\n'
            '<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            '<meta name="mq-spec" content="SP-MQ-2026-001 rev.02 (v8)">\n'
            f'<title>{esc(self.docno)} {esc(self.docname)}</title>\n'
            '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
            '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:'
            'wght@400;500;600;700&family=JetBrains+Mono:wght@500;600'
            '&display=swap" rel="stylesheet">\n'
            '<script src="./doc-page.js"></script>\n'
            f'<style>body{{font-family:{SANS};color:{BODY};margin:0;word-break:keep-all}}'
            f'h1,h2,h3,h4{{font-family:{SANS}}}'
            # 🔴 본문은 <doc-page> 의 «슬롯» 에 들어갑니다. 슬롯 콘텐츠는 평면 트리에서 글꼴을
            #    물려받아 doc-page.js 의 Arial 을 받습니다(영문 · 숫자만 Arial, 2026-09-22 실측).
            #    :where() 는 특정도가 0 이라 인라인 mono 지정은 그대로 이깁니다.
            f'doc-page :where(*){{font-family:{SANS}}}</style>\n'
            '</head>\n<body>\n'
            f'<doc-page size="a4" margin="{MARGIN_MM}mm" lang="ko" data-spec="v8">\n'
            + self._header() + '\n' + self._footer() + '\n'
            + self._cover() + '\n' + self._assemble() + '\n' + self._disclaimer() + '\n'
            '</doc-page>\n</body>\n</html>\n')

    # ── 검사와 저장 ───────────────────────────────────────────────────────
    def verify(self):
        h = self.html()
        # 긴 줄표 예외(오너 결정 2026-09-24)는 «장 번호 칸» 한 글자뿐입니다. 그 칸만 지우고 전부 봅니다.
        slot_re = re.compile(r'<span ' + re.escape(SLOT) + r'[^>]*>' + CHAPTER_DASH + '</span>')
        scan = slot_re.sub('', h)
        text = re.sub(r'<[^>]*>', ' ', scan)
        fails = []
        if '&' + 'mdash;' in h or '&' + 'ndash;' in h or '&#' + '8212;' in h or '&#' + '8211;' in h:
            fails.append('HTML 대시 엔티티')
        for i, ch in enumerate(text):
            if ord(ch) in _DASHES:
                fails.append(f'{_DASHES[ord(ch)]}: ...{text[max(0, i-25):i+25].strip()}...')
        # 장 번호 칸의 줄표는 «번호 없는 장 수 + 면책» 만큼만(목차가 있으면 두 배). 다른 칸에 표시를 붙여
        # 예외를 넓히지 못하게 개수로 묶습니다.
        allowed = (sum(1 for c in self._chapters if c.no == CHAPTER_DASH) + 1) * (2 if self._toc_on() else 1)
        got = len(slot_re.findall(h))
        if got > allowed:
            fails.append(f'장 번호 칸의 긴 줄표가 {got}곳입니다(허용 {allowed}곳: 번호 없는 장 · 면책)')

        for ti, tbl in enumerate(re.findall(r'<table.*?</table>', h, re.S), 1):
            rows = re.findall(r'<tr.*?</tr>', tbl, re.S)
            if not rows:
                fails.append(f'표 {ti}: 행이 없습니다')
                continue
            counts = set()
            for r in rows:
                n = 0
                for c in re.findall(r'<t[dh][^>]*>', r):
                    m = re.search(r'colspan="(\d+)"', c)
                    n += int(m.group(1)) if m else 1
                counts.add(n)
            if len(counts) > 1:
                fails.append(f'표 {ti}: 행마다 열 수가 다릅니다 {sorted(counts)}')
            if '<thead' in tbl:
                head = re.sub(r'<[^>]*>', '', rows[0]).strip()
                if len(rows) > 1 and not head:
                    fails.append(f'표 {ti}: 머리글이 통째로 비었습니다')

        # ── 종이 위 대비 (2026-09-10) ─ «글자로 쓰인 색» 만 봅니다. 면 · 선은 대상이 아닙니다.
        for m in re.finditer(r'(?<![-\w])color:(#[0-9A-Fa-f]{6})', h):
            if re.search(r'opacity:0\.\d', h[m.start():m.start() + 140]):
                continue
            hexv = m.group(1).upper()
            worst = min(_contrast(hexv, '#FFFFFF'), _contrast(hexv, LABEL_BG))
            if worst < 4.5:
                where = re.sub(r'\s+', ' ', re.sub(r'<[^>]*>', ' ', h[m.end():m.end() + 60])).strip()
                fails.append(f'종이 대비 {worst:.2f} < 4.5: {hexv} ...{where[:40]}...')
                break

        # ── 글꼴 폴백 (2026-09-10) ─ 값 안의 작은따옴표까지 제외하면 빈 그물이 됩니다.
        fams = set(re.findall(r'font-family:([^;"]+)', h))
        if not fams:
            fails.append('글꼴 지정을 하나도 못 찾았습니다. 검사가 헛돌고 있습니다')
        for fam in fams:
            if 'monospace' in fam:
                if 'Consolas' not in fam:
                    fails.append(f'mono 폴백 없음: {fam.strip()} (Consolas 를 사이에 두십시오)')
            elif 'sans-serif' in fam and 'Malgun Gothic' not in fam:
                fails.append(f'한글 폴백 없음: {fam.strip()} '
                             "('Malgun Gothic' 을 사이에 두지 않으면 굴림으로 떨어집니다)")

        # ── v8 표 번호 (v8 표 3) ─ 1부터 빠짐없이
        nums = [int(x) for x in re.findall(r'>표 (\d+)</span></caption>', h)]
        if nums != list(range(1, len(nums) + 1)):
            fails.append(f'표 번호가 1부터 이어지지 않습니다: {nums[:12]}')

        if fails:
            raise VerifyError(f'{self.docno}: 검사 실패 {len(fails)}건\n  '
                              + '\n  '.join(fails))
        return True

    def report(self):
        h = self.html()
        tables = re.findall(r'<table.*?</table>', h, re.S)
        left = len(re.findall(r'〔[^〕]*〕', h))
        lines = [f'{self.docno}  {self.docname} rev.{self.rev}',
                 f'  장 {self._secno}개 · 표 {len(tables)}개 · 빈 칸 {left}곳']
        for ti, tbl in enumerate(tables, 1):
            rows = re.findall(r'<tr.*?</tr>', tbl, re.S)
            head = re.sub(r'\s+', ' ', re.sub(r'<[^>]*>', ' ', rows[0])).strip()[:52]
            lines.append(f'  표{ti:>2}  {len(rows)}행  머리글: {head}')
        return '\n'.join(lines)

    def save(self, path, standalone=True):
        """검사를 통과하면 씁니다.

        standalone=True 면 doc-page.js 와 assets/ 를 출력 폴더에 함께 둡니다(폴더째 넘겨도 열리게).
        """
        self.verify()
        outdir = os.path.dirname(os.path.abspath(path))
        os.makedirs(outdir, exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(self.html())
        if standalone:
            src_js = os.path.join(HERE, 'source', 'doc-page.js')
            if os.path.exists(src_js):
                shutil.copy2(src_js, os.path.join(outdir, 'doc-page.js'))
            dst_assets = os.path.join(outdir, 'assets')
            os.makedirs(dst_assets, exist_ok=True)
            for name in os.listdir(os.path.join(HERE, 'assets')):
                dst = os.path.join(dst_assets, name)
                if not os.path.exists(dst):
                    shutil.copy2(os.path.join(HERE, 'assets', name), dst)
        return path

    @staticmethod
    def to_docx(html_path):
        """HTML 을 DOCX 로. templates/tohtml2docx.js 를 부릅니다."""
        script = os.path.join(HERE, 'tohtml2docx.js')
        out = os.path.splitext(html_path)[0] + '.docx'
        r = subprocess.run(['node', script, os.path.abspath(html_path)],
                           capture_output=True, text=True, encoding='utf-8')
        if r.returncode != 0:
            print('DOCX 변환 실패:', (r.stderr or r.stdout or '').strip()[:400],
                  file=sys.stderr)
            return None
        return out

    # ── PDF (v8) ─────────────────────────────────────────────────────────
    def print_html(self, font_dir='fonts'):
        """인쇄용 HTML. doc-page 없이 @page 여백(22 · 22 · 35 mm)으로 흘리고, 머리말 · 꼬리말 · 쪽번호 ·
        워터마크는 to_pdf 가 PDF 위에 그립니다(v8: 표지에는 아무것도 그리지 않음).

        🔴 글꼴: 설치된 가변 Noto Sans KR 을 크롬이 그대로 쓰면 PDF 에 Type3 로 심깁니다.
           QMS 문서세트와 같은 고정 굵기 판(400 · 500 · 700)을 @font-face 로 겁니다(Q-Design docs/23 7절).
        """
        body = self._cover(height=_mm(297 - MARGIN_MM - BOTTOM_MM - 1)) + self._assemble() + self._disclaimer()
        psans = "'MQ Noto Sans KR','Malgun Gothic',sans-serif"
        pmono = "Consolas,'MQ Noto Sans KR',monospace"
        body = body.replace(SANS, psans).replace(MONO, pmono)
        faces = ''.join(
            f"@font-face{{font-family:'MQ Noto Sans KR';font-weight:{w};"
            f"src:url('{font_dir}/{f}') format('truetype')}}"
            for w, f in ((400, 'NotoSansKR-400.ttf'), (500, 'NotoSansKR-500.ttf'),
                         (600, 'NotoSansKR-700.ttf'), (700, 'NotoSansKR-700.ttf')))
        return (
            '<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
            f'<title>{esc(self.docno)} {esc(self.docname)}</title>\n<style>{faces}'
            f'@page{{size:A4;margin:{MARGIN_MM}mm {MARGIN_MM}mm {BOTTOM_MM}mm}}'
            f'html{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'
            f'body{{margin:0;font-family:{psans};color:{BODY};word-break:keep-all}}</style>\n'
            '</head>\n<body>\n' + body + '\n</body>\n</html>\n')

    def to_pdf(self, pdf_path):
        """v8 PDF. 헤드리스 크롬으로 찍고, QMS 문서세트와 같은 도장(머리말 · 꼬리말 · 「n / 전체」 ·
        워터마크)을 둘째 쪽부터 찍습니다. 도장과 고정 굵기 글꼴은 QMS 문서세트의 v8 도구를 씁니다
        (ops/컨설팅산출물_QMS문서세트/_build/v8_profile.py · v8_fonts.py). 두 곳이 같은 모양이어야 하므로
        베끼지 않고 불러 씁니다."""
        self.verify()
        root = os.path.abspath(os.path.join(HERE, '..'))
        qms_build = os.path.join(root, 'ops', '컨설팅산출물_QMS문서세트', '_build')
        tpl = os.path.join(root, 'ops', '_template')
        sys.path.insert(0, qms_build)
        sys.path.insert(0, tpl)
        import v8_fonts            # noqa: E402
        import v8_profile          # noqa: E402  (도장)
        from render import find_chrome   # noqa: E402
        v8_fonts.ensure()
        with tempfile.TemporaryDirectory(prefix='mqv8_') as tmp:
            fdir = os.path.join(tmp, 'fonts')
            os.makedirs(fdir)
            for w in (400, 500, 700):
                shutil.copy2(v8_fonts.path(w), os.path.join(fdir, 'NotoSansKR-%d.ttf' % w))
            hpath = os.path.join(tmp, 'doc.html')
            with open(hpath, 'w', encoding='utf-8', newline='\n') as f:
                f.write(self.print_html())
            ppath = os.path.join(tmp, 'doc.pdf')
            cmd = [find_chrome(), '--headless=new', '--disable-gpu', '--no-sandbox',
                   '--no-pdf-header-footer', '--run-all-compositor-stages-before-draw',
                   '--virtual-time-budget=10000',
                   '--print-to-pdf=' + ppath, 'file:///' + hpath.replace('\\', '/')]
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
            import pymupdf
            if not os.path.exists(ppath):
                raise VerifyError('PDF 가 만들어지지 않았습니다: ' + (r.stderr or '')[-400:])
            d = pymupdf.open(ppath)
            empty = [i + 1 for i, pg in enumerate(d) if len(pg.get_text().strip()) < 5]
            d.close()
            if empty:
                raise VerifyError(f'빈 쪽이 있습니다: {empty} 쪽')
            meta = {'runhead': f'{self.product} · {self.docname}', 'docno': self.docno,
                    'rev': f'rev.{self.rev}', 'company': COMPANY}
            total, _thin = v8_profile.stamp(ppath, meta, os.path.join(tpl, 'assets'))
            d = pymupdf.open(ppath)
            type3 = sorted({f[3] for pg in d for f in pg.get_fonts() if f[2] == 'Type3'})
            # 🔴 크롬은 쪽 폭을 넘는 요소가 하나라도 있으면 쪽 «전체» 를 말없이 줄여 찍습니다(2026-09-24 실측:
            #    표 열 너비에 셀 여백이 더해져 넘쳤고, 30 pt 제목이 25.5 pt 로 나왔다). 크기가 v8 크기 집합
            #    (표지 전용 7 · 9.5 · 10.5 · 17 pt 포함) 밖이면 멈춥니다.
            odd = sorted({round(sp['size'], 2) for pg in d for b in pg.get_text('dict')['blocks']
                          for ln in b.get('lines', []) for sp in ln['spans']
                          if not any(abs(sp['size'] - v) < 0.06 for v in V8_SIZES)})
            d.close()
            if odd:
                raise VerifyError(f'v8 에 없는 글자 크기 {odd} pt (쪽이 줄여 찍혔는지 보십시오)')
            if type3:
                raise VerifyError(f'PDF 에 Type3 글꼴이 심겼습니다: {type3}')
            os.makedirs(os.path.dirname(os.path.abspath(pdf_path)), exist_ok=True)
            shutil.copy2(ppath, pdf_path)
        return pdf_path, total
