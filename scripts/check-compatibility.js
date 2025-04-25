const fs = require("fs")
const path = require("path")
const glob = require("glob")

console.log("Checking for compatibility issues...")

// Check for React 19 features in code
const react19Features = ["React.cache", "React.use", "useActionState", "useFormStatus", "useOptimistic"]

const files = glob.sync("./app/**/*.{ts,tsx,js,jsx}")
let issuesFound = false

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8")

  react19Features.forEach((feature) => {
    if (content.includes(feature)) {
      console.log(`⚠️ Potential React 19 feature "${feature}" found in ${file}`)
      issuesFound = true
    }
  })
})

// Check package.json for version mismatches
const packageJson = require("../package.json")
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

if (dependencies.react !== "18.2.0") {
  console.log(`⚠️ React version mismatch: ${dependencies.react} (should be 18.2.0)`)
  issuesFound = true
}

if (dependencies["react-dom"] !== "18.2.0") {
  console.log(`⚠️ React DOM version mismatch: ${dependencies["react-dom"]} (should be 18.2.0)`)
  issuesFound = true
}

if (dependencies.next && !dependencies.next.startsWith("14.")) {
  console.log(`⚠️ Next.js version might not be compatible with React 18: ${dependencies.next}`)
  issuesFound = true
}

if (!issuesFound) {
  console.log("✅ No compatibility issues found!")
} else {
  console.log("⚠️ Compatibility issues found. Please fix them before deploying.")
}
