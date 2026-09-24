# -*- coding: utf-8 -*-
"""MedQraft 대외 문서 빌더 (회사 기본 양식 · HTML).

`source/*.dc.html` 의 서식을 실물에서 역추출해 코드로 옮긴 것입니다.
새 문서는 이 모듈로 만들고, HTML 을 원본으로 둡니다. DOCX 는 파생물입니다.

    import sys; sys.path.insert(0, 'D:/Claude/MedQraft/templates')
    from mqhtml import Doc

    d = Doc(doctype='QUO', proj='ONP', seq='001', rev='00',
            docname='견적서', eyebrow='Quotation', title='견적서',
            subtitle='...', client='(재)춘천바이오산업진흥원',
            footer_label='핵심 조건', footer_note='...')
    d.meta([('문서번호', d.docno, True), ('작성일', d.date_doc, False)])
    d.h('견적 개요')
    d.p('...')
    d.save('out/문서.html')            # 저장 직전에 스스로 검사합니다
    d.to_docx('out/문서.html')         # node 로 DOCX 까지

검사는 저장을 «막습니다».
  · 짝대기(em/en dash, HTML 엔티티) 0곳
  · 표마다 머리글이 비어 있지 않을 것
  · 행마다 열 수가 같을 것

서식을 바꾸면 이미 발행한 문서와 달라집니다. 바꾸기 전에 발행 이력을 확인하십시오.
"""
import datetime
import html as _html
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

# ── 팔레트 (HANDOFF.md 의 LIGHT 토큰) ─────────────────────────────────────
#
# 🔴 2026-09-10 종이 대비 보정.
#    이 팔레트의 뿌리는 IR 덱이고 그것은 **다크 화면용**입니다. 다크 배경에서 고른 색이
#    종이(흰색·아이보리 표)에 그대로 쓰이고 있었습니다. 실측하니 이랬습니다:
#
#      MUTED  #8A97A8  흰 종이 2.97 · 아이보리 2.74     ← 캡션·메타·표 셀 17곳
#      GOLD   #D6B56D  흰 종이 1.96 · 아이보리 1.81     ← eyebrow·문서번호 등 글자 5곳
#      INDIGO #5B6CFF  흰 종이 4.17                     ← STEP 라벨
#
#    나간 PDF 5종에서 MUTED 는 문서당 56~118회, GOLD 는 36~80회 쓰였습니다.
#    10~12px 금색 대문자 라벨이 1.96:1 이면 사실상 읽히지 않습니다.
#
# 🔑 **금색은 둘로 나눕니다.** 선·면·워터마크 같은 «장식» 은 대비 규칙 밖이라 브랜드
#    금색을 그대로 쓰고, 종이 위 «글자» 에만 어두운 금색을 씁니다.
#    (같은 문제를 Q-Atelier 도 겪었고 같은 방식으로 풀었습니다: 다크 #b8935a /
#     라이트 #8a6838. 여기 GOLD_INK 가 그 값과 거의 같은 자리에 오는 것은 우연이 아닙니다.)
#
#    색상·채도는 그대로 두고 명도만 옮겼습니다. AA(4.5)를 통과하는 가장 작은 변경입니다.
INK = '#0E1116'          # 제목·강조·표 헤더·굵은 규칙선 (흰 종이 18.91)
BODY = '#354154'         # 본문 텍스트 (10.32)
MUTED = '#647286'        # 뮤트·메타·빈 칸 (4.51 · was #8A97A8 · 2.97)
RULE = '#E2E6EC'         # 헤어라인 (면이라 대비 대상 아님)
RULE_STRONG = '#C2CAD6'  # 강한 헤어라인·직인란 점선
LABEL_BG = '#F3F6FA'     # 표 라벨 셀 배경
GOLD = '#D6B56D'         # 브랜드 금색. **장식 전용**: 선·면·표지 워터마크
GOLD_INK = '#8C6C27'     # 종이 위 «글자» 용 금색 (4.52). eyebrow·문서번호·섹션 라벨
INDIGO = '#4A5DFF'       # 프로세스 STEP 라벨 (4.50 · was #5B6CFF · 4.17)

# 상태 4색도 종이용으로 내렸습니다. 지금은 쓰이는 곳이 없지만, 쓰이는 순간
# 같은 미달이 되므로 미리 맞춰 둡니다(선언만 있고 안 읽히는 값도 언젠가 읽힙니다).
MAJOR, MINOR, OBSERV, COMPLIANT = '#D92A1F', '#906B11', '#4A5DFF', '#248054'

# 옛 mqdoc 이름. 문서를 옮길 때 표 정의를 그대로 쓸 수 있게 둡니다.
HEAD = ALT = LABEL_BG

# 🔴 2026-09-10 폴백 명시.
#    종전에는 `'Noto Sans KR',sans-serif` 였습니다. Noto Sans KR 은 웹폰트로 잘 실리지만
#    **그 글꼴에 없는 글리프**(일부 기호)는 `sans-serif` 로 떨어지고, Windows 에서 그것이
#    **굴림체(GulimChe)** 가 됩니다. 실측: 나간 PDF 5종 중 둘에 GulimChe 가 섞여 있었습니다.
#    굴림은 옛 비트맵 느낌이라 이 문서 톤과 맞지 않습니다.
# 🔑 «무엇으로 떨어질지»를 우리가 정합니다. 맑은 고딕을 사이에 둡니다.
SANS = "'Noto Sans KR','Malgun Gothic',sans-serif"
MONO = "'JetBrains Mono',Consolas,monospace"

# 본문 폭. A4(210mm) 에서 좌우 여백 18mm 씩 뺀 174mm = 658px @96dpi.
BODY_PX = 658

COMPANY = '주식회사 메드크래프트'
CEO = '대표 김병휘'
ADDR = '경기도 성남시 수정구 금토로 80번길 56 · 사업자등록번호 720-12-02968'
CONTACT = '010-8050-8510 · bhkim@medqraft.co.kr'

DISCLAIMER = (
    '본 서비스는 의료기기 R&D·인허가·QMS 운영을 지원하는 도구입니다. '
    '최종 인허가 판단과 제출 책임은 제조·수입업자에게 있습니다. '
    '본 문서는 수신자에 한하여 제공되는 기밀 문서로, 주식회사 메드크래프트의 '
    '사전 서면 동의 없이 제3자에게 공개·복제·배포할 수 없습니다.'
)

_DASHES = {0x2014: 'em dash', 0x2013: 'en dash', 0x2015: 'horizontal bar'}


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


class Doc:
    def __init__(self, doctype, proj, seq='001', rev='00', *, docname,
                 eyebrow, title, subtitle, client, footer_label, footer_note,
                 date=None, to_line='', project_name='', title_size=46,
                 meta_extra=None, product='Q-Atelier', disclaimer=None):
        # 러닝 헤더에 찍히는 «제품 이름». 2026-09-22 까지 'Q-Atelier' 가 코드에
        # 박혀 있어서, 9001 판(Q-Works)이나 제조기록(Q-Forge) 건을 뽑아도 머리글만
        # Q-Atelier 로 나갔습니다. 기본값을 그대로 두었으므로 이미 발행한 문서는
        # 한 글자도 달라지지 않습니다.
        self.product = product
        # 마지막 쪽 면책. 기본은 의료기기 인허가 문구(DISCLAIMER)입니다. 9001
        # 전산화처럼 인허가가 걸리지 않는 건에서는 그 문구가 겉돌기 때문에
        # 건별로 갈아 끼울 수 있게 열어 둡니다. 기본값을 그대로 두었으므로
        # 이미 발행한 문서는 달라지지 않습니다.
        self.disclaimer_text = disclaimer or DISCLAIMER
        self.doctype = doctype
        self.proj = proj.upper()
        self.seq = str(seq).zfill(3)
        self.rev = str(rev).zfill(2)
        self.docname = docname
        self.date = date or datetime.date.today()
        self.docno = f'{doctype}-{self.proj}-{self.date:%Y}-{self.seq}'
        self.date_doc = f'{self.date:%Y. %m. %d}'
        self.client = client
        self.to_line = to_line
        self.project_name = project_name
        self.footer_label = footer_label
        self.footer_note = footer_note
        self.eyebrow = eyebrow
        self.title = title
        self.subtitle = subtitle
        self.title_size = title_size
        self._meta = meta_extra or []
        self._body = []
        self._secno = 0
        self._first_section = True

    # ── 표지 메타 표 ──────────────────────────────────────────────────────
    def meta(self, rows):
        """표지 오른쪽 문서정보. [(라벨, 값, mono여부), ...]"""
        self._meta = rows

    def _meta_html(self):
        rows = self._meta or [
            ('문서번호', self.docno, True),
            ('개정', f'rev.{self.rev}', True),
            ('작성일', self.date_doc, False),
            ('상태', '발행 · Issued', False),
            ('발신', COMPANY, False),
        ]
        out = []
        for label, value, mono in rows:
            vs = (f'font-family:{MONO};font-size:11.5px;' if mono else '')
            out.append(
                f'<tr><td style="padding:7px 0;color:{MUTED};width:84px;'
                f'border-bottom:1px solid {RULE}">{esc(label)}</td>'
                f'<td style="padding:7px 0;border-bottom:1px solid {RULE};{vs}">'
                f'{value}</td></tr>')
        return ('<table style="width:100%;border-collapse:collapse;font-size:12px">'
                '<tbody>' + ''.join(out) + '</tbody></table>')

    # ── 본문 블록 ─────────────────────────────────────────────────────────
    def h(self, text, num=None):
        """섹션 제목. 번호는 01, 02 … 로 자동 부여됩니다."""
        if not self._first_section:
            self._body.append('</section>')
        self._secno += 1
        no = num if num is not None else f'{self._secno:02d}'
        margin = '8px 0 18px' if self._first_section else '36px 0 18px'
        self._first_section = False
        self._body.append(
            f'<section data-screen-label="{no} {esc(text)}">'
            f'<div style="display:flex;align-items:baseline;gap:14px;'
            f'border-bottom:1px solid {INK};padding-bottom:8px;margin:{margin}">'
            f'<span style="font-family:{MONO};font-size:12px;color:{GOLD_INK};'
            f'font-weight:600">{no}</span>'
            f'<h2 style="font-size:19px;font-weight:700;margin:0;'
            f'letter-spacing:-0.005em">{esc(text)}</h2></div>')

    def h3(self, text):
        self._body.append(
            f'<h3 style="font-size:14px;font-weight:600;color:{INK};'
            f'margin:22px 0 10px">{esc(text)}</h3>')

    def p(self, text, raw=False, lead=False):
        """본문 문단. raw=True 면 태그를 그대로, lead=True 면 위를 띄웁니다."""
        body = text if raw else esc(text)
        margin = '18px 0 16px' if lead else '0 0 16px'
        self._body.append(
            f'<p style="font-size:13.5px;line-height:1.75;color:{BODY};'
            f'margin:{margin}">{body}</p>')

    def note(self, text, raw=False):
        """※ 로 시작하는 작은 주석."""
        body = text if raw else esc(text)
        self._body.append(
            f'<p style="font-size:11.5px;line-height:1.7;color:{MUTED};'
            f'margin:10px 0 16px">{body}</p>')

    def callout(self, text, label='핵심'):
        """◆ 콜아웃. 섹션 끝에 한 줄 결론으로 하나만 씁니다."""
        self._body.append(
            f'<div style="border-top:1px solid {INK};border-bottom:1px solid {RULE};'
            f'padding:12px 0;margin:18px 0;display:flex;gap:12px;'
            f'align-items:baseline">'
            f'<span style="color:{GOLD_INK};font-weight:700;font-size:11px;'
            f'white-space:nowrap">◆ {esc(label)}</span>'
            f'<span style="font-size:12.5px;line-height:1.7;color:{BODY}">'
            f'{esc(text)}</span></div>')

    def table(self, rows, widths=None, aligns=None, header=True, foot=None,
              sizes=None):
        """데이터 표.

        rows   : [[셀, ...], ...]. 셀은 str(HTML 허용) 또는 dict
                 dict 키 - t(글) · a(정렬) · b(굵게) · c(색) · mono · fill · span
        widths : 열 폭 CSS 문자열 목록. 예 ['32px', None, '96px']
        aligns : 열별 정렬. ['left','right', ...]
        foot   : 합계 행. [(라벨, 값, 강조여부), ...]
        """
        ncol = max(len(r) for r in rows)
        # 폭을 정수(twips)로 주면 본문 폭에 맞춰 px 로 바꿉니다. 옛 문서를 옮길 때
        # 표 정의를 그대로 쓰기 위한 호환 경로입니다.
        # 🔴 px 여야 합니다. 동봉 변환기가 「px 폭 → twips ×15」로만 읽으므로
        #    % 로 주면 열 폭이 통째로 무시돼 글자가 세로로 늘어집니다.
        if widths and any(isinstance(w, (int, float)) for w in widths):
            tot = sum(w for w in widths if isinstance(w, (int, float))) or 1
            widths = [f'{round(w / tot * BODY_PX)}px' if isinstance(w, (int, float))
                      else w for w in widths]
        out = ['<table style="width:100%;border-collapse:collapse;font-size:12px">']

        def cell(spec, ci, tag, is_head):
            if not isinstance(spec, dict):
                spec = {'t': spec}
            # 셀 안의 줄바꿈은 HTML 에서 공백이 되므로 <br> 로 바꾸고,
            # '~' 로 시작하는 줄은 «곁들이는 설명»으로 보아 흐리게 씁니다.
            raw_t = str(spec.get('t', ''))
            lines = raw_t.split('\n')
            parts = []
            for ln in lines:
                if ln.startswith('~'):
                    body_ln = (f'<span style="color:{MUTED};font-size:11px">'
                               f'{ln[1:]}</span>')
                else:
                    body_ln = ln
                # 여러 줄이면 <br> 이 아니라 블록으로 감쌉니다. 변환기가 <br> 을
                # 삼켜 DOCX 에서 줄이 붙어 버리기 때문입니다(HTML 인쇄는 무관).
                parts.append(f'<div style="margin:0 0 3px">{body_ln}</div>'
                             if len(lines) > 1 else body_ln)
            t = ''.join(parts)
            a = spec.get('a') or (aligns[ci] if aligns and ci < len(aligns) else 'left')
            st = [f'text-align:{a}']
            if widths and ci < len(widths) and widths[ci]:
                st.append(f'width:{widths[ci]}')
            if is_head:
                st += ['padding:8px 10px', 'font-size:11px', 'font-weight:600',
                       f'color:{INK}']
            else:
                st += ['padding:11px 10px', 'vertical-align:top']
                if spec.get('b'):
                    st += ['font-weight:600', f'color:{INK}']
                if spec.get('c'):
                    st.append(f'color:{spec["c"]}')
                if spec.get('mono'):
                    st.append(f'font-family:{MONO}')
                if spec.get('fill'):
                    st.append(f'background:{spec["fill"]}')
            span = f' colspan="{spec["span"]}"' if spec.get('span') else ''
            return f'<{tag}{span} style="{";".join(st)}">{t}</{tag}>'

        start = 0
        if header:
            out.append(f'<thead><tr style="border-bottom:1px solid {INK}">')
            out += [cell(rows[0][ci] if ci < len(rows[0]) else '', ci, 'th', True)
                    for ci in range(ncol)]
            out.append('</tr></thead>')
            start = 1

        out.append('<tbody>')
        for row in rows[start:]:
            out.append(f'<tr style="border-bottom:1px solid {RULE}">')
            ci = 0
            for spec in row:
                out.append(cell(spec, ci, 'td', False))
                ci += (spec.get('span', 1) if isinstance(spec, dict) else 1)
            out.append('</tr>')
        out.append('</tbody>')

        if foot:
            out.append('<tfoot>')
            for i, (label, value, strong) in enumerate(foot):
                last = i == len(foot) - 1
                bd = (f'border-bottom:2px solid {GOLD}' if last
                      else f'border-bottom:1px solid {INK if strong else RULE}')
                pad = '12px 10px' if last else '9px 10px'
                lst = (f'padding:{pad};text-align:right;'
                       + (f'font-weight:700;color:{INK};font-size:13px'
                          if last else f'color:{BODY}')
                       + (';' + bd if not last else ''))
                vst = (f'padding:{pad};text-align:right;font-family:{MONO};'
                       + (f'font-weight:600;font-size:14px;color:{INK};'
                          if last else f'color:{INK};')
                       + bd)
                out.append(f'<tr><td colspan="{ncol - 1}" style="{lst}">{esc(label)}'
                           f'</td><td style="{vst}">{value}</td></tr>')
            out.append('</tfoot>')

        out.append('</table>')
        self._body.append(''.join(out))

    def labeled(self, rows, label_w='140px'):
        """라벨-값 표. 라벨 칸에 옅은 배경이 깔립니다."""
        out = ['<table style="width:100%;border-collapse:collapse;font-size:12.5px">'
               '<tbody>']
        for label, value in rows:
            out.append(
                f'<tr style="border-bottom:1px solid {RULE}">'
                f'<td style="padding:9px 12px;background:{LABEL_BG};'
                f'width:{label_w};color:{INK};font-weight:600;vertical-align:top">'
                f'{esc(label)}</td>'
                f'<td style="padding:9px 12px;color:{BODY};line-height:1.7;'
                f'vertical-align:top">{str(value).replace(chr(10), "<br>")}'
                f'</td></tr>')
        out.append('</tbody></table>')
        self._body.append(''.join(out))

    def cards(self, items, cols=3, accent=None):
        """카드 그리드. items 는 [(제목, 본문), ...]"""
        ac = accent or GOLD
        cells = []
        for title, body in items:
            cells.append(
                f'<div style="border:1px solid {RULE};border-top:2px solid {ac};'
                f'padding:14px 16px">'
                f'<div style="font-size:13px;font-weight:700;color:{INK};'
                f'margin-bottom:8px">{esc(title)}</div>'
                f'<div style="font-size:12px;line-height:1.7;color:{BODY}">'
                f'{esc(body)}</div></div>')
        self._body.append(
            f'<div style="display:grid;grid-template-columns:repeat({cols},1fr);'
            f'gap:12px;margin:6px 0 16px">' + ''.join(cells) + '</div>')

    def steps(self, items):
        """STEP 플로우. items 는 [(제목, 본문), ...]

        🔴 flex 가 아니라 «표» 로 만듭니다. display:flex 로 두면 DOCX 변환에서
           가로 배치가 풀려 계단처럼 세로로 늘어지고 화살표만 따로 떨어집니다
           (동봉 양식의 원본 STEP 이 실제로 그렇게 나옵니다). 표는 양쪽에서
           같은 모양으로 섭니다.
        """
        n = len(items)
        arrow_w = 22
        cell_w = (BODY_PX - arrow_w * (n - 1)) // n
        cells, widths = [], []
        for i, (title, body) in enumerate(items, 1):
            if i > 1:
                # 이 화살표는 표에서 «흐름»을 나타내는 기호입니다. 장식이 아니라
                # 뜻을 전달하므로 종이용 금색을 씁니다(브랜드 금색은 1.96:1).
                cells.append({'t': '→', 'a': 'center', 'c': GOLD_INK})
                widths.append(f'{arrow_w}px')
            cells.append({'t':
                f'<div style="font-family:{MONO};font-size:10px;color:{INDIGO};'
                f'font-weight:600;letter-spacing:0.08em">STEP {i}</div>'
                f'<div style="font-size:12.5px;font-weight:700;color:{INK};'
                f'margin:5px 0 5px">{esc(title)}</div>'
                f'<div style="font-size:11px;line-height:1.6;color:{BODY}">'
                f'{esc(body)}</div>', 'a': 'left'})
            widths.append(f'{cell_w}px')
        self.table([cells], widths=widths, header=False)

    def gantt(self, bars, weeks=28, label_w='178px', head='구간 (계약 후 주차)'):
        """주차 간트. bars 는 (라벨, 시작주, 끝주, kind) 목록.

        kind 는 'own'(당사 수행, 골드) 또는 'client'(발주기관 소관, 헤어라인 회색).
        주차는 1부터 세고 양쪽 끝을 포함합니다.
        """
        th = (f'text-align:left;padding:6px 4px;font-size:10px;font-weight:600;'
              f'color:{INK}')
        # 주차 숫자는 5칸마다만 적습니다. 28칸에 두 자리 수를 모두 넣으면 열이 좁아
        # 「1」과 「0」이 세로로 쪼개져 읽히지 않습니다.
        def wk(w):
            return str(w) if (w == 1 or w % 5 == 0 or w == weeks) else ''
        head_cells = (f'<th style="{th};width:{label_w}">{esc(head)}</th>'
                      + ''.join(f'<th style="{th};text-align:center;font-family:{MONO};'
                                f'font-size:8.5px;padding:6px 0">{wk(w)}</th>'
                                for w in range(1, weeks + 1)))
        rows = []
        for label, s, e, kind in bars:
            fill = GOLD if kind == 'own' else RULE_STRONG
            cells = [f'<td style="padding:7px 4px;font-size:10.5px;color:{BODY};'
                     f'vertical-align:middle">{esc(label)}</td>']
            for w in range(1, weeks + 1):
                bg = f'background:{fill};' if s <= w <= e else ''
                cells.append(f'<td style="padding:7px 0;{bg}"></td>')
            rows.append(f'<tr style="border-bottom:1px solid {RULE}">'
                        + ''.join(cells) + '</tr>')
        self._body.append(
            '<table style="width:100%;border-collapse:collapse;table-layout:fixed">'
            f'<thead><tr style="border-bottom:1px solid {INK}">{head_cells}</tr>'
            '</thead><tbody>' + ''.join(rows) + '</tbody></table>')

    def raw(self, html_str):
        self._body.append(html_str)

    # ── 옛 mqdoc 문서를 옮길 때 쓰는 별칭 ─────────────────────────────────
    def hilite(self, text):
        """옛 이름. 앞의 「◆ 라벨」 을 떼고 콜아웃으로 넘깁니다."""
        m = re.match(r'\s*◆\s*(\S+)\s+(.*)', text, re.S)
        if m:
            self.callout(re.sub(r'\s+', ' ', m.group(2)).strip(), m.group(1))
        else:
            self.callout(text)

    def muted(self, text, size=None):
        self.note(text)

    def disclaimer(self, text):
        """옛 이름. 표준 면책은 문서 끝에 자동으로 붙으므로, 여기 오는 글은
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
        """개정 이력. 기본은 rev.NN 초안 발행 한 줄 + 다음 개정 빈 줄."""
        rows = rows or [(f'rev.{self.rev}', self.date_doc, '초안 발행',
                         '김병휘', '김병휘')]
        self.h('개정 이력')
        body = []
        for r in rows:
            body.append(
                f'<tr style="border-bottom:1px solid {RULE}">'
                f'<td style="padding:8px 10px;font-family:{MONO}">{esc(r[0])}</td>'
                f'<td style="padding:8px 10px">{esc(r[1])}</td>'
                f'<td style="padding:8px 10px;color:{BODY}">{esc(r[2])}</td>'
                f'<td style="padding:8px 10px">{esc(r[3])}</td>'
                f'<td style="padding:8px 10px">{esc(r[4])}</td></tr>')
        nxt = f'rev.{int(self.rev) + 1:02d}'
        body.append(
            f'<tr style="border-bottom:1px solid {RULE}">'
            f'<td style="padding:8px 10px;font-family:{MONO};color:{MUTED}">{nxt}</td>'
            f'<td style="padding:8px 10px;color:{MUTED}">{blank()}</td>'
            f'<td style="padding:8px 10px;color:{MUTED}">{blank("변경 사유 · 변경 항목")}</td>'
            f'<td style="padding:8px 10px;color:{MUTED}">{blank()}</td>'
            f'<td style="padding:8px 10px;color:{MUTED}">{blank()}</td></tr>')
        head = ''.join(
            f'<th style="text-align:left;padding:7px 10px;font-size:11px;'
            f'font-weight:600{w}">{h}</th>'
            for h, w in [('Rev.', ';width:70px'), ('일자', ';width:110px'),
                         ('변경 내용', ''), ('작성자', ';width:90px'),
                         ('승인자', ';width:90px')])
        self._body.append(
            '<table style="width:100%;border-collapse:collapse;font-size:12px">'
            f'<thead><tr style="border-bottom:1px solid {INK}">{head}</tr></thead>'
            '<tbody>' + ''.join(body) + '</tbody></table>')

    # ── 조립 ──────────────────────────────────────────────────────────────
    def _header(self):
        return (
            f'<div slot="header" style="display:flex;justify-content:space-between;'
            f'align-items:flex-end;padding-bottom:10px;border-bottom:1px solid {RULE};'
            f'font-family:{SANS}">'
            f'<div style="display:flex;align-items:center;gap:14px">'
            f'<img src="assets/logo-horizontal-black.png" alt="MedQraft" '
            f'style="height:15px;display:block">'
            f'<span style="font-size:11px;color:{MUTED};letter-spacing:0.02em;'
            f'white-space:nowrap">{esc(self.product)} · {esc(self.docname)}'
            f'</span></div>'
            f'<div style="display:flex;align-items:center;gap:18px;flex-shrink:0">'
            f'<span style="font-size:10px;letter-spacing:0.3em;color:{MUTED};'
            f'white-space:nowrap">CONFIDENTIAL</span>'
            f'<span style="font-family:{MONO};font-size:11px;color:{INK};'
            f'white-space:nowrap">{self.docno}</span></div></div>')

    def _footer(self):
        return (
            f'<div slot="footer" style="position:relative;display:flex;'
            f'justify-content:space-between;align-items:center;gap:24px;'
            f'padding-top:10px;border-top:1px solid {RULE};font-size:11px;'
            f'color:{BODY};font-family:{SANS}">'
            f'<div style="display:flex;gap:10px;align-items:baseline">'
            f'<span style="color:{GOLD_INK};font-weight:700;font-size:10px;'
            f'white-space:nowrap">◆ {esc(self.footer_label)}</span>'
            f'<span>{esc(self.footer_note)}</span></div>'
            f'<span style="color:{MUTED};white-space:nowrap">{COMPANY} · '
            f'rev.{self.rev}</span>'
            f'<div style="position:absolute;right:-6px;bottom:32px;font-size:300px;'
            f'font-weight:800;line-height:1;color:{GOLD};opacity:0.05;'
            f'pointer-events:none;font-family:{SANS}">Q</div></div>')

    def _cover(self):
        to_line = self.to_line or blank('부서 · 담당자 성명')
        proj = esc(self.project_name) if self.project_name else blank('프로젝트명')
        # 네 모서리 골드 코너 브래킷 (양식 갱신 2026-09-07)
        corner = ''.join(
            f'<div style="position:absolute;{v}:0;{h}:0;width:22px;height:22px;'
            f'border-{v}:1px solid {GOLD};border-{h}:1px solid {GOLD}"></div>'
            for v in ('top', 'bottom') for h in ('left', 'right'))
        return (
            f'<section data-screen-label="표지" style="position:relative;'
            f'min-height:196mm;'
            f'display:flex;flex-direction:column;justify-content:space-between;'
            f'break-after:page;padding:44px 32px 32px">{corner}<div>'
            f'<div style="display:flex;align-items:center;gap:12px;'
            f'font-size:11px;font-weight:700;letter-spacing:0.18em;'
            f'text-transform:uppercase;color:{GOLD_INK}">'
            f'<span style="display:inline-block;width:28px;height:2px;'
            f'background:{GOLD}"></span>{esc(self.eyebrow)}</div>'
            f'<h1 style="font-size:{self.title_size}px;font-weight:700;'
            f'letter-spacing:-0.015em;line-height:1.15;margin:14px 0 0;'
            f'color:{INK}">{esc(self.title)}</h1>'
            f'<p style="font-size:16px;color:{BODY};margin:18px 0 0;'
            f'line-height:1.6;max-width:520px">{esc(self.subtitle)}</p></div>'
            f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;'
            f'align-items:end"><div>'
            f'<div style="font-size:11px;font-weight:700;letter-spacing:0.18em;'
            f'color:{MUTED};text-transform:uppercase">To</div>'
            f'<div style="font-size:24px;font-weight:600;color:{INK};'
            f'margin-top:8px;border-bottom:1px solid {INK};padding-bottom:10px">'
            f'{esc(self.client)}</div>'
            f'<div style="font-size:12.5px;color:{MUTED};margin-top:10px;'
            f'line-height:1.7">{to_line} 귀하<br>{proj}</div></div>'
            f'{self._meta_html()}</div>'
            f'<div style="display:flex;justify-content:space-between;'
            f'align-items:flex-end;border-top:1px solid {INK};padding-top:16px">'
            f'<div style="font-size:11.5px;color:{BODY};line-height:1.7">'
            f'<strong style="color:{INK};font-weight:600">{COMPANY}</strong> · '
            f'{CEO}<br>{ADDR}<br>{CONTACT}</div>'
            f'<div style="font-size:10px;letter-spacing:0.3em;color:{MUTED}">'
            f'CONFIDENTIAL</div></div></section>')

    def _disclaimer(self):
        return (
            f'<section data-screen-label="면책" style="margin-top:40px;'
            f'padding-top:14px;border-top:1px solid {RULE};font-size:11px;'
            f'line-height:1.7;color:{MUTED};break-inside:avoid">'
            f'<div style="font-size:10px;font-weight:700;letter-spacing:0.18em;'
            f'color:{GOLD_INK};text-transform:uppercase;margin-bottom:6px">'
            f'Disclaimer</div>{esc(self.disclaimer_text)}</section>')

    def html(self):
        body = ''.join(self._body)
        if not self._first_section:
            body += '</section>'
        return (
            '<!DOCTYPE html>\n<html lang="ko">\n<head>\n'
            '<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f'<title>{esc(self.docno)} {esc(self.docname)}</title>\n'
            '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
            '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:'
            'wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600'
            '&display=swap" rel="stylesheet">\n'
            '<script src="./doc-page.js"></script>\n'
            f'<style>body{{font-family:{SANS};color:{BODY};margin:0}}'
            f'h1,h2,h3{{font-family:{SANS}}}'
            # 🔴 본문은 <doc-page> 의 «슬롯» 에 들어갑니다. 슬롯 콘텐츠는 평면
            #    트리(그림자 쪽)에서 글꼴을 물려받으므로 body 의 지정이 닿지 않고,
            #    doc-page.js 190행의 Arial 을 받습니다. 한글은 브라우저 폴백으로
            #    멀쩡해 보여서 «영문과 숫자만» 조용히 Arial 로 찍혔습니다.
            #    견적서라면 금액이 그랬습니다 (2026-09-22 MADDE 건에서 실측).
            #    물려받기 대신 «직접 맞혀» 이깁니다. :where() 는 특정도가 0 이라
            #    인라인 mono 지정(문서번호·주차)은 그대로 이깁니다.
            f'doc-page :where(*){{font-family:{SANS}}}</style>\n'
            '</head>\n<body>\n'
            '<doc-page size="a4" margin="18mm" lang="ko">\n'
            + self._header() + '\n' + self._footer() + '\n'
            + self._cover() + '\n' + body + '\n' + self._disclaimer() + '\n'
            '</doc-page>\n</body>\n</html>\n')

    # ── 검사와 저장 ───────────────────────────────────────────────────────
    def verify(self):
        h = self.html()
        text = re.sub(r'<[^>]*>', ' ', h)
        fails = []
        if '&' + 'mdash;' in h or '&' + 'ndash;' in h:
            fails.append('HTML 대시 엔티티')
        for i, ch in enumerate(text):
            if ord(ch) in _DASHES:
                fails.append(f'{_DASHES[ord(ch)]}: ...{text[max(0, i-25):i+25].strip()}...')

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

        # ── 종이 위 대비 (2026-09-10 신설) ───────────────────────────────
        # 이 팔레트의 뿌리는 다크 화면(IR 덱)입니다. 다크용으로 고른 색을 종이에
        # 그대로 쓰면 미달합니다. 실제로 나간 문서에서 캡션이 2.97, 금색 라벨이
        # 1.96 이었습니다(문서당 각각 56~118회·36~80회 사용).
        # 🔑 «글자로 쓰인 색» 만 봅니다. 면·선은 대비 대상이 아닙니다.
        for m in re.finditer(r'color:(#[0-9A-Fa-f]{6})', h):
            # opacity 가 걸린 장식(표지 워터마크)은 제외합니다.
            if re.search(r'opacity:0\.\d', h[m.start():m.start() + 140]):
                continue
            hexv = m.group(1).upper()
            worst = min(_contrast(hexv, '#FFFFFF'), _contrast(hexv, LABEL_BG))
            if worst < 4.5:
                where = re.sub(r'\s+', ' ', re.sub(r'<[^>]*>', ' ', h[m.end():m.end() + 60])).strip()
                fails.append(f'종이 대비 {worst:.2f} < 4.5: {hexv} ...{where[:40]}...')
                break  # 같은 색이 수십 번 나오므로 한 번만 알립니다

        # ── 글꼴 폴백 (2026-09-10 신설) ──────────────────────────────────
        # 'Noto Sans KR', sans-serif 처럼 두면 그 글꼴에 없는 글리프가 sans-serif 로
        # 떨어지고 Windows 에서 그것이 **굴림체**가 됩니다. 나간 문서 5종 중 둘에
        # 섞여 있었습니다. 「무엇으로 떨어질지」를 우리가 정해 둡니다.
        # ⚠️ 값 안에 작은따옴표가 들어갑니다('Noto Sans KR'). 그것까지 제외하면
        #    첫 따옴표에서 끊겨 **아무것도 못 잡는 빈 그물**이 됩니다(실제로 그랬습니다).
        #    경계는 세미콜론과 «속성을 감싼 큰따옴표» 입니다.
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

        if fails:
            raise VerifyError(f'{self.docno}: 검사 실패 {len(fails)}건\n  '
                              + '\n  '.join(fails))
        return True

    def report(self):
        h = self.html()
        tables = re.findall(r'<table.*?</table>', h, re.S)
        left = len(re.findall(r'〔[^〕]*〕', h))
        lines = [f'{self.docno}  {self.docname} rev.{self.rev}',
                 f'  섹션 {self._secno}개 · 표 {len(tables)}개 · 빈 칸 {left}곳']
        for ti, tbl in enumerate(tables, 1):
            rows = re.findall(r'<tr.*?</tr>', tbl, re.S)
            head = re.sub(r'\s+', ' ', re.sub(r'<[^>]*>', ' ', rows[0])).strip()[:52]
            lines.append(f'  표{ti:>2}  {len(rows)}행  머리글: {head}')
        return '\n'.join(lines)

    def save(self, path, standalone=True):
        """검사를 통과하면 씁니다.

        standalone=True 면 doc-page.js 와 assets/ 를 출력 폴더에 함께 둡니다.
        브라우저로 열어 인쇄할 때 종이·여백·로고가 제대로 나오게 하려는 것이며,
        폴더째 남에게 넘겨도 그대로 열립니다.
        """
        self.verify()
        outdir = os.path.dirname(os.path.abspath(path))
        os.makedirs(outdir, exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(self.html())
        if standalone:
            import shutil
            src_js = os.path.join(HERE, 'source', 'doc-page.js')
            if os.path.exists(src_js):
                shutil.copy2(src_js, os.path.join(outdir, 'doc-page.js'))
            dst_assets = os.path.join(outdir, 'assets')
            if not os.path.isdir(dst_assets):
                shutil.copytree(os.path.join(HERE, 'assets'), dst_assets)
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
