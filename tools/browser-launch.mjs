/** Default stays bundled Chromium. An installed channel must be requested
 * explicitly, so a different rasterizer never silently blesses icon output. */
export function browserLaunchOptions(env = process.env) {
  const channel = env.QD_BROWSER_CHANNEL;
  if (channel && !/^(?:chromium|chrome(?:-beta|-dev|-canary)?|msedge(?:-beta|-dev|-canary)?)$/.test(channel)) {
    throw new Error(`Unsupported QD_BROWSER_CHANNEL: ${channel}`);
  }
  return { headless: true, ...(channel ? { channel } : {}) };
}
