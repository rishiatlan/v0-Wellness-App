"use client"

const fs = require("fs")
const path = require("path")
const glob = require("glob")

console.log("Patching Radix UI packages...")

// Find the specific problematic file
const targetFile =
  "./node_modules/.pnpm/@radix-ui+react-use-effect-event@0.0.0*/node_modules/@radix-ui/react-use-effect-event/dist/index.mjs"

// Use glob to find the actual path with the wildcard
const files = glob.sync(targetFile)

if (files.length === 0) {
  console.log("Could not find the target file. Trying alternative paths...")

  // Try alternative paths
  const alternativePaths = [
    "./node_modules/@radix-ui/react-use-effect-event/dist/index.mjs",
    "./node_modules/.pnpm/@radix-ui+react-use-effect-event@*/node_modules/@radix-ui/react-use-effect-event/dist/index.mjs",
  ]

  for (const altPath of alternativePaths) {
    const altFiles = glob.sync(altPath)
    if (altFiles.length > 0) {
      files.push(...altFiles)
      console.log(`Found alternative path: ${altFiles[0]}`)
      break
    }
  }
}

if (files.length === 0) {
  console.error("Could not find any Radix UI files to patch!")
  process.exit(1)
}

let patchedCount = 0

files.forEach((filePath) => {
  try {
    console.log(`Attempting to patch: ${filePath}`)

    // Read the file content
    const content = fs.readFileSync(filePath, "utf8")

    // Check if the file imports useEffectEvent from React
    if (content.includes("import { useEffectEvent as React_useEffectEvent } from 'react';")) {
      console.log(`Patching ${filePath}...`)

      // Replace the import with our polyfill implementation
      const patchedContent = content.replace(
        "import { useEffectEvent as React_useEffectEvent } from 'react';",
        `// Polyfill for useEffectEvent which is not available in React 18
import { useRef, useEffect, useCallback } from 'react';
const React_useEffectEvent = (fn) => {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args) => ref.current(...args), []);
};`,
      )

      // Write the patched file
      fs.writeFileSync(filePath, patchedContent)
      console.log(`Successfully patched ${filePath}`)
      patchedCount++
    } else {
      console.log(`File ${filePath} doesn't contain the expected import pattern.`)
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error)
  }
})

console.log(`Patched ${patchedCount} Radix UI files`)

// Also check for other problematic files
const otherProblematicFiles = glob.sync("./node_modules/.pnpm/@radix-ui+*/node_modules/@radix-ui/*/dist/index.mjs")

otherProblematicFiles.forEach((filePath) => {
  try {
    // Read the file content
    const content = fs.readFileSync(filePath, "utf8")

    // Check if the file imports useEffectEvent from React
    if (content.includes("useEffectEvent") && content.includes("from 'react'")) {
      console.log(`Found another problematic file: ${filePath}`)

      // Replace the import with our polyfill implementation
      const patchedContent = content.replace(
        /import\s+\{\s*([^}]*useEffectEvent[^}]*)\s*\}\s+from\s+'react';/,
        (match, importList) => {
          // Remove useEffectEvent from the import list
          const newImportList = importList
            .split(",")
            .map((item) => item.trim())
            .filter((item) => !item.includes("useEffectEvent"))
            .join(", ")

          // Add our polyfill
          return `import { ${newImportList} } from 'react';
// Polyfill for useEffectEvent which is not available in React 18
import { useRef, useEffect, useCallback } from 'react';
const useEffectEvent = (fn) => {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args) => ref.current(...args), []);
};`
        },
      )

      // Write the patched file
      fs.writeFileSync(filePath, patchedContent)
      console.log(`Successfully patched ${filePath}`)
      patchedCount++
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error)
  }
})

console.log("Patching complete")
