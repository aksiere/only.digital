/* небольшое пояснение выходных данных:
	hasFooter: у страницы есть тэг <footer>
	hasTextEN: где-то в футере есть тэг <p> с содержимым "Start a project"
	hasTextRU: где-то в футере есть тэг <p> с содержимым "Начать проект" 
*/

import { XMLParser, XMLBuilder, XMLValidator} from 'fast-xml-parser'
import puppeteer from 'puppeteer'
import { stdin, stdout } from 'node:process'

// сайтмап https://only.digital/sitemap-0.xml
import XMLSitemap from './sitemap.xml' with { type: 'text' }

const parser = new XMLParser()
const sitemap = parser.parse(XMLSitemap)

// несколько страниц без футера
const additional = [
	{ loc: 'https://only.digital/en/projects/tektorg' },
	{ loc: 'https://only.digital/en/projects/sibur' },
	{ loc: 'https://only.digital/404' }
]

const len = [...sitemap.urlset.url, ...additional].length

const browser = await puppeteer.launch()
const page = await browser.newPage()

let output = {}
let count = 0

for (const url of [...sitemap.urlset.url, ...additional]) {
	await page.goto(url.loc)
	count++

	let data = {
		count,
		loc: url.loc,
		url: page.url(),
		test: await page.evaluate(() => {
			const footer = document.querySelector('footer')

			let obj = {
				hasFooter: footer ? true : false
			}

			if (footer) {
				const p = footer.querySelector('p')

				obj.hasTextEN = p && p.textContent.trim() === 'Start a project' ? true : false,
				obj.hasTextRU = p && p.textContent.trim() === 'Начать проект' ? true : false
			}

			return obj
		})
	}

	stdout.clearLine(0)
	stdout.cursorTo(0)
	stdout.write(`urls done: ${count} / ${len}`)

	output[count] = {
		url: data.loc === data.url ? data.loc : `${data.loc} >>> ${data.url}`,
		hasFooter: data.test.hasFooter,
		hasTextEN: data.test.hasTextEN || false,
		hasTextRU: data.test.hasTextRU || false
	}
}

await browser.close()

stdout.clearLine(0)
stdout.cursorTo(0)
console.log(output)
