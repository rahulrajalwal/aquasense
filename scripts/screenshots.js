// Captures presentation screenshots of the running dev server using the
// system Chrome (puppeteer-core). Drives the analyze wizard for the
// results view. Output: docs/screenshots/*.png (1440x900 @2x).
const path = require('path')

const BASE = 'http://localhost:3000'
const OUT = path.join(__dirname, '..', 'docs', 'screenshots')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const puppeteer = (await import('puppeteer-core')).default
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-first-run', '--hide-scrollbars'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  })
  const page = await browser.newPage()

  const shot = async (name, opts = {}) => {
    await page.screenshot({ path: path.join(OUT, name), ...opts })
    console.log('captured', name)
  }
  const go = async (url, wait = 2500) => {
    await page.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 60000 })
    await sleep(wait)
  }

  // 1. home hero
  await go('/', 3000)
  await shot('home.png')

  // 2. study area
  await go('/study-area', 2500)
  await shot('study.png')

  // 3. map (tiles need extra time)
  await go('/map', 6000)
  await shot('map.png')

  // 4. wizard step 1
  await go('/analyze', 2000)
  await shot('wizard.png')

  // 5. wizard step 3 (data match + VES ask) via deep link
  await go('/analyze?taluka=mulshi&place=Lavale&lat=18.5431&lon=73.715', 2000)
  await page.click('#btn-step2')
  await sleep(2500)
  await shot('datamatch.png')

  // 6. results (auto-run)
  await go('/analyze?taluka=mulshi&place=Lavale&lat=18.5431&lon=73.715&run=1', 5000)
  await shot('results.png')
  // scroll to factor charts for a second results frame
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('h3')).find((h) =>
      h.textContent.includes('Rule engine — factor contributions'),
    )
    el?.scrollIntoView({ block: 'start' })
    window.scrollBy(0, -80)
  })
  await sleep(1500)
  await shot('results2.png')

  // 7. dashboard
  await go('/dashboard', 4000)
  await shot('dashboard.png')

  // 8. ML lab (train for learning curves first)
  await go('/ml-lab', 2500)
  await page.click('#btn-train')
  await sleep(4500)
  await shot('mllab.png')
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('h3')).find((h) => h.textContent.includes('Learned weights'))
    el?.scrollIntoView({ block: 'start' })
    window.scrollBy(0, -80)
  })
  await sleep(1200)
  await shot('mllab2.png')

  // 9. report
  await go('/report', 2500)
  await shot('report.png')

  await browser.close()
  console.log('done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
