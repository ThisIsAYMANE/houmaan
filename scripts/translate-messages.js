const fs = require('fs')
const path = require('path')

// We will install this package via npm
const { translate } = require('@vitalets/google-translate-api')

const languages = [
  'de', 'it', 'pt', 'ar', 'zh', 'ja', 'ko', 'ru', 'tr', 'hi', 'bn', 'vi', 'th', 'id', 'nl', 'pl', 'uk', 'fa'
]

// Google translate API language code mapping if needed
const langMap = {
  'zh': 'zh-CN',
}

const flatten = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : ''
    if (typeof obj[k] === 'object') Object.assign(acc, flatten(obj[k], pre + k))
    else acc[pre + k] = obj[k]
    return acc
  }, {})
}

const unflatten = (obj) => {
  return Object.keys(obj).reduce((acc, k) => {
    const keys = k.split('.')
    let current = acc
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = obj[k]
    return acc
  }, {})
}

async function run() {
  const enPath = path.join(__dirname, '../public/messages/en.json')
  const enObj = JSON.parse(fs.readFileSync(enPath, 'utf8'))
  const flatEn = flatten(enObj)
  
  const keys = Object.keys(flatEn)
  const values = keys.map(k => flatEn[k])
  
  // Delimiter that Google Translate usually doesn't mess up
  const delimiter = ' |^^| '
  const textToTranslate = values.join(delimiter)

  console.log(`Translating ${keys.length} items to ${languages.length} languages...`)

  for (const lang of languages) {
    try {
      console.log(`Translating to ${lang}...`)
      const targetLang = langMap[lang] || lang
      const res = await translate(textToTranslate, { to: targetLang })
      
      // Google translate might add spaces around the delimiter, e.g., "| ^^ |"
      const translatedParts = res.text.split(/\|\s*\^\^\s*\|/g).map(s => s.trim())
      
      if (translatedParts.length !== keys.length) {
        console.warn(`Warning for ${lang}: Expected ${keys.length} parts, got ${translatedParts.length}. Skipping this language to avoid corruption.`)
        continue
      }

      const newFlat = {}
      keys.forEach((k, i) => {
        // Fix some capitalization issues that translation might introduce for Nav items etc if needed
        newFlat[k] = translatedParts[i]
      })

      const newObj = unflatten(newFlat)
      
      const outPath = path.join(__dirname, `../public/messages/${lang}.json`)
      fs.writeFileSync(outPath, JSON.stringify(newObj, null, 2))
      console.log(`Saved ${lang}.json`)
      
      // Sleep to avoid rate limiting
      await new Promise(r => setTimeout(r, 2000))
    } catch (e) {
      console.error(`Failed to translate ${lang}:`, e.message)
    }
  }
  console.log('Translation complete!')
}

run()
