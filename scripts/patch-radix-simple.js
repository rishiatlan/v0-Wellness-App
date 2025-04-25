const fs = require("fs")
const path = require("path")

// Function to recursively find files
function findFiles(dir, pattern) {
  let results = []

  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Recursively search directories
      results = results.concat(findFiles(filePath, pattern))
    } else if (pattern.test(file)) {
      // Add file if it matches the pattern
      results.push(filePath)
    }
  }

  return results
}

// Try to find Radix UI files that might use useEffectEvent
try {
  console.log("Searching for Radix UI files to patch...")

  // Look in node_modules for Radix UI packages
  const nodeModulesDir = path.resolve("./node_modules")

  // Find all .js and .mjs files in @radix-ui directories
  const radixFiles = findFiles(path.join(nodeModulesDir, "@radix-ui"), /\.(js|mjs)$/)

  console.log(`Found ${radixFiles.length} Radix UI files to check`)

  let patchedCount = 0

  // Check each file for useEffectEvent imports
  for (const file of radixFiles) {
    try {
      const content = fs.readFileSync(file, "utf8")

      // Check if the file imports useEffectEvent from React
      if (content.includes("useEffectEvent") && content.includes('from "react"')) {
        console.log(`Patching ${file}...`)

        // Replace the import with our simple implementation
        const patchedContent = content.replace(
          /import\s+\{([^}]*useEffectEvent[^}]*)\}\s+from\s+"react"/g,
          (match, importList) => {
            // Remove useEffectEvent from the import list
            const newImportList = importList
              .split(",")
              .map((item) => item.trim())
              .filter((item) => !item.includes("useEffectEvent"))
              .join(", ")

            // Add our simple implementation
            return `import {${newImportList}} from "react";\n// Simple polyfill for useEffectEvent\nconst useEffectEvent = (fn) => fn;`
          },
        )

        // Write the patched file
        fs.writeFileSync(file, patchedContent)
        patchedCount++
      }
    } catch (err) {
      console.error(`Error processing file ${file}:`, err)
    }
  }

  console.log(`Patched ${patchedCount} Radix UI files`)
} catch (err) {
  console.error("Error patching Radix UI files:", err)
}
