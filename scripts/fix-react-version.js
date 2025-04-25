console.log("Running React version fix script...")

try {
  // Run the Radix UI patch script
  require("./patch-radix")
} catch (error) {
  console.error("Error running patch-radix.js:", error)
}

// Force React 18 in package.json
try {
  const fs = require("fs")
  const path = require("path")

  // Update package.json to force React 18
  const packageJsonPath = path.resolve("./package.json")
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

    // Force React 18
    packageJson.dependencies = packageJson.dependencies || {}
    packageJson.dependencies.react = "18.2.0"
    packageJson.dependencies["react-dom"] = "18.2.0"

    // Force React 18 types
    packageJson.devDependencies = packageJson.devDependencies || {}
    packageJson.devDependencies["@types/react"] = "18.2.0"
    packageJson.devDependencies["@types/react-dom"] = "18.2.0"

    // Add overrides/resolutions
    packageJson.pnpm = packageJson.pnpm || {}
    packageJson.pnpm.overrides = {
      react: "18.2.0",
      "react-dom": "18.2.0",
      "@types/react": "18.2.0",
      "@types/react-dom": "18.2.0",
    }

    // Write back the modified package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    console.log("Updated package.json to force React 18")
  }
} catch (error) {
  console.error("Error updating package.json:", error)
}

console.log("React version fix script completed")
