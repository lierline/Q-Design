package app.medqraft.carnet;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.provider.Settings;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.util.TypedValue;
import android.view.View;
import android.view.animation.AnimationUtils;
import android.view.animation.Interpolator;
import android.view.animation.PathInterpolator;

/**
 * 앱을 켤 때의 장면(2026-10-11 · 오너 「조금 더 고급스럽게」).
 *
 * 붓이 긋는 연출을 걷고, 로고가 «떠오르는» 한 동작으로 줄였다. 바탕은 마지막 사이트 바탕(어두우면 먹색, 밝으면 종이색)이고
 * 그림은 투명 배경의 제품 로고(res/drawable-nodpi/launch_q.webp · tools/make-launch.py)다.
 * <pre>
 *   0~1000ms     로고가 떠오른다: 투명도 0→1 · 94%→100% 로 커지며 8dp 위로 올라온다(느리게 멈추는 곡선)
 *   600~1500ms   글자 Q-CARNET 가 자간을 좁히며 나타난다
 *   900~1500ms   글자 아래 가는 선이 가운데에서 양쪽으로 뻗는다
 *   1000~1700ms  금속 면에 빛이 한 번 스친다
 * </pre>
 * 첫 쪽이 먼저 준비돼도 장면을 끝까지 보여 준 뒤 걷는다. 더 늦으면 그 선 위로 밝은 빛이 오가고, 8초가 넘으면
 * «연결이 느립니다. 기다리는 중…». 걷힐 때는 0.28초 동안 살짝 올라가며 흐려진다. 덮는 동안 밑의 웹 화면은 눌리지 않는다.
 * <p>
 * 안드로이드의 «애니메이션 배율»(개발자 옵션 · 접근성의 «애니메이션 삭제»)을 따른다. 0 이면 장면 없이 다 그려진 모습만
 * 덮었다가 바로 걷고, 배율을 키우면 그만큼 천천히 돈다.
 */
@SuppressLint("ViewConstructor") // 화면 틀(XML)에 두지 않고 MainActivity 가 코드로만 만든다
final class LaunchView extends View {

    static final long INTRO_MS = 1700;
    static final long SLOW_HINT_MS = 8000;
    private static final long MARK_END = 1000;
    private static final long WORD_START = 600;
    private static final long WORD_END = 1500;
    private static final long RULE_START = 900;
    private static final long RULE_END = 1500;
    private static final long GLINT_START = 1000;
    private static final long WAIT_FADE_MS = 300;
    private static final long WAIT_PERIOD_MS = 1100;
    private static final long EXIT_MS = 280;
    private static final String WORDMARK = "Q-CARNET";
    private static final String SLOW_HINT = "연결이 느립니다. 기다리는 중…";

    private final boolean animate;
    /** 애니메이션 배율. 0(애니메이션 삭제)이면 장면 없이 · 걷기도 바로 */
    private final float timeScale;
    private final boolean motionOff;
    private final int bg;
    private final Bitmap mark;
    private final float density;
    private final int accent;
    private final int accentBright;
    private final int glint;

    private final Paint bitmapPaint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
    private final Paint glintPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint linePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final TextPaint wordPaint = new TextPaint(Paint.ANTI_ALIAS_FLAG);
    private final TextPaint hintPaint = new TextPaint(Paint.ANTI_ALIAS_FLAG);

    /** 느리게 멈추는 곡선(quint out) */
    private final Interpolator riseEase = new PathInterpolator(0.22f, 1f, 0.36f, 1f);
    private final Interpolator softEase = new PathInterpolator(0.2f, 0.7f, 0.2f, 1f);
    private final Interpolator inOut = new PathInterpolator(0.42f, 0f, 0.58f, 1f);

    private final RectF markRect = new RectF();
    private final Matrix matrix = new Matrix();
    private final int[] windowAt = new int[2];
    private final Rect textBounds = new Rect();
    private LinearGradient glintShader;
    private float centerX;
    private float wordBaseline;
    private float lineY;
    private float hintBaseline;
    private StaticLayout hintLayout;

    private long start = -1;
    private long waitStart = -1;
    private long exitStart = -1;
    private boolean exitAsked;
    private Runnable onGone;

    /**
     * @param bg      바탕색(마지막 사이트 바탕 · 모르면 앱 테마). 어두우면 먹색 위, 밝으면 종이색 위
     * @param animate 앱을 켤 때는 장면을 돌리고, 웹 엔진이 죽어 화면을 갈아 끼울 때는 다 그려진 모습만 덮는다
     */
    LaunchView(Context c, int bg, boolean animate) {
        super(c);
        this.bg = bg;
        float scale = durationScale(c);
        motionOff = scale <= 0f;
        this.animate = animate && !motionOff;
        timeScale = motionOff ? 1f : scale;
        density = getResources().getDisplayMetrics().density;
        boolean dark = MainActivity.isDark(bg);
        mark = BitmapFactory.decodeResource(getResources(), R.drawable.launch_q);
        int muted = c.getColor(dark ? R.color.muted_on_dark : R.color.muted_on_light);
        accent = c.getColor(R.color.loading_accent);
        accentBright = c.getColor(dark ? R.color.loading_accent_bright : R.color.loading_accent);
        glint = c.getColor(R.color.launch_glint);

        glintPaint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_ATOP));
        wordPaint.setTypeface(wordmarkFont(c));
        wordPaint.setTextSize(getResources().getDimension(R.dimen.qd_native_wordmark_size));
        wordPaint.setTextAlign(Paint.Align.CENTER);
        wordPaint.setColor(muted);
        hintPaint.setTextSize(getResources().getDimension(R.dimen.qd_native_hint_size));
        hintPaint.setTextAlign(Paint.Align.LEFT);
        hintPaint.setColor(muted);

        setClickable(true);
        setContentDescription("불러오는 중");
    }

    /** 첫 쪽이 보였다. 장면이 끝났으면 바로, 아니면 끝까지 보여 준 뒤 걷고 onGone 을 부른다 */
    void finish(Runnable onGone) {
        this.onGone = onGone;
        exitAsked = true;
        postInvalidateOnAnimation();
    }

    private static float durationScale(Context c) {
        try {
            return Settings.Global.getFloat(c.getContentResolver(), Settings.Global.ANIMATOR_DURATION_SCALE, 1f);
        } catch (RuntimeException e) {
            return 1f;
        }
    }

    /** 웹 로그인 화면과 같은 JetBrains Mono(«Q-CARNET» 글자만 뗀 조각 · tools/make-launch.py) */
    private static Typeface wordmarkFont(Context c) {
        try {
            return Typeface.createFromAsset(c.getAssets(), "fonts/wordmark-mono.ttf");
        } catch (RuntimeException e) {
            return Typeface.MONOSPACE;
        }
    }

    @Override
    protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
        super.onLayout(changed, left, top, right, bottom);
        // 로고와 글자를 한 묶음으로 «창» 한가운데에. 이 판은 root 여백(상태 표시줄 · 탐색 막대) 안쪽이라 그만큼 옮긴다
        getLocationInWindow(windowAt);
        float windowCenterY = getRootView().getHeight() / 2f - windowAt[1];
        Rect text = textBounds;
        wordPaint.getTextBounds(WORDMARK, 0, WORDMARK.length(), text);
        float w = dp(132);
        float h = w * mark.getHeight() / mark.getWidth();
        float gap = dp(22);
        float groupTop = windowCenterY - (h + gap + text.height()) / 2f;
        centerX = getWidth() / 2f;
        markRect.set(centerX - w / 2f, groupTop, centerX + w / 2f, groupTop + h);
        wordBaseline = markRect.bottom + gap - text.top;
        lineY = wordBaseline + dp(22);
        hintBaseline = lineY + dp(18) + hintPaint.getTextSize();
        int hintWidth = Math.max(1, Math.round(getWidth() - 2 * getResources().getDimension(R.dimen.qd_native_text_inset)));
        hintLayout = StaticLayout.Builder.obtain(SLOW_HINT, 0, SLOW_HINT.length(), hintPaint, hintWidth)
                .setAlignment(Layout.Alignment.ALIGN_CENTER)
                .setIncludePad(false)
                .setBreakStrategy(getResources().getInteger(R.integer.qd_native_hint_break_strategy))
                .build();
        glintShader = null;
    }

    @Override
    protected void onDraw(Canvas canvas) {
        long now = AnimationUtils.currentAnimationTimeMillis();
        if (start < 0) start = now;
        long elapsed = now - start;
        long intro = animate ? (long) (elapsed / timeScale) : INTRO_MS;
        if (exitAsked && exitStart < 0 && intro >= INTRO_MS) exitStart = now;
        float exit = exitStart < 0 ? 0f : motionOff ? 1f : clamp((now - exitStart) / (EXIT_MS * timeScale));
        if (exit >= 1f) {
            if (onGone != null) {
                Runnable gone = onGone;
                onGone = null;
                post(gone);
            }
            return;
        }
        if (exitStart < 0 && intro >= INTRO_MS && waitStart < 0) waitStart = now;

        canvas.drawColor((bg & 0x00FFFFFF) | (Math.round(255 * (1f - exit)) << 24));
        float alpha = 1f - exit;
        canvas.save();
        canvas.translate(0, -dp(8) * exit * exit);
        drawMark(canvas, intro, alpha);
        drawWordmark(canvas, intro, alpha);
        drawRule(canvas, intro, alpha);
        if (waitStart >= 0) drawWait(canvas, (long) ((now - waitStart) / timeScale), alpha);
        if (elapsed >= SLOW_HINT_MS) drawHint(canvas, elapsed - SLOW_HINT_MS, alpha);
        canvas.restore();
        postInvalidateOnAnimation();
    }

    /** 로고가 떠오른다: 투명도 · 크기 94→100% · 8dp 위로. 다 떠오르면 금속 면에 빛이 한 번 스친다 */
    private void drawMark(Canvas canvas, long t, float alpha) {
        float f = riseEase.getInterpolation(clamp(t / (float) MARK_END));
        int a = Math.round(255 * f * alpha);
        if (a <= 0) return;
        float s = 0.94f + 0.06f * f;
        canvas.save();
        canvas.translate(0, dp(8) * (1f - f));
        canvas.scale(s, s, markRect.centerX(), markRect.centerY());
        int saved = canvas.saveLayerAlpha(markRect, a);
        canvas.drawBitmap(mark, null, markRect, bitmapPaint);
        if (t >= GLINT_START && t < INTRO_MS) drawGlint(canvas, (t - GLINT_START) / (float) (INTRO_MS - GLINT_START));
        canvas.restoreToCount(saved);
        canvas.restore();
    }

    /** 오른쪽 아래로 22° 기운 좁은 빛 띠가 왼쪽에서 오른쪽으로 한 번 스친다. 그림이 있는 곳에만 비친다(SRC_ATOP) */
    private void drawGlint(Canvas canvas, float g) {
        if (g <= 0f || g >= 1f) return;
        if (glintShader == null) {
            float len = markRect.width() * 0.5f;
            float dx = (float) Math.cos(Math.toRadians(22)) * len;
            float dy = (float) Math.sin(Math.toRadians(22)) * len;
            int clear = glint & 0x00FFFFFF;
            glintShader = new LinearGradient(-dx, -dy, dx, dy, new int[] {clear, glint, clear},
                    new float[] {0.3f, 0.5f, 0.7f}, Shader.TileMode.CLAMP);
        }
        float p = inOut.getInterpolation(g);
        float envelope = g < 0.25f ? g / 0.25f : (1f - g) / 0.75f;
        matrix.setTranslate(markRect.left + markRect.width() * (-0.3f + 1.6f * p), markRect.centerY());
        glintShader.setLocalMatrix(matrix);
        glintPaint.setShader(glintShader);
        glintPaint.setAlpha(Math.round(255 * 0.9f * envelope));
        canvas.drawRect(markRect, glintPaint);
    }

    private void drawWordmark(Canvas canvas, long t, float alpha) {
        float f = softEase.getInterpolation(clamp((t - WORD_START) / (float) (WORD_END - WORD_START)));
        if (f <= 0f) return;
        wordPaint.setLetterSpacing(0.8f - 0.42f * f);
        wordPaint.setAlpha(Math.round(255 * f * alpha));
        canvas.drawText(WORDMARK, centerX, wordBaseline, wordPaint);
    }

    /** 글자 아래 가는 선(64dp)이 가운데에서 양쪽으로 뻗는다. 기다릴 때는 이 선 위로 빛이 오간다 */
    private void drawRule(Canvas canvas, long t, float alpha) {
        float f = softEase.getInterpolation(clamp((t - RULE_START) / (float) (RULE_END - RULE_START)));
        if (f <= 0f) return;
        float half = dp(32) * f;
        float h = Math.max(1f, density);
        linePaint.setColor(accent);
        linePaint.setAlpha(Math.round(255 * 0.35f * alpha));
        canvas.drawRect(centerX - half, lineY, centerX + half, lineY + h, linePaint);
    }

    /** 늦을 때: 선 위로 밝은 금속 빛이 오간다 */
    private void drawWait(Canvas canvas, long since, float alpha) {
        float f = clamp(since / (float) WAIT_FADE_MS) * alpha;
        if (f <= 0f) return;
        float half = dp(32);
        float h = Math.max(1f, density);
        float seg = half * 2 * 0.4f;
        float phase = inOut.getInterpolation((since % WAIT_PERIOD_MS) / (float) WAIT_PERIOD_MS);
        float x = centerX - half - seg + (half * 2 + seg) * phase;
        canvas.save();
        canvas.clipRect(centerX - half, lineY, centerX + half, lineY + h);
        linePaint.setColor(accentBright);
        linePaint.setAlpha(Math.round(255 * f));
        canvas.drawRect(x, lineY, x + seg, lineY + h, linePaint);
        canvas.restore();
    }

    private void drawHint(Canvas canvas, long since, float alpha) {
        float f = clamp(since / (float) WAIT_FADE_MS) * alpha;
        if (f <= 0f) return;
        hintPaint.setAlpha(Math.round(255 * f));
        if (hintLayout == null) return;
        canvas.save();
        canvas.translate(centerX - hintLayout.getWidth() / 2f, hintBaseline - hintLayout.getLineBaseline(0));
        hintLayout.draw(canvas);
        canvas.restore();
    }

    private float dp(float v) {
        return v * density;
    }

    private float sp(float v) {
        return TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, v, getResources().getDisplayMetrics());
    }

    private static float clamp(float v) {
        return v < 0f ? 0f : (v > 1f ? 1f : v);
    }
}
