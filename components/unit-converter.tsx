"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calculator } from "lucide-react"

interface UnitConverterProps {
  defaultUnit?: "oz" | "ml"
}

export function UnitConverter({ defaultUnit = "oz" }: UnitConverterProps) {
  const [value, setValue] = useState<string>("")
  const [unit, setUnit] = useState<"oz" | "ml">(defaultUnit)
  const [convertedValue, setConvertedValue] = useState<string>("")

  // Save preference to localStorage
  useEffect(() => {
    const savedUnit = localStorage.getItem("preferredWaterUnit")
    if (savedUnit === "oz" || savedUnit === "ml") {
      setUnit(savedUnit)
    }
  }, [])

  // Update preference when changed
  useEffect(() => {
    localStorage.setItem("preferredWaterUnit", unit)
  }, [unit])

  // Convert value when input changes
  useEffect(() => {
    if (!value || isNaN(Number(value))) {
      setConvertedValue("")
      return
    }

    const numValue = Number(value)

    if (unit === "oz") {
      // Convert oz to ml
      setConvertedValue(`${Math.round(numValue * 29.5735)} ml`)
    } else {
      // Convert ml to oz
      setConvertedValue(`${(numValue / 29.5735).toFixed(1)} oz`)
    }
  }, [value, unit])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Calculator className="h-3.5 w-3.5" />
          <span>Convert Units</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Water Unit Converter</h4>
            <p className="text-sm text-muted-foreground">Convert between ounces (oz) and milliliters (ml)</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="col-span-2"
                type="number"
                placeholder="Enter value"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <Label htmlFor="unit">Unit</Label>
              <div className="col-span-2 flex gap-2">
                <Button
                  variant={unit === "oz" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUnit("oz")}
                  className="flex-1"
                >
                  Ounces (oz)
                </Button>
                <Button
                  variant={unit === "ml" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUnit("ml")}
                  className="flex-1"
                >
                  Milliliters (ml)
                </Button>
              </div>
            </div>
            {convertedValue && (
              <div className="mt-2 rounded-md bg-muted p-2 text-center font-medium">
                {value} {unit} = {convertedValue}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
