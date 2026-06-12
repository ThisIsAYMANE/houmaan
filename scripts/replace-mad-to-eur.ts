import fs from 'fs'
import path from 'path'

function walkSync(dir: string, filelist: string[] = []): string[] {
  const files = fs.readdirSync(dir)
  files.forEach((file) => {
    const filepath = path.join(dir, file)
    const stat = fs.statSync(filepath)
    if (stat.isDirectory()) {
      if (!filepath.includes('node_modules') && !filepath.includes('.next')) {
        filelist = walkSync(filepath, filelist)
      }
    } else {
      if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
        filelist.push(filepath)
      }
    }
  })
  return filelist
}

function replaceInFiles() {
  const dirs = [
    path.join(__dirname, '../app'),
    path.join(__dirname, '../components'),
    path.join(__dirname, '../lib'),
  ]

  let totalReplacements = 0

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return
    const files = walkSync(dir)
    
    files.forEach(file => {
      let content = fs.readFileSync(file, 'utf8')
      let changed = false
      
      // Replace exactly 'MAD' and "MAD" 
      if (content.includes("'MAD'")) {
        content = content.replace(/'MAD'/g, "'EUR'")
        changed = true
      }
      if (content.includes('"MAD"')) {
        content = content.replace(/"MAD"/g, '"EUR"')
        changed = true
      }
      // Replace MAD text in UI
      if (content.includes(" MAD")) {
        content = content.replace(/ MAD/g, " EUR")
        changed = true
      }
      
      if (changed) {
        fs.writeFileSync(file, content, 'utf8')
        console.log(`Updated ${path.relative(process.cwd(), file)}`)
        totalReplacements++
      }
    })
  })
  console.log(`Total files updated: ${totalReplacements}`)
}

replaceInFiles()
