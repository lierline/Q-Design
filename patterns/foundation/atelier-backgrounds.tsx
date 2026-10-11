// =============================================================================
// EntranceRibbon: 로그인 입장 연출의 비단 리본 (한 번 · 1.7초 · 모양이 출렁이며 흐른다)
// =============================================================================
// 2026-09-30 오너 결정. 곧은 사인 곡선 두 줄은 «인위적이라 못 쓸 수준» 이었다. 오너가 코덱스에게
// 물결 그림을 청해 세 시안(비단 리본 · 물 위 빛 · 액체 금속 주름)을 받고, 두 방식(그림 + 빛 흐름 ·
// 도형이 출렁)을 움직여 비교한 뒤 «비단 리본 · 도형이 출렁» 을 골랐다.
//
// 도형은 코덱스가 시안 그림을 따라 그린 닫힌 곡면 여섯 장(몸통 · 왼쪽 어깨 · 왼쪽 면 · 가로 주름 ·
// 아래 주름 · 오른쪽 꼬리)이다. 굵기가 곳곳에서 달라 붓 Q 의 획과 결이 같다.
// 움직임은 SMIL <animate attributeName="d"> 다. CSS 의 d: path() 는 사파리(아이패드)가 못 돌린다.
// SMIL 은 이 svg 가 문서에 들어온 순간부터 재므로, 입장 연출이 열릴 때 새로 그려야 처음부터 돈다.
// 🔴 CSS 의 animation: none 으로는 SMIL 이 멈추지 않는다. 움직임 줄이기 설정에서는 통째로 숨긴다
//    (app/(auth)/login/page.tsx 의 .qa-entrance-ribbon).
//
// 색 · 세기는 감싼 요소의 CSS 변수로 받는다(한 벌로 어두운 · 밝은 화면을 함께 쓴다):
//   --qa-rb-face · --qa-rb-fold (색) · --qa-rb-body · --qa-rb-fold-a · --qa-rb-bloom (세기)

import { QDRuntime } from '@/lib/design/q-design-runtime';

const RIBBON_SILK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 1200" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="qa-rb-face" gradientUnits="userSpaceOnUse" x1="0.0" y1="0.0" x2="2400.0" y2="0.0"><stop offset="0" style="stop-color:var(--qa-rb-face);stop-opacity:0"/><stop offset="0.14" style="stop-color:var(--qa-rb-face);stop-opacity:0.38"/><stop offset="0.28" style="stop-color:var(--qa-rb-face);stop-opacity:0.7"/><stop offset="0.43" style="stop-color:var(--qa-rb-face);stop-opacity:0.17"/><stop offset="0.5" style="stop-color:var(--qa-rb-face);stop-opacity:0.035"/><stop offset="0.62" style="stop-color:var(--qa-rb-face);stop-opacity:0.23"/><stop offset="0.78" style="stop-color:var(--qa-rb-face);stop-opacity:0.83"/><stop offset="0.89" style="stop-color:var(--qa-rb-face);stop-opacity:0.3"/><stop offset="1" style="stop-color:var(--qa-rb-face);stop-opacity:0"/></linearGradient>
<radialGradient id="qa-rb-shoulder" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(450.0 493.3333333333333) scale(570.0 140.0)">
<stop offset="0" style="stop-color:var(--qa-rb-fold);stop-opacity:1"/>
<stop offset=".36" style="stop-color:var(--qa-rb-fold);stop-opacity:.65"/>
<stop offset=".72" style="stop-color:var(--qa-rb-fold);stop-opacity:.19"/>
<stop offset="1" style="stop-color:var(--qa-rb-fold);stop-opacity:0"/>
</radialGradient>
<radialGradient id="qa-rb-left" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(255.0 613.3333333333334) scale(547.5 122.66666666666667)">
<stop offset="0" style="stop-color:var(--qa-rb-face);stop-opacity:1"/>
<stop offset=".36" style="stop-color:var(--qa-rb-face);stop-opacity:.65"/>
<stop offset=".72" style="stop-color:var(--qa-rb-face);stop-opacity:.19"/>
<stop offset="1" style="stop-color:var(--qa-rb-face);stop-opacity:0"/>
</radialGradient>
<radialGradient id="qa-rb-cross" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(765.0 642.6666666666666) scale(555.0 160.0)">
<stop offset="0" style="stop-color:var(--qa-rb-fold);stop-opacity:1"/>
<stop offset=".36" style="stop-color:var(--qa-rb-fold);stop-opacity:.65"/>
<stop offset=".72" style="stop-color:var(--qa-rb-fold);stop-opacity:.19"/>
<stop offset="1" style="stop-color:var(--qa-rb-fold);stop-opacity:0"/>
</radialGradient>
<radialGradient id="qa-rb-low" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(1287.0 822.6666666666666) scale(570.0 126.66666666666667)">
<stop offset="0" style="stop-color:var(--qa-rb-fold);stop-opacity:1"/>
<stop offset=".36" style="stop-color:var(--qa-rb-fold);stop-opacity:.65"/>
<stop offset=".72" style="stop-color:var(--qa-rb-fold);stop-opacity:.19"/>
<stop offset="1" style="stop-color:var(--qa-rb-fold);stop-opacity:0"/>
</radialGradient>
<radialGradient id="qa-rb-tail" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(1860.0 609.3333333333334) scale(465.0 186.66666666666666)">
<stop offset="0" style="stop-color:var(--qa-rb-face);stop-opacity:1"/>
<stop offset=".36" style="stop-color:var(--qa-rb-face);stop-opacity:.65"/>
<stop offset=".72" style="stop-color:var(--qa-rb-face);stop-opacity:.19"/>
<stop offset="1" style="stop-color:var(--qa-rb-face);stop-opacity:0"/>
</radialGradient>
<filter id="qa-rb-soft" filterUnits="userSpaceOnUse" x="-48" y="320" width="2496" height="700" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="10"/></filter>
<path id="qa-rb-body-shape" d="M 0.0 490.0 C 119.3 494.8 173.3 442.7 271.4 456.7 C 445.3 446.1 537.6 565.2 625.7 643.6 C 743.5 711.7 889.8 732.0 1035.0 788.2 C 1248.9 802.7 1464.2 742.7 1606.6 668.0 C 1759.4 557.3 1869.5 505.3 2004.1 508.0 C 2210.3 516.0 2266.2 413.3 2400.0 384.0 C 2286.1 408.0 2233.7 490.7 2100.6 509.3 C 1880.1 517.3 1731.7 610.7 1582.9 708.0 C 1380.5 861.4 1200.2 889.4 1035.0 814.8 C 920.1 796.9 828.5 785.8 724.2 806.5 C 545.4 843.0 441.5 795.8 350.1 739.5 C 227.6 668.1 174.5 698.8 85.8 675.2 C 47.6 667.0 17.9 659.8 0.0 655.3 Z">
<animate attributeName="d" begin="0s" dur="${QDRuntime.ribbon.durationSeconds}s" repeatCount="1" fill="freeze" calcMode="spline" keyTimes="0;0.34;0.72;1" keySplines="0.32 0.12 0.67 0.86;0.32 0.12 0.67 0.86;0.22 0.3 0.45 1" values="M 0.0 490.0 C 119.3 494.8 173.3 442.7 271.4 456.7 C 445.3 446.1 537.6 565.2 625.7 643.6 C 743.5 711.7 889.8 732.0 1035.0 788.2 C 1248.9 802.7 1464.2 742.7 1606.6 668.0 C 1759.4 557.3 1869.5 505.3 2004.1 508.0 C 2210.3 516.0 2266.2 413.3 2400.0 384.0 C 2286.1 408.0 2233.7 490.7 2100.6 509.3 C 1880.1 517.3 1731.7 610.7 1582.9 708.0 C 1380.5 861.4 1200.2 889.4 1035.0 814.8 C 920.1 796.9 828.5 785.8 724.2 806.5 C 545.4 843.0 441.5 795.8 350.1 739.5 C 227.6 668.1 174.5 698.8 85.8 675.2 C 47.6 667.0 17.9 659.8 0.0 655.3 Z;M 0.0 472.5 C 129.7 465.8 188.3 409.6 294.4 421.1 C 480.6 426.2 578.2 559.7 670.5 650.1 C 792.6 724.7 942.2 738.9 1088.6 790.0 C 1300.6 805.1 1510.5 743.7 1647.9 668.3 C 1794.1 557.4 1898.9 505.4 2026.5 508.0 C 2221.2 516.0 2273.9 413.3 2400.0 384.0 C 2292.7 408.0 2243.3 490.7 2117.7 509.3 C 1909.0 517.4 1767.7 610.8 1625.1 708.4 C 1429.3 863.0 1252.7 891.7 1088.6 816.7 C 972.9 802.1 879.9 796.2 772.8 819.3 C 586.4 838.7 476.5 775.2 379.0 708.0 C 247.1 632.6 189.6 665.6 93.4 649.3 C 51.8 644.8 19.4 640.6 0.0 637.8 Z;M 0.0 472.0 C 141.4 464.0 205.1 406.7 320.1 414.7 C 520.0 409.6 623.6 538.0 720.6 626.7 C 847.5 706.5 1000.8 733.1 1148.4 789.4 C 1358.4 808.3 1562.3 750.3 1694.0 673.4 C 1832.9 560.2 1931.8 506.9 2051.5 508.7 C 2233.5 516.1 2282.6 413.4 2400.0 384.0 C 2300.1 408.1 2254.1 490.8 2136.9 509.7 C 1941.2 518.9 1807.9 614.0 1672.3 713.9 C 1483.8 869.2 1311.3 893.6 1148.4 816.1 C 1032.0 798.2 937.2 785.4 827.0 799.7 C 632.2 816.7 515.7 758.9 411.2 697.4 C 268.9 628.0 206.5 662.7 101.8 648.0 C 56.5 644.0 21.2 640.0 0.0 637.3 Z;M 0.0 472.0 C 150.0 464.0 217.5 406.7 339.0 414.7 C 549.0 409.3 657.0 537.3 757.5 625.3 C 888.0 704.0 1044.0 730.7 1192.5 788.0 C 1401.0 802.7 1600.5 742.7 1728.0 668.0 C 1861.5 557.3 1956.0 505.3 2070.0 508.0 C 2242.5 516.0 2289.0 413.3 2400.0 384.0 C 2305.5 408.0 2262.0 490.7 2151.0 509.3 C 1965.0 517.3 1837.5 610.7 1707.0 708.0 C 1524.0 861.3 1354.5 889.3 1192.5 814.7 C 1075.5 796.0 979.5 782.7 867.0 797.3 C 666.0 816.0 544.5 758.7 435.0 697.3 C 285.0 628.0 219.0 662.7 108.0 648.0 C 60.0 644.0 22.5 640.0 0.0 637.3 Z"/>
</path>
<path id="qa-rb-shoulder-shape" d="M 0.0 491.3 C 127.7 494.3 172.1 447.9 271.4 456.7 C 445.3 446.1 537.6 565.2 625.7 643.6 C 509.2 610.8 416.3 525.6 294.6 497.2 C 175.7 466.9 93.0 504.0 0.0 510.0 Z">
<animate attributeName="d" begin="0s" dur="${QDRuntime.ribbon.durationSeconds}s" repeatCount="1" fill="freeze" calcMode="spline" keyTimes="0;0.34;0.72;1" keySplines="0.32 0.12 0.67 0.86;0.32 0.12 0.67 0.86;0.22 0.3 0.45 1" values="M 0.0 491.3 C 127.7 494.3 172.1 447.9 271.4 456.7 C 445.3 446.1 537.6 565.2 625.7 643.6 C 509.2 610.8 416.3 525.6 294.6 497.2 C 175.7 466.9 93.0 504.0 0.0 510.0 Z;M 0.0 473.8 C 138.8 464.6 187.0 414.9 294.4 421.1 C 480.6 426.2 578.2 559.7 670.5 650.1 C 548.2 600.8 449.7 501.6 319.4 462.2 C 190.9 433.7 101.1 477.4 0.0 492.5 Z;M 0.0 473.3 C 151.3 462.7 203.7 412.0 320.1 414.7 C 520.0 409.6 623.6 538.0 720.6 626.7 C 591.9 580.5 487.0 486.9 347.1 454.7 C 207.9 430.7 110.3 476.0 0.0 492.0 Z;M 0.0 473.3 C 160.5 462.7 216.0 412.0 339.0 414.7 C 549.0 409.3 657.0 537.3 757.5 625.3 C 624.0 580.0 514.5 486.7 367.5 454.7 C 220.5 430.7 117.0 476.0 0.0 492.0 Z"/>
</path>
<path id="qa-rb-left-face-shape" d="M 0.0 504.7 C 173.3 466.7 293.4 489.2 411.2 556.6 C 535.0 618.8 558.5 664.2 625.7 671.6 C 551.9 723.6 507.9 777.6 451.6 772.3 C 304.4 732.0 288.5 678.4 143.2 679.9 C 75.1 670.0 28.6 663.6 0.0 655.3 Z">
<animate attributeName="d" begin="0s" dur="${QDRuntime.ribbon.durationSeconds}s" repeatCount="1" fill="freeze" calcMode="spline" keyTimes="0;0.34;0.72;1" keySplines="0.32 0.12 0.67 0.86;0.32 0.12 0.67 0.86;0.22 0.3 0.45 1" values="M 0.0 504.7 C 173.3 466.7 293.4 489.2 411.2 556.6 C 535.0 618.8 558.5 664.2 625.7 671.6 C 551.9 723.6 507.9 777.6 451.6 772.3 C 304.4 732.0 288.5 678.4 143.2 679.9 C 75.1 670.0 28.6 663.6 0.0 655.3 Z;M 0.0 487.1 C 188.3 433.6 318.1 454.2 444.3 531.9 C 575.5 612.9 600.1 661.9 670.5 678.1 C 593.3 720.3 546.9 767.4 487.3 753.2 C 330.0 697.4 312.8 643.3 155.7 648.9 C 81.7 645.1 31.1 643.3 0.0 637.8 Z;M 0.0 486.7 C 205.1 430.7 345.7 446.7 481.3 517.5 C 620.7 591.3 646.7 639.5 720.6 654.7 C 639.5 698.1 590.4 747.2 527.1 736.3 C 358.5 689.4 340.0 636.0 169.7 646.7 C 89.1 644.0 33.9 642.7 0.0 637.3 Z;M 0.0 486.7 C 217.5 430.7 366.0 446.7 508.5 517.3 C 654.0 590.7 681.0 638.7 757.5 653.3 C 673.5 697.3 622.5 746.7 556.5 736.0 C 379.5 689.3 360.0 636.0 180.0 646.7 C 94.5 644.0 36.0 642.7 0.0 637.3 Z"/>
</path>
<path id="qa-rb-crossfold-shape" d="M 327.8 541.2 C 454.2 573.4 538.9 626.4 625.7 643.6 C 785.0 697.2 908.5 745.0 1035.0 788.2 C 1247.3 805.4 1462.5 742.7 1606.6 668.0 C 1449.3 753.3 1256.8 829.4 1035.0 816.2 C 886.9 782.8 761.4 719.9 625.7 663.6 C 507.9 637.6 431.4 571.2 327.8 541.2 Z">
<animate attributeName="d" begin="0s" dur="${QDRuntime.ribbon.durationSeconds}s" repeatCount="1" fill="freeze" calcMode="spline" keyTimes="0;0.34;0.72;1" keySplines="0.32 0.12 0.67 0.86;0.32 0.12 0.67 0.86;0.22 0.3 0.45 1" values="M 327.8 541.2 C 454.2 573.4 538.9 626.4 625.7 643.6 C 785.0 697.2 908.5 745.0 1035.0 788.2 C 1247.3 805.4 1462.5 742.7 1606.6 668.0 C 1449.3 753.3 1256.8 829.4 1035.0 816.2 C 886.9 782.8 761.4 719.9 625.7 663.6 C 507.9 637.6 431.4 571.2 327.8 541.2 Z;M 355.1 508.0 C 490.0 554.7 579.6 621.1 670.5 650.1 C 835.3 709.4 961.2 750.9 1088.6 790.0 C 1299.1 807.7 1508.9 743.7 1647.9 668.3 C 1496.1 754.4 1308.4 831.7 1088.6 818.0 C 939.3 789.8 811.1 732.7 670.5 670.1 C 546.9 627.4 465.8 549.2 355.1 508.0 Z;M 385.6 498.7 C 530.0 537.6 625.0 599.4 720.6 626.7 C 891.6 694.7 1020.1 746.3 1148.4 789.4 C 1356.9 810.9 1560.8 750.3 1694.0 673.4 C 1548.4 761.1 1366.0 835.2 1148.4 817.4 C 997.9 783.8 866.6 715.9 720.6 646.7 C 590.4 607.2 504.2 533.6 385.6 498.7 Z;M 408.0 498.7 C 559.5 537.3 658.5 598.7 757.5 625.3 C 933.0 692.0 1063.5 744.0 1192.5 788.0 C 1399.5 805.3 1599.0 742.7 1728.0 668.0 C 1587.0 753.3 1408.5 829.3 1192.5 816.0 C 1041.0 781.3 907.5 713.3 757.5 645.3 C 622.5 606.7 532.5 533.3 408.0 498.7 Z"/>
</path>
<path id="qa-rb-lower-fold-shape" d="M 144.4 681.3 C 275.0 680.8 331.5 743.9 451.6 789.6 C 568.9 836.4 657.8 808.4 818.6 790.2 C 943.4 780.6 1086.3 872.1 1234.7 842.7 C 1429.5 821.3 1537.5 737.3 1606.6 668.0 C 1532.4 753.3 1408.2 852.0 1239.4 849.4 C 1071.1 885.5 946.3 796.6 818.6 796.9 C 645.7 828.2 555.9 831.2 449.1 801.8 C 327.8 755.9 278.7 694.2 144.4 681.3 Z">
<animate attributeName="d" begin="0s" dur="${QDRuntime.ribbon.durationSeconds}s" repeatCount="1" fill="freeze" calcMode="spline" keyTimes="0;0.34;0.72;1" keySplines="0.32 0.12 0.67 0.86;0.32 0.12 0.67 0.86;0.22 0.3 0.45 1" values="M 144.4 681.3 C 275.0 680.8 331.5 743.9 451.6 789.6 C 568.9 836.4 657.8 808.4 818.6 790.2 C 943.4 780.6 1086.3 872.1 1234.7 842.7 C 1429.5 821.3 1537.5 737.3 1606.6 668.0 C 1532.4 753.3 1408.2 852.0 1239.4 849.4 C 1071.1 885.5 946.3 796.6 818.6 796.9 C 645.7 828.2 555.9 831.2 449.1 801.8 C 327.8 755.9 278.7 694.2 144.4 681.3 Z;M 157.0 650.3 C 298.3 645.3 359.1 710.9 487.3 770.6 C 611.1 835.6 703.9 817.9 869.8 801.0 C 996.4 784.7 1139.7 873.9 1286.7 845.1 C 1476.9 822.6 1581.3 737.9 1647.9 668.3 C 1576.5 754.0 1456.2 853.4 1291.3 851.7 C 1124.6 887.2 999.4 800.6 869.8 807.7 C 691.4 836.7 597.4 828.5 484.6 782.4 C 355.1 722.7 302.3 658.8 157.0 650.3 Z;M 171.1 648.0 C 324.3 638.7 389.8 701.4 527.1 753.6 C 658.3 812.9 755.5 795.0 926.9 789.4 C 1055.8 781.9 1199.5 873.8 1344.7 847.9 C 1529.9 829.2 1630.4 744.0 1694.0 673.4 C 1625.7 760.1 1509.9 859.9 1349.3 854.7 C 1184.4 886.9 1058.8 797.9 926.9 796.1 C 742.4 813.6 643.8 806.2 524.3 765.6 C 385.6 713.4 328.6 652.0 171.1 648.0 Z;M 181.5 648.0 C 343.5 638.7 412.5 701.3 556.5 753.3 C 693.0 812.0 793.5 793.3 969.0 786.7 C 1099.5 780.0 1243.5 872.0 1387.5 842.7 C 1569.0 821.3 1666.5 737.3 1728.0 668.0 C 1662.0 753.3 1549.5 852.0 1392.0 849.3 C 1228.5 885.3 1102.5 796.0 969.0 793.3 C 780.0 812.0 678.0 805.3 553.5 765.3 C 408.0 713.3 348.0 652.0 181.5 648.0 Z"/>
</path>
<path id="qa-rb-tail-shape" d="M 1035.0 788.2 C 1230.0 796.1 1457.5 744.0 1606.6 668.0 C 1768.1 554.7 1878.3 501.3 2004.1 508.0 C 2174.2 513.3 2249.9 430.7 2400.0 384.0 C 2251.8 434.7 2257.2 504.0 2039.7 514.7 C 1843.2 536.0 1743.8 604.0 1586.3 708.0 C 1378.8 861.4 1204.9 878.7 1035.0 814.8 Z">
<animate attributeName="d" begin="0s" dur="${QDRuntime.ribbon.durationSeconds}s" repeatCount="1" fill="freeze" calcMode="spline" keyTimes="0;0.34;0.72;1" keySplines="0.32 0.12 0.67 0.86;0.32 0.12 0.67 0.86;0.22 0.3 0.45 1" values="M 1035.0 788.2 C 1230.0 796.1 1457.5 744.0 1606.6 668.0 C 1768.1 554.7 1878.3 501.3 2004.1 508.0 C 2174.2 513.3 2249.9 430.7 2400.0 384.0 C 2251.8 434.7 2257.2 504.0 2039.7 514.7 C 1843.2 536.0 1743.8 604.0 1586.3 708.0 C 1378.8 861.4 1204.9 878.7 1035.0 814.8 Z;M 1088.6 790.0 C 1282.0 798.4 1504.1 745.1 1647.9 668.3 C 1802.4 554.7 1907.3 501.4 2026.5 508.0 C 2187.2 513.3 2258.6 430.7 2400.0 384.0 C 2260.3 434.7 2265.4 504.0 2060.2 514.7 C 1873.9 536.0 1779.3 604.1 1628.4 708.4 C 1427.7 863.0 1257.3 881.1 1088.6 816.7 Z;M 1148.4 789.4 C 1340.2 801.1 1556.2 751.7 1694.0 673.4 C 1840.8 557.4 1939.7 502.9 2051.5 508.7 C 2201.8 513.5 2268.3 430.8 2400.0 384.0 C 2269.9 434.8 2274.7 504.1 2083.1 515.2 C 1908.2 537.9 1818.8 607.1 1675.4 713.8 C 1482.3 869.2 1315.9 883.1 1148.4 816.1 Z;M 1192.5 788.0 C 1383.0 796.0 1594.5 744.0 1728.0 668.0 C 1869.0 554.7 1963.5 501.3 2070.0 508.0 C 2212.5 513.3 2275.5 430.7 2400.0 384.0 C 2277.0 434.7 2281.5 504.0 2100.0 514.7 C 1933.5 536.0 1848.0 604.0 1710.0 708.0 C 1522.5 861.3 1359.0 878.7 1192.5 814.7 Z"/>
</path>
</defs>
<g style="opacity:var(--qa-rb-bloom)" filter="url(#qa-rb-soft)">
<use href="#qa-rb-body-shape" fill="url(#qa-rb-face)"/>
<use href="#qa-rb-shoulder-shape" fill="url(#qa-rb-shoulder)"/>
<use href="#qa-rb-crossfold-shape" fill="url(#qa-rb-cross)"/>
<use href="#qa-rb-lower-fold-shape" fill="url(#qa-rb-low)"/>
</g>
<use href="#qa-rb-body-shape" fill="url(#qa-rb-face)" style="opacity:var(--qa-rb-body)"/>
<use href="#qa-rb-shoulder-shape" fill="url(#qa-rb-shoulder)" style="opacity:var(--qa-rb-fold-a)"/>
<use href="#qa-rb-left-face-shape" fill="url(#qa-rb-left)" style="opacity:var(--qa-rb-body)"/>
<use href="#qa-rb-crossfold-shape" fill="url(#qa-rb-cross)" style="opacity:var(--qa-rb-fold-a)"/>
<use href="#qa-rb-lower-fold-shape" fill="url(#qa-rb-low)" style="opacity:var(--qa-rb-fold-a)"/>
<use href="#qa-rb-tail-shape" fill="url(#qa-rb-tail)" style="opacity:var(--qa-rb-body)"/>
</svg>`;

export function EntranceRibbon({ className }: { className?: string }) {
  return <div className={className} aria-hidden dangerouslySetInnerHTML={{ __html: RIBBON_SILK_SVG }} />;
}

// =============================================================================
// RibbonBackground: Q-Atelier 시그니처 champagne ribbon 무드 (공용)
// =============================================================================
// 로그인 화면 + 인앱 레이아웃 모두에서 사용.
//
// 동작:
//   · 2겹의 champagne SVG ribbon 이 viewport 전체에 천천히 흐름 (32s / 38s)
//   · viewBox 2400×1200 + path 좌표 화면 밖까지 → ultra-wide 모니터 대응
//   · prefers-reduced-motion 존중: 모션 끔
//   · pointerEvents: none → 클릭 방해 안 함
//   · zIndex: 0 + position: fixed → 모든 컨텐츠 뒤에서 부드럽게 깔림
//
// 사용 예:
//   <RibbonBackground intensity="full" />     // 로그인 (강조)
//   <RibbonBackground intensity="ambient" />  // 인앱 (배경 무드, 더 옅음)

import { T } from '@/lib/design/tokens';

interface Props {
  /** full = 로그인용 (opacity 0.14/0.08), ambient = 인앱용 (0.07/0.04) */
  intensity?: 'full' | 'ambient';
  /** vignette 어둠 처리: 로그인엔 true, 인앱엔 사이드바·카드가 있어 false 권장 */
  vignette?: boolean;
}

export function RibbonBackground({ intensity = 'full', vignette = false }: Props) {

  return (
    <>

      <div aria-hidden className="qa-ribbon-scene" data-intensity={intensity}>
        {/* Layer 1: large ribbon curve */}
        <svg
          className="qa-ribbon-layer-1"
          width="100%"
          height="100%"
          viewBox="0 0 2400 1200"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="qa-ribbon-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={T.champagne} stopOpacity="0" />
              <stop offset="40%" stopColor={T.champagne} stopOpacity="1" />
              <stop offset="100%" stopColor={T.champagne} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M -200 720 Q 500 280 1100 600 T 2600 460"
            stroke="url(#qa-ribbon-grad-1)"
            strokeWidth="200"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Layer 2: secondary thin ribbon, counter-direction */}
        <svg
          className="qa-ribbon-layer-2"
          width="100%"
          height="100%"
          viewBox="0 0 2400 1200"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="qa-ribbon-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={T.champagne} stopOpacity="0" />
              <stop offset="50%" stopColor={T.champagne} stopOpacity="1" />
              <stop offset="100%" stopColor={T.champagne} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 2700 240 Q 1800 840 800 480 T -300 840"
            stroke="url(#qa-ribbon-grad-2)"
            strokeWidth="120"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {vignette && (
          <div className="qa-ribbon-vignette" />
        )}
      </div>
    </>
  );
}
